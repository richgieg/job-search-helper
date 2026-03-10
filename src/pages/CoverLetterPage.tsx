import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { AppShell } from '../app/layout/AppLayout'
import { DocumentProfileHeader } from '../features/documents/DocumentProfileHeader'
import { DocumentNotFound } from '../features/documents/DocumentNotFound'
import { buildCoverLetterParagraphs, formatAddressLines, selectProfileDocumentData } from '../features/documents/document-data'
import { useAppStore } from '../store/app-store'

const createCoverLetterDocumentTitle = (fullName: string, profileName: string) => {
  const baseName = (fullName || profileName).trim()

  if (!baseName) {
    return 'Cover_Letter'
  }

  return `${baseName.replace(/\s+/g, '_')}_Cover_Letter`
}

export const CoverLetterPage = () => {
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

  const personalDetails = documentData.profile.personalDetails

  useEffect(() => {
    const previousTitle = document.title
    document.title = createCoverLetterDocumentTitle(personalDetails.fullName, documentData.profile.name)

    return () => {
      document.title = previousTitle
    }
  }, [documentData.profile.name, personalDetails.fullName])

  const recipient = {
    name: documentData.primaryContact.name || 'Hiring Team',
    title: documentData.primaryContact.title,
    company: documentData.primaryContact.company || documentData.job.companyName || 'Example Company',
    addressLines: formatAddressLines([
      documentData.primaryContact.addressLine1,
      documentData.primaryContact.addressLine2,
      documentData.primaryContact.addressLine3,
      documentData.primaryContact.addressLine4,
    ]),
  }
  const formattedDate = new Date().toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const paragraphs = buildCoverLetterParagraphs(documentData)

  return (
    <div className="document-preview-shell">
      <article className="document-page text-sm leading-[1.125rem] text-black">
        <DocumentProfileHeader documentData={documentData} />

        <div className="cover-letter-inside-address mt-5">
          <p>{formattedDate}</p>
          <div className="mt-6">
            <p className="text-black">{recipient.name}</p>
            <p>{recipient.title}</p>
            <p>{recipient.company}</p>
            {recipient.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="mt-6 leading-[1.125rem] text-black">
          <p>Dear {recipient.name === 'Hiring Team' ? 'Hiring Team' : recipient.name},</p>

          <div className="mt-6 space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p key={`${documentData.profile.id}-${index}`}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8">
            <p>Sincerely,</p>
            <p className="mt-6 text-black">{personalDetails.fullName || documentData.profile.name || 'Unnamed candidate'}</p>
          </div>
        </div>
      </article>
    </div>
  )
}
