import { formatAddressLines, formatLocationLine, type ProfileDocumentData } from './document-data'

interface DocumentProfileHeaderProps {
  documentData: ProfileDocumentData
}

export const DocumentProfileHeader = ({ documentData }: DocumentProfileHeaderProps) => {
  const addressLines = formatAddressLines([
    documentData.profile.personalDetails.addressLine1,
    documentData.profile.personalDetails.addressLine2,
    documentData.profile.personalDetails.addressLine3,
  ])
  const locationLine = formatLocationLine(
    documentData.profile.personalDetails.city,
    documentData.profile.personalDetails.state,
    documentData.profile.personalDetails.postalCode,
  )
  const links = documentData.profileLinks
    .map((link) => `${link.name}: ${link.url}`.trim())
    .filter(Boolean)

  return (
    <header className="border-b border-slate-200 pb-6">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
        {documentData.profile.personalDetails.fullName || documentData.profile.name || 'Unnamed candidate'}
      </h2>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
        {documentData.profile.personalDetails.email ? <span>{documentData.profile.personalDetails.email}</span> : null}
        {documentData.profile.personalDetails.phone ? <span>{documentData.profile.personalDetails.phone}</span> : null}
        {locationLine ? <span>{locationLine}</span> : null}
      </div>
      {addressLines.length > 0 ? <p className="mt-2 text-sm text-slate-600">{addressLines.join(' · ')}</p> : null}
      {links.length > 0 ? <p className="mt-2 text-sm text-sky-700">{links.join(' · ')}</p> : null}
    </header>
  )
}
