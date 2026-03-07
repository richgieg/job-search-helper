import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { DocumentProfileHeader } from '../features/documents/DocumentProfileHeader'
import { PreviewNotFound } from '../features/documents/DocumentPageLayout'
import { buildCoverLetterParagraphs, formatAddressLines, selectProfilePreviewData } from '../features/documents/preview-data'
import { useAppStore } from '../store/app-store'

export const CoverLetterPreviewPage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)

  const preview = useMemo(() => selectProfilePreviewData(data, profileId), [data, profileId])

  if (!preview) {
    return <PreviewNotFound message="The selected profile could not be found." />
  }

  const personalDetails = preview.profile.personalDetails
  const recipient = {
    name: preview.primaryContact.name || 'Hiring Team',
    title: preview.primaryContact.title,
    company: preview.primaryContact.company || preview.job.companyName || 'Example Company',
    addressLines: formatAddressLines([
      preview.primaryContact.addressLine1,
      preview.primaryContact.addressLine2,
      preview.primaryContact.addressLine3,
      preview.primaryContact.addressLine4,
    ]),
  }
  const paragraphs = buildCoverLetterParagraphs(preview)

  return (
    <div className="document-preview-shell">
      <article className="document-page text-sm leading-7 text-slate-700">
        <DocumentProfileHeader preview={preview} />

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
              <p key={`${preview.profile.id}-${index}`}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8">
            <p>Sincerely,</p>
            <p className="mt-6 font-semibold text-slate-950">{personalDetails.fullName || preview.profile.name || 'Unnamed candidate'}</p>
          </div>
        </div>
      </article>
    </div>
  )
}
