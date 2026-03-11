import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { selectProfileDocumentData } from '../features/documents/document-data'
import { useAppStore } from '../store/app-store'

interface CopyValueItem {
  display: string
  copyValue: string
}

interface FieldRow {
  values: CopyValueItem[]
  label: string
  multiline?: boolean
  inline?: boolean
}

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

const toTitleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())

const buildDateFormats = (value: string | null): CopyValueItem[] => {
  if (!value) {
    return []
  }

  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return [{ display: value, copyValue: value }]
  }

  const formats = [
    `${month}/${day}/${year}`,
    `${month}${day}${year}`,
    `${year}${month}${day}`,
    `${year}-${month}-${day}`,
    `${day}/${month}/${year}`,
  ]

  return Array.from(new Set(formats)).map((format) => ({ display: format, copyValue: format }))
}

const buildSingleValue = (value: string | null | undefined): CopyValueItem[] => {
  const trimmed = value?.trim() ?? ''
  return trimmed ? [{ display: trimmed, copyValue: trimmed }] : []
}

const buildDateRow = (label: string, value: string | null): FieldRow => ({
  label,
  values: buildDateFormats(value),
  inline: true,
})

const CopyValueButton = ({
  item,
  copyKey,
  copiedKey,
  onCopy,
  multiline = false,
  inline = false,
}: {
  item: CopyValueItem
  copyKey: string
  copiedKey: string | null
  onCopy: (copyKey: string, value: string) => void
  multiline?: boolean
  inline?: boolean
}) => (
  <button
    className={[
      'relative min-w-0 overflow-hidden rounded-lg border border-app-border-muted bg-app-surface-muted px-3 py-2 text-left text-sm text-app-text transition hover:border-app-primary-muted hover:bg-app-primary-soft',
      inline ? 'inline-flex w-auto max-w-full items-center' : 'w-full',
      multiline ? 'max-h-24 whitespace-pre-wrap wrap-break-word' : 'truncate whitespace-nowrap',
      copiedKey === copyKey ? 'border-app-success-muted bg-app-success-soft text-app-success-contrast' : '',
    ].join(' ')}
    onClick={() => onCopy(copyKey, item.copyValue)}
    title={item.copyValue}
    type="button"
  >
    <span className={['block min-w-0 pr-16', multiline ? 'wrap-break-word' : 'truncate'].join(' ')}>{item.display}</span>
    {copiedKey === copyKey ? (
      <span className="absolute inset-0 flex items-center justify-center bg-app-success-soft/95 text-xs font-semibold uppercase tracking-[0.18em] text-app-success">
        Copied!
      </span>
    ) : null}
  </button>
)

