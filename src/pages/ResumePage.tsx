import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { DocumentProfileHeader } from '../features/documents/DocumentProfileHeader'
import { PreviewNotFound } from '../features/documents/DocumentPageLayout'
import { formatDateRange, getOrderedResumeSections, selectProfilePreviewData } from '../features/documents/preview-data'
import { useAppStore } from '../store/app-store'

const formatExperienceMeta = (input: {
  company: string
  location: string
  workArrangement: string
  employmentType: string
}) => {
  const workArrangement = input.workArrangement !== 'unknown' ? input.workArrangement.replace('_', ' ') : ''
  const employmentType = input.employmentType !== 'other' ? input.employmentType.replace('_', ' ') : ''

  return [input.company, input.location, workArrangement, employmentType].filter(Boolean).join(' · ')
}

export const ResumePage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)

  const preview = useMemo(() => selectProfilePreviewData(data, profileId), [data, profileId])

  if (!preview) {
    return <PreviewNotFound message="The selected profile could not be found." />
  }
  const summaryParagraphs = preview.profile.summary
    .split(/\n+/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const orderedSections = getOrderedResumeSections(preview.profile).filter((section) => section.enabled)

  return (
    <div className="document-preview-shell">
      <article className="document-page">
        <DocumentProfileHeader preview={preview} />

        {orderedSections.map((orderedSection) => {
          switch (orderedSection.section) {
            case 'summary':
              return summaryParagraphs.length > 0 ? (
                <section key="summary" className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</h3>
                  <div className="mt-3 space-y-4 text-sm leading-7 text-slate-700">
                    {summaryParagraphs.map((paragraph, index) => (
                      <p key={`${preview.profile.id}-summary-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ) : null
            case 'skills':
              return preview.skillCategories.length > 0 ? (
                <section key="skills" className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Skills</h3>
                  <div className="resume-skills-grid mt-4">
                    {preview.skillCategories.map((item) => (
                      <div key={item.category.id} className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">{item.category.name || 'General'}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{item.skills.map((skill) => skill.name).join(' · ') || 'No skills listed yet.'}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null
            case 'experience':
              return preview.experienceEntries.length > 0 ? (
                <section key="experience" className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Experience</h3>
                  <div className="mt-4 space-y-5">
                    {preview.experienceEntries.map((entry) => (
                      <div key={entry.entry.id}>
                        <div className="resume-experience-header">
                          <div>
                            <h4 className="text-base font-semibold text-slate-950">{entry.entry.title || 'Untitled role'}</h4>
                            <p className="text-sm text-slate-700">
                              {formatExperienceMeta({
                                company: entry.entry.company,
                                location: entry.entry.location,
                                workArrangement: entry.entry.workArrangement,
                                employmentType: entry.entry.employmentType,
                              })}
                            </p>
                          </div>
                          <p className="resume-experience-date text-sm text-slate-500">{formatDateRange(entry.entry.startDate, entry.entry.endDate, entry.entry.isCurrent)}</p>
                        </div>
                        {entry.bullets.length > 0 ? (
                          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                            {entry.bullets.map((bullet) => (
                              <li key={bullet.id}>{bullet.content}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null
            case 'education':
              return (
                <section key="education" className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Education</h3>
                  <div className="mt-4 space-y-4 text-sm text-slate-700">
                    {preview.educationEntries.length === 0 ? (
                      <p className="text-slate-500">No education entries enabled.</p>
                    ) : (
                      preview.educationEntries.map((entry) => (
                        <div key={entry.id}>
                          <p className="font-semibold text-slate-900">{entry.school || 'School'}</p>
                          <p>{entry.degree || 'Degree not set'}</p>
                          <p className="text-slate-500">{entry.graduationDate || 'Date not set'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )
            case 'certifications':
              return (
                <section key="certifications" className="mt-8">
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
                </section>
              )
            case 'references':
              return (
                <section key="references" className="mt-8">
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
                </section>
              )
            default:
              return null
          }
        })}
      </article>
    </div>
  )
}
