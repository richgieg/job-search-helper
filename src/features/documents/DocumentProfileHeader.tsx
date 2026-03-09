import { formatAddressLines, formatLocationLine, type ProfilePreviewData } from './preview-data'

interface DocumentProfileHeaderProps {
  preview: ProfilePreviewData
}

export const DocumentProfileHeader = ({ preview }: DocumentProfileHeaderProps) => {
  const addressLines = formatAddressLines([
    preview.profile.personalDetails.addressLine1,
    preview.profile.personalDetails.addressLine2,
    preview.profile.personalDetails.addressLine3,
  ])
  const locationLine = formatLocationLine(
    preview.profile.personalDetails.city,
    preview.profile.personalDetails.state,
    preview.profile.personalDetails.postalCode,
  )
  const links = preview.profileLinks
    .map((link) => `${link.name}: ${link.url}`.trim())
    .filter(Boolean)

  return (
    <header className="border-b border-slate-200 pb-6">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
        {preview.profile.personalDetails.fullName || preview.profile.name || 'Unnamed candidate'}
      </h2>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
        {preview.profile.personalDetails.email ? <span>{preview.profile.personalDetails.email}</span> : null}
        {preview.profile.personalDetails.phone ? <span>{preview.profile.personalDetails.phone}</span> : null}
        {locationLine ? <span>{locationLine}</span> : null}
      </div>
      {addressLines.length > 0 ? <p className="mt-2 text-sm text-slate-600">{addressLines.join(' · ')}</p> : null}
      {links.length > 0 ? <p className="mt-2 text-sm text-sky-700">{links.join(' · ')}</p> : null}
    </header>
  )
}
