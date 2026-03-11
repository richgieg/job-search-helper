import { formatDateRange, getOrderedResumeSections, type ProfileDocumentData } from './document-data'
import { DocumentProfileHeader } from './DocumentProfileHeader'
import { ReferencesSection } from './ReferencesDocument'
import { formatEmploymentType, formatWorkArrangement } from '../../utils/job-field-options'

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

const formatEducationDateDisplay = (input: {
  startDate: string | null
  endDate: string | null
  status: 'graduated' | 'attended' | 'in_progress'
}) => {
  if (input.status === 'graduated') {
    return formatMonthYear(input.endDate)
  }

  const start = input.startDate ? formatMonthYear(input.startDate) : ''
  const end = input.status === 'in_progress' ? 'Present' : input.endDate ? formatMonthYear(input.endDate) : ''

  if (start && end) {
    return `${start} – ${end}`
  }

  if (start) {
    return input.status === 'in_progress' ? `${start} – Present` : start
  }

  if (end) {
    return end
  }

  return input.status === 'in_progress' ? 'In progress' : 'Date not set'
}

export const ResumeDocument = ({ documentData }: { documentData: ProfileDocumentData }) => {
  const summaryParagraphs = documentData.profile.summary
    .split(/\n+/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const orderedSections = getOrderedResumeSections(documentData.profile).filter((section) => section.enabled)

  return (
    <>
      <DocumentProfileHeader documentData={documentData} />

      {orderedSections.map((orderedSection, index) => {
        const sectionClassName = index === 0 ? '' : 'mt-5'

        switch (orderedSection.section) {
          case 'summary':
            return (
              <section key="summary" className={index === 0 ? '' : 'mt-5'}>
                <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">{orderedSection.label}</h3>
                {summaryParagraphs.length > 0 ? (
                  <div className="mt-3 space-y-2.5 text-sm leading-4.5 text-black">
                    {summaryParagraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${documentData.profile.id}-summary-${paragraphIndex}`} className={paragraphIndex === 0 ? 'print-keep-together' : undefined}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}
              </section>
            )
          case 'skills':
            return (
              <section key="skills" className={sectionClassName}>
                <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">{orderedSection.label}</h3>
                {documentData.skillCategories.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {documentData.skillCategories.map((item) => (
                      <div key={item.category.id} className="print-keep-together">
                        <p className="text-sm leading-4.5 text-black">
                          <span className="font-semibold">{item.category.name || 'General'}:</span>{' '}
                          {item.skills.length > 0
                            ? item.skills.map((skill, skillIndex) => (
                                <span key={skill.id}>
                                  {skillIndex > 0 ? <span>{' · '}</span> : null}
                                  <span className="whitespace-nowrap">{skill.name}</span>
                                </span>
                              ))
                            : null}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            )
          case 'experience':
            return (
              <section key="experience" className={sectionClassName}>
                <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">{orderedSection.label}</h3>
                {documentData.experienceEntries.length > 0 ? (
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
                              <ul className="mt-3 list-disc pl-10 text-sm leading-4.5 text-black">
                                <li>{firstBullet.content}</li>
                              </ul>
                            ) : null}
                          </div>
                          {remainingBullets.length > 0 ? (
                            <ul className="mt-2 list-disc space-y-2 pl-10 text-sm leading-4.5 text-black">
                              {remainingBullets.map((bullet) => (
                                <li key={bullet.id}>{bullet.content}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </section>
            )
          case 'education':
            return (
              <section key="education" className={sectionClassName}>
                <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">{orderedSection.label}</h3>
                <div className="mt-4 space-y-4 text-sm text-black">
                  {documentData.educationEntries.length > 0 ? (
                    documentData.educationEntries.map((item) => {
                      const [firstBullet, ...remainingBullets] = item.bullets

                      return (
                        <div key={item.entry.id}>
                          <div className="print-keep-together">
                            <div className="resume-experience-header">
                              <p className="font-semibold text-black">{item.entry.degree || 'Program not set'}</p>
                              <p className="resume-experience-date text-black">{formatEducationDateDisplay(item.entry)}</p>
                            </div>
                            <p className="italic">{item.entry.school || 'School'}</p>
                            {firstBullet ? (
                              <ul className="mt-3 list-disc pl-10 text-sm leading-4.5 text-black">
                                <li>{firstBullet.content}</li>
                              </ul>
                            ) : null}
                          </div>
                          {remainingBullets.length > 0 ? (
                            <ul className="mt-2 list-disc space-y-2 pl-10 text-sm leading-4.5 text-black">
                              {remainingBullets.map((bullet) => (
                                <li key={bullet.id}>{bullet.content}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      )
                    })
                  ) : null}
                </div>
              </section>
            )
          case 'certifications':
            return (
              <section key="certifications" className={sectionClassName}>
                <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">{orderedSection.label}</h3>
                <div className="mt-4 text-sm leading-4.5 text-black">
                  {documentData.certifications.length > 0 ? (
                    <p className="print-keep-together">
                      {documentData.certifications.map((entry, certificationIndex) => (
                        <span key={entry.id}>
                          {certificationIndex > 0 ? <span>{' · '}</span> : null}
                          <span className="whitespace-nowrap">{entry.name || 'Certification'}</span>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
              </section>
            )
          case 'references':
            return <ReferencesSection key="references" className={sectionClassName} documentData={documentData} heading={orderedSection.label} />
          default:
            return null
        }
      })}
    </>
  )
}