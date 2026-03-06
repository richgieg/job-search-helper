import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { DocumentPageLayout, PreviewNotFound } from '../features/documents/DocumentPageLayout'
import { formatAddressLines, formatLocationLine, selectProfilePreviewData } from '../features/documents/preview-data'
import { useAppStore } from '../store/app-store'

const PreviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className="mt-2 text-sm text-slate-800">{value || 'Not provided'}</p>
  </div>
)

export const ApplicationPreviewPage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)

  const preview = useMemo(() => selectProfilePreviewData(data, profileId), [data, profileId])

  if (!preview) {
    return <PreviewNotFound message="The selected profile could not be found." />
  }

  const personalDetails = preview.profile.personalDetails
  const links = preview.profile.links
  const addressLines = formatAddressLines([
    personalDetails.addressLine1,
    personalDetails.addressLine2,
    personalDetails.addressLine3,
    personalDetails.addressLine4,
  ])
  const locationLine = formatLocationLine(personalDetails.city, personalDetails.state, personalDetails.postalCode)
  const highlightBullets = preview.experienceEntries.flatMap((entry) => entry.bullets.filter((bullet) => bullet.trim())).slice(0, 4)

  return (
    <DocumentPageLayout
      activeDocument="application"
      profileId={preview.profile.id}
      subtitle="A prefilled application-style summary using the selected profile and any linked job context."
      title={`${preview.profile.name || 'Profile'} application preview`}
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Candidate information</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <PreviewRow label="Full name" value={personalDetails.fullName || preview.profile.name} />
            <PreviewRow label="Email" value={personalDetails.email} />
            <PreviewRow label="Phone" value={personalDetails.phone} />
            <PreviewRow label="Location" value={locationLine} />
            <PreviewRow label="Address" value={addressLines.join(', ')} />
            <PreviewRow label="LinkedIn" value={links.linkedinUrl} />
            <PreviewRow label="GitHub" value={links.githubUrl} />
            <PreviewRow label="Portfolio / website" value={links.portfolioUrl || links.websiteUrl} />
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Professional summary</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {preview.profile.summary.trim() || 'No summary has been entered yet for this profile.'}
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Resume highlights</h3>
            {highlightBullets.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No experience bullets are enabled yet.</p>
            ) : (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                {highlightBullets.map((bullet, index) => (
                  <li key={`${preview.profile.id}-${index}`}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Target opportunity</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div>
                <p className="font-medium text-slate-900">Company</p>
                <p>{preview.job?.companyName || 'Generic preview (no job attached)'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Role</p>
                <p>{preview.job?.jobTitle || 'Reusable base-profile preview'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Work arrangement</p>
                <p>{preview.job ? preview.job.workArrangement.replace('_', ' ') : 'Not specified'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Employment type</p>
                <p>{preview.job ? preview.job.employmentType.replace('_', ' ') : 'Not specified'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Desired compensation</p>
                <p>{preview.job?.desiredCompensation || 'Not specified'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Pipeline status</p>
                <p className="capitalize">{preview.computedStatus}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Posting and contact</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div>
                <p className="font-medium text-slate-900">Primary posting source</p>
                <p>{preview.postingSources[0]?.url || preview.postingSources[0]?.label || 'No posting source added'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Primary contact</p>
                <p>{preview.primaryContact?.name || 'No contact added'}</p>
                <p className="text-slate-500">{[preview.primaryContact?.title, preview.primaryContact?.company].filter(Boolean).join(' · ') || 'Contact details unavailable'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Application notes</p>
                <p>{preview.job?.notes || 'No job notes added yet.'}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </DocumentPageLayout>
  )
}
