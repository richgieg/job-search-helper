import type { DocumentHeaderTemplate } from '../types/state'

export const documentHeaderTemplates: DocumentHeaderTemplate[] = ['classic', 'stacked']

export const defaultDocumentHeaderTemplate: DocumentHeaderTemplate = 'classic'

export const documentHeaderTemplateLabels: Record<DocumentHeaderTemplate, string> = {
  classic: 'Classic',
  stacked: 'Stacked',
}

export const normalizeDocumentHeaderTemplate = (value: string | null | undefined): DocumentHeaderTemplate =>
  documentHeaderTemplates.includes(value as DocumentHeaderTemplate)
    ? (value as DocumentHeaderTemplate)
    : defaultDocumentHeaderTemplate