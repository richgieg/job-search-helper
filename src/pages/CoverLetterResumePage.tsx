import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { AppShell } from '../app/layout/AppLayout'
import { CoverLetterDocument } from '../features/documents/CoverLetterDocument'
import { DocumentNotFound } from '../features/documents/DocumentNotFound'
import { ResumeDocument } from '../features/documents/ResumeDocument'
import { selectProfileDocumentData } from '../features/documents/document-data'
import { createCoverLetterResumeDocumentTitle } from '../features/documents/document-titles'
import { useAppStore } from '../store/app-store'

export const CoverLetterResumePage = () => {
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
    document.title = createCoverLetterResumeDocumentTitle(documentData.profile.personalDetails.fullName, documentData.profile.name)

    return () => {
      document.title = previousTitle
    }
  }, [documentData.profile.name, documentData.profile.personalDetails.fullName])

  return (
    <div className="document-preview-shell document-preview-stack">
      <article className="document-page text-sm leading-[1.125rem] text-black">
        <CoverLetterDocument documentData={documentData} />
      </article>

      <article className="document-page document-page-break text-black">
        <ResumeDocument documentData={documentData} />
      </article>
    </div>
  )
}