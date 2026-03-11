import type { ProfileDocumentData } from './document-data'
import { DocumentProfileHeader } from './DocumentProfileHeader'

interface ReferencesSectionProps {
  documentData: ProfileDocumentData
  className?: string
}

export const ReferencesSection = ({ documentData, className = '' }: ReferencesSectionProps) => (
  <section className={className}>
    <h3 className="resume-section-heading border-b border-black pb-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-black">References</h3>
    <div className="mt-4 space-y-4 text-sm text-black">
      {documentData.references.length > 0 ? (
        documentData.references.map((entry) => (
          <div key={entry.id} className="print-keep-together">
            <p className="font-semibold text-black">{entry.name || 'Reference'}</p>
            <p>{[entry.title, entry.company].filter(Boolean).join(' · ')}</p>
            {entry.phone ? <p className="text-black">{entry.phone}</p> : null}
            {entry.email ? <p className="text-black">{entry.email}</p> : null}
          </div>
        ))
      ) : null}
    </div>
  </section>
)

export const ReferencesDocument = ({ documentData }: ReferencesSectionProps) => (
  <>
    <DocumentProfileHeader documentData={documentData} />
    <ReferencesSection documentData={documentData} />
  </>
)