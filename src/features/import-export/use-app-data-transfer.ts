import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getAppApiClient } from '../../api'
import { queryKeys } from '../../queries/query-keys'
import { useResetUiState } from '../../store/app-ui-store'
import type { AppExportFile } from '../../types/state'

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown import/export error.')

export const useAppDataTransfer = () => {
  const queryClient = useQueryClient()
  const resetUiState = useResetUiState()

  const invalidateDataQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsList() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsDetailRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesListRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesDetailRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesDocumentRoot() }),
    ])
  }

  const importAppDataMutation = useMutation({
    mutationFn: (file: AppExportFile) => getAppApiClient().importAppData(file),
    onSuccess: async () => {
      resetUiState()
      await invalidateDataQueries()
    },
  })

  const exportAppDataMutation = useMutation({
    mutationFn: () => getAppApiClient().exportAppData(),
  })

  const mutations = [importAppDataMutation, exportAppDataMutation] as const

  return {
    errorMessage: mutations
      .map((mutation) => mutation.error)
      .filter(Boolean)
      .map(getErrorMessage)[0] ?? null,
    isSaving: mutations.some((mutation) => mutation.isPending),
    importAppData: async (file: AppExportFile) => {
      await importAppDataMutation.mutateAsync(file)
    },
    exportAppData: async () => exportAppDataMutation.mutateAsync(),
  }
}