import { useCallback, useEffect, useState } from 'react'

type StorageEstimateWithDetails = StorageEstimate & {
  usageDetails?: {
    indexedDB?: number
  }
}

export interface BrowserStorageEstimateSummary {
  available: boolean
  indexedDbBytes: number | null
  isLoading: boolean
  quotaBytes: number | null
  remainingBytes: number | null
  remainingPercent: number | null
  usageBytes: number | null
  usedPercent: number | null
}

const unavailableSummary: BrowserStorageEstimateSummary = {
  available: false,
  indexedDbBytes: null,
  isLoading: false,
  quotaBytes: null,
  remainingBytes: null,
  remainingPercent: null,
  usageBytes: null,
  usedPercent: null,
}

const summarizeStorageEstimate = (estimate: StorageEstimateWithDetails): BrowserStorageEstimateSummary => {
  const usageBytes = typeof estimate.usage === 'number' ? estimate.usage : null
  const quotaBytes = typeof estimate.quota === 'number' ? estimate.quota : null
  const indexedDbBytes = typeof estimate.usageDetails?.indexedDB === 'number' ? estimate.usageDetails.indexedDB : null
  const remainingBytes = usageBytes !== null && quotaBytes !== null ? Math.max(quotaBytes - usageBytes, 0) : null
  const usedPercent = usageBytes !== null && quotaBytes && quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : null
  const remainingPercent = usedPercent !== null ? Math.max(100 - usedPercent, 0) : null

  return {
    available: true,
    indexedDbBytes,
    isLoading: false,
    quotaBytes,
    remainingBytes,
    remainingPercent,
    usageBytes,
    usedPercent,
  }
}

export const useBrowserStorageEstimate = () => {
  const [summary, setSummary] = useState<BrowserStorageEstimateSummary>({
    ...unavailableSummary,
    isLoading: true,
  })

  const refresh = useCallback(async () => {
    if (!navigator.storage?.estimate) {
      setSummary(unavailableSummary)
      return
    }

    setSummary((current) => ({
      ...current,
      isLoading: true,
    }))

    try {
      const estimate = (await navigator.storage.estimate()) as StorageEstimateWithDetails
      setSummary(summarizeStorageEstimate(estimate))
    } catch {
      setSummary(unavailableSummary)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    ...summary,
    refresh,
  }
}