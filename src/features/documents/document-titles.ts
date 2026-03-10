const createDocumentTitleBaseName = (fullName: string, profileName: string) => (fullName || profileName).trim()

const sanitizeDocumentTitleName = (value: string) => value.replace(/\s+/g, '_')

export const createResumeDocumentTitle = (fullName: string, profileName: string) => {
  const baseName = createDocumentTitleBaseName(fullName, profileName)

  if (!baseName) {
    return 'Resume'
  }

  return `${sanitizeDocumentTitleName(baseName)}_Resume`
}

export const createCoverLetterDocumentTitle = (fullName: string, profileName: string) => {
  const baseName = createDocumentTitleBaseName(fullName, profileName)

  if (!baseName) {
    return 'Cover_Letter'
  }

  return `${sanitizeDocumentTitleName(baseName)}_Cover_Letter`
}

export const createCoverLetterResumeDocumentTitle = (fullName: string, profileName: string) => {
  const baseName = createDocumentTitleBaseName(fullName, profileName)

  if (!baseName) {
    return 'Cover_Letter_and_Resume'
  }

  return `${sanitizeDocumentTitleName(baseName)}_Cover_Letter_and_Resume`
}