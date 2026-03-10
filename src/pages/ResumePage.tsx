import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { AppShell } from '../app/layout/AppLayout'
import { DocumentProfileHeader } from '../features/documents/DocumentProfileHeader'
import { DocumentNotFound } from '../features/documents/DocumentNotFound'
import { formatDateRange, getOrderedResumeSections, selectProfileDocumentData } from '../features/documents/document-data'
import { useAppStore } from '../store/app-store'
import { formatEmploymentType, formatWorkArrangement } from '../utils/job-field-options'

const formatExperienceMeta = (input: {
  company: string
  location: string
  workArrangement: string
  employmentType: string
}) => {
  const workArrangement = input.workArrangement !== 'unknown' ? formatWorkArrangement(input.workArrangement as Parameters<typeof formatWorkArrangement>[0]) : ''
  const employmentType = input.employmentType !== 'other' ? formatEmploymentType(input.employmentType as Parameters<typeof formatEmploymentType>[0]) : ''

  return [input.company, input.location, workArrangement, employmentType].filter(Boolean).join(' · ')
}

const formatMonthYear = (value: string | null) => {
  if (!value) {
    return 'Date not set'
  }

  const date = new Date(`${value}T00:00:00`)

  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

const createResumeDocumentTitle = (fullName: string, profileName: string) => {
  const baseName = (fullName || profileName).trim()

  if (!baseName) {
    return 'Resume'
  }

  return `${baseName.replace(/\s+/g, '_')}_Resume`
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

  useEffect(() => {
    const previousTitle = document.title
    document.title = createResumeDocumentTitle(documentData.profile.personalDetails.fullName, documentData.profile.name)

    return () => {
      document.title = previousTitle
    }
  }, [documentData.profile.name, documentData.profile.personalDetails.fullName])

  return (
    <div className="document-preview-shell">
      <article className="document-page text-black">
        <DocumentProfileHeader documentData={documentData} />

        {orderedSections.map((orderedSection, index) => {
          const sectionClassName = index === 0 ? '' : 'mt-5'

          switch (orderedSection.section) {
            case 'summary':
              return summaryParagraphs.length > 0 ? (
                <section key="summary" className={index === 0 ? '' : 'mt-5'}>
                  <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">Summary</h3>
                  <div className="mt-3 space-y-[0.625rem] text-sm leading-[1.125rem] text-black">
                    {summaryParagraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${documentData.profile.id}-summary-${paragraphIndex}`} className={paragraphIndex === 0 ? 'print-keep-together' : undefined}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ) : null
            case 'skills':
              return documentData.skillCategories.length > 0 ? (
                <section key="skills" className={sectionClassName}>
                  <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">Skills</h3>
                  <div className="mt-4 space-y-2">
                    {documentData.skillCategories.map((item) => (
                      <div key={item.category.id} className="print-keep-together">
                        <p className="text-sm leading-[1.125rem] text-black">
                          <span className="font-semibold">{item.category.name || 'General'}:</span>{' '}
                          {item.skills.length > 0
                            ? item.skills.map((skill, index) => (
                                <span key={skill.id}>
                                  {index > 0 ? <span>{' · '}</span> : null}
                                  <span className="whitespace-nowrap">{skill.name}</span>
                                </span>
                              ))
                            : 'No skills listed yet.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null
            case 'experience':
              return documentData.experienceEntries.length > 0 ? (
                <section key="experience" className={sectionClassName}>
                  <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">Experience</h3>
                  <div className="mt-4 space-y-5">
                    {documentData.experienceEntries.map((entry) => {
                      const [firstBullet, ...remainingBullets] = entry.bullets

                      return (
                        <div key={entry.entry.id}>
                          <div className="print-keep-together">
                            <div className="resume-experience-header">
                              <div>
                                <h4 className="text-sm font-semibold text-black">{entry.entry.title || 'Untitled role'}</h4>
                                <p className="text-sm italic text-black">
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
                            {firstBullet ? (
                              <ul className="mt-3 list-disc pl-10 text-sm leading-[1.125rem] text-black">
                                <li>{firstBullet.content}</li>
                              </ul>
                            ) : null}
                          </div>
                          {remainingBullets.length > 0 ? (
                            <ul className="mt-2 list-disc space-y-2 pl-10 text-sm leading-[1.125rem] text-black">
                              {remainingBullets.map((bullet) => (
                                <li key={bullet.id}>{bullet.content}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : null
            case 'education':
              return (
                <section key="education" className={sectionClassName}>
                  <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">Education</h3>
                  <div className="mt-4 space-y-4 text-sm text-black">
                    {documentData.educationEntries.length === 0 ? (
                      <p className="text-black">No education entries enabled.</p>
                    ) : (
                      documentData.educationEntries.map((entry) => (
                        <div key={entry.id} className="print-keep-together">
                          <div className="resume-experience-header">
                            <p className="font-semibold text-black">{entry.degree || 'Degree not set'}</p>
                            <p className="resume-experience-date text-black">{formatMonthYear(entry.graduationDate)}</p>
                          </div>
                          <p className="italic">{entry.school || 'School'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )
            case 'certifications':
              return (
                <section key="certifications" className={sectionClassName}>
                  <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">Certifications</h3>
                  <div className="mt-4 text-sm leading-[1.125rem] text-black">
                    {documentData.certifications.length === 0 ? (
                      <p className="text-black">No certifications enabled.</p>
                    ) : (
                      <p className="print-keep-together">
                        {documentData.certifications.map((entry, index) => (
                          <span key={entry.id}>
                            {index > 0 ? <span>{' · '}</span> : null}
                            <span className="whitespace-nowrap">{entry.name || 'Certification'}</span>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </section>
              )
            case 'references':
              return (
                <section key="references" className={sectionClassName}>
                  <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">References</h3>
                  <div className="mt-4 space-y-4 text-sm text-black">
                    {documentData.references.length === 0 ? (
                      <p className="text-black">No references enabled.</p>
                    ) : (
                      documentData.references.map((entry) => (
                        <div key={entry.id} className="print-keep-together">
                          <p className="font-semibold text-black">{entry.name || 'Reference'}</p>
                          <p>{[entry.title, entry.company].filter(Boolean).join(' · ')}</p>
                          {entry.phone ? <p className="text-black">{entry.phone}</p> : null}
                          {entry.email ? <p className="text-black">{entry.email}</p> : null}
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
