import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { DocumentPageLayout, PreviewNotFound } from '../features/documents/DocumentPageLayout'
import { formatAddressLines, formatDateRange, formatLocationLine, selectProfilePreviewData } from '../features/documents/preview-data'
import { useAppStore } from '../store/app-store'

export const ResumePreviewPage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)

  const preview = useMemo(() => selectProfilePreviewData(data, profileId), [data, profileId])

  if (!preview) {
    return <PreviewNotFound message="The selected profile could not be found." />
  }

  const addressLines = formatAddressLines([
    preview.profile.personalDetails.addressLine1,
    preview.profile.personalDetails.addressLine2,
    preview.profile.personalDetails.addressLine3,
    preview.profile.personalDetails.addressLine4,
  ])
  const locationLine = formatLocationLine(
    preview.profile.personalDetails.city,
    preview.profile.personalDetails.state,
    preview.profile.personalDetails.postalCode,
  )
  const links = [
    preview.profile.links.linkedinUrl,
    preview.profile.links.githubUrl,
    preview.profile.links.portfolioUrl,
    preview.profile.links.websiteUrl,
  ].filter(Boolean)

  return (
    <DocumentPageLayout
      activeDocument="resume"
      profileId={preview.profile.id}
      subtitle="A printable resume view generated from the selected profile."
      title={preview.profile.name || 'Resume preview'}
    >
      <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="border-b border-slate-200 pb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            {preview.profile.personalDetails.fullName || preview.profile.name || 'Unnamed candidate'}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            {preview.profile.personalDetails.email ? <span>{preview.profile.personalDetails.email}</span> : null}
            {preview.profile.personalDetails.phone ? <span>{preview.profile.personalDetails.phone}</span> : null}
            {locationLine ? <span>{locationLine}</span> : null}
          </div>
          {addressLines.length > 0 ? <p className="mt-2 text-sm text-slate-600">{addressLines.join(' · ')}</p> : null}
          {links.length > 0 ? <p className="mt-2 text-sm text-sky-700">{links.join(' · ')}</p> : null}
        </header>

        {preview.profile.summary.trim() ? (
          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">{preview.profile.summary}</p>
          </section>
        ) : null}

        {preview.skillCategories.length > 0 ? (
          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Skills</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {preview.skillCategories.map((item) => (
                <div key={item.category.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.category.name || 'General'}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.skills.map((skill) => skill.name).join(' · ') || 'No skills listed yet.'}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {preview.experienceEntries.length > 0 ? (
          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Experience</h3>
            <div className="mt-4 space-y-5">
              {preview.experienceEntries.map((entry) => (
                <div key={entry.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-950">{entry.title || 'Untitled role'}</h4>
                      <p className="text-sm text-slate-700">{[entry.company, entry.location].filter(Boolean).join(' · ')}</p>
                    </div>
                    <p className="text-sm text-slate-500">{formatDateRange(entry.startDate, entry.endDate, entry.isCurrent)}</p>
                  </div>
                  {entry.description.trim() ? <p className="mt-3 text-sm leading-7 text-slate-700">{entry.description}</p> : null}
                  {entry.bullets.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                      {entry.bullets.filter((bullet) => bullet.trim()).map((bullet, index) => (
                        <li key={`${entry.id}-${index}`}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(preview.educationEntries.length > 0 || preview.certifications.length > 0 || preview.references.length > 0) ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Education</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                {preview.educationEntries.length === 0 ? (
                  <p className="text-slate-500">No education entries enabled.</p>
                ) : (
                  preview.educationEntries.map((entry) => (
                    <div key={entry.id}>
                      <p className="font-semibold text-slate-900">{entry.school || 'School'}</p>
                      <p>{[entry.degree, entry.fieldOfStudy].filter(Boolean).join(' · ')}</p>
                      <p className="text-slate-500">{entry.graduationDate || 'Date not set'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Certifications</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                {preview.certifications.length === 0 ? (
                  <p className="text-slate-500">No certifications enabled.</p>
                ) : (
                  preview.certifications.map((entry) => (
                    <div key={entry.id}>
                      <p className="font-semibold text-slate-900">{entry.name || 'Certification'}</p>
                      <p>{entry.issuer || 'Issuer not set'}</p>
                      <p className="text-slate-500">{entry.issueDate || 'Issue date not set'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">References</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                {preview.references.length === 0 ? (
                  <p className="text-slate-500">No references enabled.</p>
                ) : (
                  preview.references.map((entry) => (
                    <div key={entry.id}>
                      <p className="font-semibold text-slate-900">{entry.name || 'Reference'}</p>
                      <p>{[entry.title, entry.company].filter(Boolean).join(' · ')}</p>
                      <p className="text-slate-500">{entry.email || entry.phone || 'Contact details not set'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}
      </article>
    </DocumentPageLayout>
  )
}
