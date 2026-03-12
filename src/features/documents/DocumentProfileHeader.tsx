import { formatLocationLine, type ProfileDocumentData } from './document-data'

interface DocumentProfileHeaderProps {
  documentData: ProfileDocumentData
}

const renderSeparatedItems = (items: string[]) =>
  items.map((item, index) => (
    <span key={`${item}-${index}`} className="inline-flex whitespace-nowrap">
      {index > 0 ? <span aria-hidden="true" className="px-3">|</span> : null}
      <span>{item}</span>
    </span>
  ))

export const DocumentProfileHeader = ({ documentData }: DocumentProfileHeaderProps) => {
  const headerTemplate = documentData.profile.resumeSettings.headerTemplate
  const locationLine = formatLocationLine(
    documentData.profile.personalDetails.city,
    documentData.profile.personalDetails.state,
    '',
  )
  const contactLine = [locationLine, documentData.profile.personalDetails.phone, documentData.profile.personalDetails.email]
    .map((value) => value.trim())
    .filter(Boolean)
  const links = documentData.profileLinks
    .map((link) => link.url.trim())
    .filter(Boolean)
  const displayName = documentData.profile.personalDetails.fullName || documentData.profile.name || 'Unnamed candidate'

  if (headerTemplate === 'stacked') {
    return (
      <header className="pb-4 text-black" data-header-template={headerTemplate}>
        <div className="pb-2 text-center text-black">
          <h2 className="text-2xl font-semibold text-black">{displayName}</h2>
          {contactLine.length > 0 ? <p className="mt-2 flex flex-wrap justify-center text-sm text-black">{renderSeparatedItems(contactLine)}</p> : null}
          {links.length > 0 ? (
            <div className="mt-0 space-y-0.5 text-sm text-black">
              {links.map((link) => (
                <p key={link} className="whitespace-nowrap m-0">
                  {link}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </header>
    )
  }

  return (
    <header className="pb-6 text-black" data-header-template={headerTemplate}>
      <div className="flex items-start justify-between gap-8">
        <h2 className="text-3xl font-semibold tracking-tight text-black">
          {displayName}
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
