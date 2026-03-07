import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { DocumentPageLayout, PreviewNotFound } from '../features/documents/DocumentPageLayout'
import { formatLocationLine, selectProfilePreviewData } from '../features/documents/preview-data'
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
      'relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-800 transition hover:border-sky-300 hover:bg-sky-50',
      inline ? 'inline-flex w-auto max-w-full items-center' : 'w-full',
      multiline ? 'max-h-24 whitespace-pre-wrap' : 'truncate whitespace-nowrap',
      copiedKey === copyKey ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : '',
    ].join(' ')}
    onClick={() => onCopy(copyKey, item.copyValue)}
    title={item.copyValue}
    type="button"
  >
    <span className="block pr-16">{item.display}</span>
    {copiedKey === copyKey ? (
      <span className="absolute inset-0 flex items-center justify-center bg-emerald-50/95 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>

      {populatedRows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-500">{emptyMessage || 'No data available.'}</p>
      ) : (
        <table className="min-w-full border-collapse">
          <tbody>
            {populatedRows.map((row) => (
              <tr key={row.label} className="border-t border-slate-200 align-top first:border-t-0">
                <th className="w-56 bg-slate-50 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {row.label}
                </th>
                <td className="px-5 py-4">
                  <div className={row.inline ? 'flex flex-wrap gap-2' : 'space-y-2'}>
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

export const ApplicationPreviewPage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const preview = useMemo(() => selectProfilePreviewData(data, profileId), [data, profileId])

  if (!preview) {
    return <PreviewNotFound message="The selected profile could not be found." />
  }

  const personalDetails = preview.profile.personalDetails
  const locationLine = formatLocationLine(personalDetails.city, personalDetails.state, personalDetails.postalCode)
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
    { label: 'Full name', values: buildSingleValue(personalDetails.fullName || preview.profile.name) },
    { label: 'Email', values: buildSingleValue(personalDetails.email) },
    { label: 'Phone', values: buildSingleValue(personalDetails.phone) },
    { label: 'Address line 1', values: buildSingleValue(personalDetails.addressLine1) },
    { label: 'Address line 2', values: buildSingleValue(personalDetails.addressLine2) },
    { label: 'Address line 3', values: buildSingleValue(personalDetails.addressLine3) },
    { label: 'Location', values: buildSingleValue(locationLine) },
    { label: 'LinkedIn', values: buildSingleValue(preview.profile.links.linkedinUrl) },
    { label: 'GitHub', values: buildSingleValue(preview.profile.links.githubUrl) },
    { label: 'Portfolio', values: buildSingleValue(preview.profile.links.portfolioUrl) },
    { label: 'Website', values: buildSingleValue(preview.profile.links.websiteUrl) },
  ]

  return (
    <DocumentPageLayout
      activeDocument="application"
      profileId={preview.profile.id}
      subtitle="Raw, copy-friendly profile data for filling out online application forms. Click any value to copy it."
      title={`${preview.profile.name || 'Profile'} application preview`}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
          Click any value to copy it. Date fields include multiple formats so you can choose the one an application form expects.
        </div>

        <DataTable copiedKey={copiedKey} description="Personal details and links from the selected profile." onCopy={handleCopy} rows={personalInfoRows} title="Personal Info" />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-950">Experience Entries</h2>
          {preview.experienceEntries.length === 0 ? (
            <p className="text-sm text-slate-500">No experience entries enabled.</p>
          ) : (
            preview.experienceEntries.map(({ entry, bullets }, index) => (
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
                  ...bullets.map((bullet, bulletIndex) => ({
                    label: `Bullet ${bulletIndex + 1}`,
                    values: buildSingleValue(bullet.content),
                    multiline: true,
                  })),
                ]}
                title={`${entry.title || 'Untitled role'}${entry.company ? ` · ${entry.company}` : ''}`}
              />
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-950">Education Entries</h2>
          {preview.educationEntries.length === 0 ? (
            <p className="text-sm text-slate-500">No education entries enabled.</p>
          ) : (
            preview.educationEntries.map((entry, index) => (
              <DataTable
                key={entry.id}
                copiedKey={copiedKey}
                description={`Education entry ${index + 1}`}
                onCopy={handleCopy}
                rows={[
                  { label: 'School', values: buildSingleValue(entry.school) },
                  { label: 'Degree', values: buildSingleValue(entry.degree) },
                  buildDateRow('Graduation date', entry.graduationDate),
                ]}
                title={`${entry.school || 'School'}${entry.degree ? ` · ${entry.degree}` : ''}`}
              />
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-950">Certifications</h2>
          {preview.certifications.length === 0 ? (
            <p className="text-sm text-slate-500">No certifications enabled.</p>
          ) : (
            preview.certifications.map((entry, index) => (
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
          <h2 className="text-lg font-semibold text-slate-950">Skill Categories and Skills</h2>
          {preview.skillCategories.length === 0 ? (
            <p className="text-sm text-slate-500">No enabled skill categories or skills.</p>
          ) : (
            preview.skillCategories.map((item, index) => (
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
          <h2 className="text-lg font-semibold text-slate-950">References</h2>
          {preview.references.length === 0 ? (
            <p className="text-sm text-slate-500">No references enabled.</p>
          ) : (
            preview.references.map((entry, index) => (
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
    </DocumentPageLayout>
  )
}
