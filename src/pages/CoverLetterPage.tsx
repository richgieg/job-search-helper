import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { AppShell } from '../app/layout/AppLayout'
import { CoverLetterDocument } from '../features/documents/CoverLetterDocument'
import { DocumentNotFound } from '../features/documents/DocumentNotFound'
import { selectProfileDocumentData } from '../features/documents/document-data'
import { createCoverLetterDocumentTitle } from '../features/documents/document-titles'
import { useAppStore } from '../store/app-store'

export const CoverLetterPage = () => {
  const { profileId = '' } = useParams()
  const data = useAppStore((state) => state.data)

  const documentData = useMemo(() => selectProfileDocumentData(data, profileId), [data, profileId])

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
    <div className="document-preview-shell">
      <article className="document-page text-sm leading-4.5 text-black">
        <CoverLetterDocument documentData={documentData} />
      </article>
    </div>
  )
}
