import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { AppShell } from '../app/layout/AppLayout'
import { CoverLetterDocument } from '../features/documents/CoverLetterDocument'
import { DocumentNotFound } from '../features/documents/DocumentNotFound'
import { selectProfileDocumentData } from '../features/documents/document-data'
import { createCoverLetterDocumentTitle } from '../features/documents/document-titles'
import { useProfileDocumentQuery } from '../queries/use-profile-document-query'
import { useAppStore } from '../store/app-store'

export const CoverLetterPage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)
  const { data: fetchedDocumentData, error, isLoading } = useProfileDocumentQuery(profileId)

  const cachedDocumentData = useMemo(() => selectProfileDocumentData(data, profileId), [data, profileId])
  const documentData = fetchedDocumentData ?? cachedDocumentData

  if (isLoading && !documentData) {
    return <p className="text-sm text-app-text-subtle">Loading document...</p>
  }

  if (error && !documentData) {
    return (
      <AppShell>
        <DocumentNotFound message="The selected document could not be refreshed right now." />
      </AppShell>
    )
  }

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

  return (
    <>
      {error ? (
        <div className="rounded-2xl border border-app-status-rejected-muted bg-app-status-rejected-soft px-4 py-3 text-sm text-app-status-rejected">
          Unable to refresh this document right now. Showing the most recently cached result if available.
        </div>
      ) : null}
      <div className="document-preview-shell">
        <article className="document-page text-sm leading-4.5 text-black">
          <CoverLetterDocument documentData={documentData} />
        </article>
      </div>
    </>
  )
}