const DataTable = ({
  title,
  description,
  rows,
  emptyMessage,
  copiedKey,
  onCopy,
}: {
  title: string
  description?: string
  rows: FieldRow[]
  emptyMessage?: string
  copiedKey: string | null
  onCopy: (copyKey: string, value: string) => void
}) => {
  const populatedRows = rows.filter((row) => row.values.length > 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-app-border-muted bg-app-surface shadow-sm">
      <div className="border-b border-app-border-muted bg-app-surface-muted px-5 py-4">
        <h3 className="wrap-break-word text-base font-semibold text-app-heading">{title}</h3>
        {description ? <p className="mt-1 text-sm text-app-text-subtle">{description}</p> : null}
      </div>

      {populatedRows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-app-text-subtle">{emptyMessage || 'No data available.'}</p>
      ) : (
        <table className="w-full table-fixed border-collapse">
          <tbody>
            {populatedRows.map((row) => (
              <tr key={row.label} className="border-t border-app-border-muted align-top first:border-t-0">
                <th className="w-56 wrap-break-word bg-app-surface-muted px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-app-text-subtle">
                  {row.label}
                </th>
                <td className="min-w-0 px-5 py-4">
                  <div className={row.inline ? 'min-w-0 flex flex-wrap gap-2' : 'min-w-0 space-y-2'}>
                    {row.values.map((item, index) => (
                      <CopyValueButton
                        key={`${row.label}-${index}-${item.copyValue}`}
                        copyKey={`${title}-${row.label}-${index}`}
                        copiedKey={copiedKey}
                        item={item}
                        inline={row.inline ?? false}
                        multiline={row.multiline ?? false}
                        onCopy={onCopy}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export const ApplicationPage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const documentData = useMemo(() => selectProfileDocumentData(data, profileId), [data, profileId])

  if (!documentData) {
    return (
      <div className="rounded-2xl border border-app-border-muted bg-app-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-app-heading">Application unavailable</h1>
        <p className="mt-3 text-sm text-app-text-subtle">The selected profile could not be found.</p>
        <Link className="mt-5 inline-flex rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted" to="/profiles">
          Return to profiles
        </Link>
      </div>
    )
  }

  const attachedJob = documentData.profile.jobId ? documentData.job : null
  const personalDetails = documentData.profile.personalDetails
  const handleCopy = (key: string, value: string) => {
    void copyText(value)
      .then(() => {
        setCopiedKey(key)
        window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500)
      })
      .catch(() => {
        setCopiedKey(null)
      })
  }

  const personalInfoRows: FieldRow[] = [
    { label: 'Full name', values: buildSingleValue(personalDetails.fullName || documentData.profile.name) },
    { label: 'Email', values: buildSingleValue(personalDetails.email) },
    { label: 'Phone', values: buildSingleValue(personalDetails.phone) },
    { label: 'Address line 1', values: buildSingleValue(personalDetails.addressLine1) },
    { label: 'Address line 2', values: buildSingleValue(personalDetails.addressLine2) },
    { label: 'Address line 3', values: buildSingleValue(personalDetails.addressLine3) },
    { label: 'City', values: buildSingleValue(personalDetails.city) },
    { label: 'State', values: buildSingleValue(personalDetails.state) },
    { label: 'Postal code', values: buildSingleValue(personalDetails.postalCode) },
    ...documentData.profileLinks.map((link, index) => ({
      label: link.name || `Link ${index + 1}`,
      values: buildSingleValue(link.url),
    })),
  ]

  return (
    <div className="space-y-8">
      <div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-app-primary">Application Content</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-heading">{documentData.profile.name || 'Unnamed profile'}</h1>
          <p className="mt-2 text-sm text-app-text-subtle">
            {attachedJob ? `Job profile for ${attachedJob.jobTitle || 'Untitled role'} at ${attachedJob.companyName || 'Unknown company'}` : 'Base profile'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <DataTable copiedKey={copiedKey} description="Personal details and links from the selected profile." onCopy={handleCopy} rows={personalInfoRows} title="Personal Info" />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-app-heading">Experience Entries</h2>
          {documentData.experienceEntries.length === 0 ? (
            <p className="text-sm text-app-text-subtle">No experience entries enabled.</p>
          ) : (
            documentData.experienceEntries.map(({ entry, bullets }, index) => (
              <DataTable
                key={entry.id}
                copiedKey={copiedKey}
                description={`Experience entry ${index + 1}`}
                emptyMessage="No experience data available."
                onCopy={handleCopy}
                rows={[
                  { label: 'Company', values: buildSingleValue(entry.company) },
                  { label: 'Title', values: buildSingleValue(entry.title) },
                  { label: 'Location', values: buildSingleValue(entry.location) },
                  {
                    label: 'Work arrangement',
                    values: entry.workArrangement !== 'unknown' ? buildSingleValue(toTitleCase(entry.workArrangement)) : [],
                  },
                  {
                    label: 'Employment type',
                    values: entry.employmentType !== 'other' ? buildSingleValue(toTitleCase(entry.employmentType)) : [],
                  },
                  buildDateRow('Start date', entry.startDate),
                  buildDateRow('End date', entry.endDate),
                  { label: 'Current role', values: buildSingleValue(entry.isCurrent ? 'Yes' : 'No') },
                  ...bullets.map((bullet, bulletIndex) => ({
                    label: `Bullet ${bulletIndex + 1}`,
                    values: buildSingleValue(bullet.content),
                    multiline: true,
                  })),
                  { label: 'Reason for leaving (short)', values: buildSingleValue(entry.reasonForLeavingShort) },
                  {
                    label: 'Reason for leaving (details)',
                    values: buildSingleValue(entry.reasonForLeavingDetails),
                    multiline: true,
                  },
                  { label: 'Supervisor name', values: buildSingleValue(entry.supervisor.name) },
                  { label: 'Supervisor title', values: buildSingleValue(entry.supervisor.title) },
                  { label: 'Supervisor phone', values: buildSingleValue(entry.supervisor.phone) },
                  { label: 'Supervisor email', values: buildSingleValue(entry.supervisor.email) },
                ]}
                title={`${entry.title || 'Untitled role'}${entry.company ? ` · ${entry.company}` : ''}`}
              />
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-app-heading">Education Entries</h2>
          {documentData.educationEntries.length === 0 ? (
            <p className="text-sm text-app-text-subtle">No education entries enabled.</p>
          ) : (
            documentData.educationEntries.map((item, index) => (
              <DataTable
                key={item.entry.id}
                copiedKey={copiedKey}
                description={`Education entry ${index + 1}`}
                onCopy={handleCopy}
                rows={[
                  { label: 'School', values: buildSingleValue(item.entry.school) },
                  { label: 'Degree', values: buildSingleValue(item.entry.degree) },
                  buildDateRow('Graduation date', item.entry.graduationDate),
                  ...item.bullets.map((bullet, bulletIndex) => ({
                    label: `Bullet ${bulletIndex + 1}`,
                    values: buildSingleValue(bullet.content),
                    multiline: true,
                  })),
                ]}
                title={`${item.entry.school || 'School'}${item.entry.degree ? ` · ${item.entry.degree}` : ''}`}
              />
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-app-heading">Certifications</h2>
          {documentData.certifications.length === 0 ? (
            <p className="text-sm text-app-text-subtle">No certifications enabled.</p>
          ) : (
            documentData.certifications.map((entry, index) => (
              <DataTable
                key={entry.id}
                copiedKey={copiedKey}
                description={`Certification ${index + 1}`}
                onCopy={handleCopy}
                rows={[
                  { label: 'Name', values: buildSingleValue(entry.name) },
                  { label: 'Issuer', values: buildSingleValue(entry.issuer) },
                  buildDateRow('Issue date', entry.issueDate),
                  buildDateRow('Expiry date', entry.expiryDate),
                  { label: 'Credential ID', values: buildSingleValue(entry.credentialId) },
                  { label: 'Credential URL', values: buildSingleValue(entry.credentialUrl) },
                ]}
                title={entry.name || `Certification ${index + 1}`}
              />
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-app-heading">Skill Categories and Skills</h2>
          {documentData.skillCategories.length === 0 ? (
            <p className="text-sm text-app-text-subtle">No enabled skill categories or skills.</p>
          ) : (
            documentData.skillCategories.map((item, index) => (
              <DataTable
                key={item.category.id}
                copiedKey={copiedKey}
                description={`Skill category ${index + 1}`}
                onCopy={handleCopy}
                rows={[
                  { label: 'Category', values: buildSingleValue(item.category.name || 'General') },
                  {
                    label: 'Skills',
                    values: item.skills.map((skill) => ({ display: skill.name, copyValue: skill.name })),
                    inline: true,
                  },
                ]}
                title={item.category.name || `Skill category ${index + 1}`}
              />
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-app-heading">References</h2>
          {documentData.references.length === 0 ? (
            <p className="text-sm text-app-text-subtle">No references enabled.</p>
          ) : (
            documentData.references.map((entry, index) => (
              <DataTable
                key={entry.id}
                copiedKey={copiedKey}
                description={`Reference ${index + 1}`}
                onCopy={handleCopy}
                rows={[
                  { label: 'Type', values: buildSingleValue(toTitleCase(entry.type)) },
                  { label: 'Name', values: buildSingleValue(entry.name) },
                  { label: 'Relationship', values: buildSingleValue(entry.relationship) },
                  { label: 'Company', values: buildSingleValue(entry.company) },
                  { label: 'Title', values: buildSingleValue(entry.title) },
                  { label: 'Email', values: buildSingleValue(entry.email) },
                  { label: 'Phone', values: buildSingleValue(entry.phone) },
                  { label: 'Notes', values: buildSingleValue(entry.notes), multiline: true },
                ]}
                title={entry.name || `Reference ${index + 1}`}
              />
            ))
          )}
        </section>
      </div>
    </div>
  )
}
