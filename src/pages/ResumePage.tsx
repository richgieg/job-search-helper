import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { AppShell } from '../app/layout/AppLayout'
import { DocumentProfileHeader } from '../features/documents/DocumentProfileHeader'
import { DocumentNotFound } from '../features/documents/DocumentNotFound'
import { formatDateRange, getOrderedResumeSections, selectProfileDocumentData } from '../features/documents/document-data'
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

  const documentData = useMemo(() => selectProfileDocumentData(data, profileId), [data, profileId])

  if (!documentData) {
    return (
      <AppShell>
        <DocumentNotFound message="The selected profile could not be found." />
      </AppShell>
    )
  }
  const summaryParagraphs = documentData.profile.summary
    .split(/\n+/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const orderedSections = getOrderedResumeSections(documentData.profile).filter((section) => section.enabled)

  return (
    <div className="document-preview-shell">
      <article className="document-page text-black">
        <DocumentProfileHeader documentData={documentData} />

        {orderedSections.map((orderedSection) => {
          switch (orderedSection.section) {
            case 'summary':
              return summaryParagraphs.length > 0 ? (
                <section key="summary" className="mt-6">
                  <h3 className="border-b border-black pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-black">Summary</h3>
                  <div className="mt-3 space-y-4 text-sm leading-5 text-black">
                    {summaryParagraphs.map((paragraph, index) => (
                      <p key={`${documentData.profile.id}-summary-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ) : null
            case 'skills':
              return documentData.skillCategories.length > 0 ? (
                <section key="skills" className="mt-8">
                  <h3 className="border-b border-black pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-black">Skills</h3>
                  <div className="mt-4 space-y-4">
                    {documentData.skillCategories.map((item) => (
                      <div key={item.category.id}>
                        <p className="text-sm font-semibold text-black">{item.category.name || 'General'}</p>
                        <p className="mt-2 text-sm leading-5 text-black">{item.skills.map((skill) => skill.name).join(' · ') || 'No skills listed yet.'}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null
            case 'experience':
              return documentData.experienceEntries.length > 0 ? (
                <section key="experience" className="mt-8">
                  <h3 className="border-b border-black pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-black">Experience</h3>
                  <div className="mt-4 space-y-5">
                    {documentData.experienceEntries.map((entry) => (
                      <div key={entry.entry.id}>
                        <div className="resume-experience-header">
                          <div>
                            <h4 className="text-base font-semibold text-black">{entry.entry.title || 'Untitled role'}</h4>
                            <p className="text-sm text-black">
                              {formatExperienceMeta({
                                company: entry.entry.company,
                                location: entry.entry.location,
                                workArrangement: entry.entry.workArrangement,
                                employmentType: entry.entry.employmentType,
                              })}
                            </p>
                          </div>
                          <p className="resume-experience-date text-sm text-black">{formatDateRange(entry.entry.startDate, entry.entry.endDate, entry.entry.isCurrent)}</p>
                        </div>
                        {entry.bullets.length > 0 ? (
                          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-5 text-black">
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
                  <h3 className="border-b border-black pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-black">Education</h3>
                  <div className="mt-4 space-y-4 text-sm text-black">
                    {documentData.educationEntries.length === 0 ? (
                      <p className="text-black">No education entries enabled.</p>
                    ) : (
                      documentData.educationEntries.map((entry) => (
                        <div key={entry.id}>
                          <p className="font-semibold text-black">{entry.school || 'School'}</p>
                          <p>{entry.degree || 'Degree not set'}</p>
                          <p className="text-black">{entry.graduationDate || 'Date not set'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )
            case 'certifications':
              return (
                <section key="certifications" className="mt-8">
                  <h3 className="border-b border-black pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-black">Certifications</h3>
                  <div className="mt-4 space-y-4 text-sm text-black">
                    {documentData.certifications.length === 0 ? (
                      <p className="text-black">No certifications enabled.</p>
                    ) : (
                      documentData.certifications.map((entry) => (
                        <div key={entry.id}>
                          <p className="font-semibold text-black">{entry.name || 'Certification'}</p>
                          <p>{entry.issuer || 'Issuer not set'}</p>
                          <p className="text-black">{entry.issueDate || 'Issue date not set'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )
            case 'references':
              return (
                <section key="references" className="mt-8">
                  <h3 className="border-b border-black pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-black">References</h3>
                  <div className="mt-4 space-y-4 text-sm text-black">
                    {documentData.references.length === 0 ? (
                      <p className="text-black">No references enabled.</p>
                    ) : (
                      documentData.references.map((entry) => (
                        <div key={entry.id}>
                          <p className="font-semibold text-black">{entry.name || 'Reference'}</p>
                          <p>{[entry.title, entry.company].filter(Boolean).join(' · ')}</p>
                          <p className="text-black">{entry.email || entry.phone || 'Contact details not set'}</p>
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
