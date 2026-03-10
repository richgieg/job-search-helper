import { formatLocationLine, type ProfileDocumentData } from './document-data'

interface DocumentProfileHeaderProps {
  documentData: ProfileDocumentData
}

export const DocumentProfileHeader = ({ documentData }: DocumentProfileHeaderProps) => {
  const locationLine = formatLocationLine(
    documentData.profile.personalDetails.city,
    documentData.profile.personalDetails.state,
    '',
  )
  const contactLine = [locationLine, documentData.profile.personalDetails.phone, documentData.profile.personalDetails.email]
    .map((value) => value.trim())
    .filter(Boolean)
  const links = documentData.profileLinks
    .map((link) => `${link.name}: ${link.url}`.trim())
    .filter(Boolean)

  return (
    <header className="pb-6 text-black">
      <div className="flex items-start justify-between gap-8">
        <h2 className="text-3xl font-semibold tracking-tight text-black">
          {documentData.profile.personalDetails.fullName || documentData.profile.name || 'Unnamed candidate'}
        </h2>
        <div className="shrink-0 text-right">
          {contactLine.length > 0 ? <p className="text-sm text-black">{contactLine.join(' | ')}</p> : null}
          {links.length > 0 ? (
            <div className="mt-2 space-y-0.5 text-sm leading-4 text-black">
              {links.map((link) => (
                <p key={link}>{link}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
