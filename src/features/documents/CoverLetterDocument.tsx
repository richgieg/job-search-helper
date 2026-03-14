import { buildCoverLetterParagraphs, formatAddressLines, getInsideAddressCompany, type ProfileDocumentData } from './document-data'
import { DocumentProfileHeader } from './DocumentProfileHeader'

const formatCoverLetterDate = () =>
  new Date().toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

export const CoverLetterDocument = ({ documentData }: { documentData: ProfileDocumentData }) => {
  const personalDetails = documentData.profile.personalDetails
  const recipient = {
    name: documentData.primaryContact.name || 'Hiring Team',
    title: documentData.primaryContact.title,
    company: getInsideAddressCompany(documentData.job, documentData.primaryContact),
    addressLines: formatAddressLines([
      documentData.primaryContact.addressLine1,
      documentData.primaryContact.addressLine2,
      documentData.primaryContact.addressLine3,
      documentData.primaryContact.addressLine4,
    ]),
  }
  const insideAddressLines = [recipient.name, recipient.title, recipient.company, ...recipient.addressLines].filter(Boolean)
  const paragraphs = buildCoverLetterParagraphs(documentData)

  return (
    <>
      <DocumentProfileHeader documentData={documentData} />

      <div className="cover-letter-inside-address mt-5">
        <p>{formatCoverLetterDate()}</p>
        {insideAddressLines.length > 1 ? (
          <div className="mt-6">
            <p className="text-black">{recipient.name}</p>
            {recipient.title ? <p>{recipient.title}</p> : null}
            {recipient.company ? <p>{recipient.company}</p> : null}
            {recipient.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 leading-4.5 text-black">
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
    </>
  )
}