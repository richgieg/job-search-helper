import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { DocumentProfileHeader } from '../features/documents/DocumentProfileHeader'
import { DocumentNotFound } from '../features/documents/DocumentNotFound'
import { buildCoverLetterParagraphs, formatAddressLines, selectProfileDocumentData } from '../features/documents/document-data'
import { useAppStore } from '../store/app-store'

export const CoverLetterPage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)

  const documentData = useMemo(() => selectProfileDocumentData(data, profileId), [data, profileId])

  if (!documentData) {
    return <DocumentNotFound message="The selected profile could not be found." />
  }

  const personalDetails = documentData.profile.personalDetails
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
  const paragraphs = buildCoverLetterParagraphs(documentData)

  return (
    <div className="document-preview-shell">
      <article className="document-page text-sm leading-7 text-slate-700">
        <DocumentProfileHeader documentData={documentData} />

        <div className="cover-letter-inside-address mt-10">
          <p>{new Date().toLocaleDateString()}</p>
          <div className="mt-4">
            <p className="font-semibold text-slate-950">{recipient.name}</p>
            <p>{recipient.title}</p>
            <p>{recipient.company}</p>
            {recipient.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="mt-10 leading-8 text-slate-800">
          <p>Dear {recipient.name === 'Hiring Team' ? 'Hiring Team' : recipient.name},</p>

          <div className="mt-6 space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p key={`${documentData.profile.id}-${index}`}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8">
            <p>Sincerely,</p>
            <p className="mt-6 font-semibold text-slate-950">{personalDetails.fullName || documentData.profile.name || 'Unnamed candidate'}</p>
          </div>
        </div>
      </article>
    </div>
  )
}
