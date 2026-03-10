import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { AppShell } from '../app/layout/AppLayout'
import { DocumentNotFound } from '../features/documents/DocumentNotFound'
import { ResumeDocument } from '../features/documents/ResumeDocument'
import { selectProfileDocumentData } from '../features/documents/document-data'
import { createResumeDocumentTitle } from '../features/documents/document-titles'
import { useAppStore } from '../store/app-store'

export const ResumePage = () => {
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

  useEffect(() => {
    const previousTitle = document.title
    document.title = createResumeDocumentTitle(documentData.profile.personalDetails.fullName, documentData.profile.name)

    return () => {
      document.title = previousTitle
    }
  }, [documentData.profile.name, documentData.profile.personalDetails.fullName])

  return (
    <div className="document-preview-shell">
      <article className="document-page text-black">
        <ResumeDocument documentData={documentData} />
      </article>
    </div>
  )
}
