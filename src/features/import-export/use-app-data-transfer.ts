import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getAppApiClient, resetAppApiClient } from '../../api'
import { queryKeys } from '../../queries/query-keys'
import { useResetUiState } from '../../store/app-ui-store'
import type { AppExportFile } from '../../types/state'

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown import/export error.')

export const useAppDataTransfer = () => {
  const queryClient = useQueryClient()
  const resetUiState = useResetUiState()

  const importedDataQueryKeys = [
    queryKeys.dashboardSummary(),
    queryKeys.dashboardActivityRoot(),
    queryKeys.jobsList(),
    queryKeys.jobsDetailRoot(),
    queryKeys.profilesListRoot(),
    queryKeys.profilesDetailRoot(),
    queryKeys.profilesDocumentRoot(),
  ] as const

  const invalidateDataQueries = async () => {
    await Promise.all(
      importedDataQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey, refetchType: 'active' })),
    )
  }

  const clearInactiveImportedDataQueries = () => {
    importedDataQueryKeys.forEach((queryKey) => {
      queryClient.removeQueries({ queryKey, type: 'inactive' })
    })
  }

  const importAppDataMutation = useMutation({
    mutationFn: (file: AppExportFile) => getAppApiClient().importAppData(file),
    onSuccess: async () => {
      resetUiState()
      await invalidateDataQueries()
      clearInactiveImportedDataQueries()
    },
  })

  const resetLocalDataMutation = useMutation({
    mutationFn: () => getAppApiClient().resetLocalData(),
    onSuccess: async () => {
      resetUiState()
      resetAppApiClient()
      await invalidateDataQueries()
      clearInactiveImportedDataQueries()
    },
  })

  const exportAppDataMutation = useMutation({
    mutationFn: () => getAppApiClient().exportAppData(),
  })

  const mutations = [importAppDataMutation, resetLocalDataMutation, exportAppDataMutation] as const

  return {
    errorMessage: mutations
      .map((mutation) => mutation.error)
      .filter(Boolean)
      .map(getErrorMessage)[0] ?? null,
    isSaving: mutations.some((mutation) => mutation.isPending),
    importAppData: async (file: AppExportFile) => {
      await importAppDataMutation.mutateAsync(file)
    },
    resetLocalData: async () => {
      await resetLocalDataMutation.mutateAsync()
    },
    exportAppData: async () => exportAppDataMutation.mutateAsync(),
  }
}