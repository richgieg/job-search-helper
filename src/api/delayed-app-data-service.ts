import type { AppDataService } from './app-data-service'

export interface AppDataServiceDelayOptions {
  minDelayMs: number
  maxDelayMs: number
  random?: () => number
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => {
  globalThis.setTimeout(resolve, ms)
})

export const getSimulatedDelayMs = ({
  minDelayMs,
  maxDelayMs,
  random = Math.random,
}: Pick<AppDataServiceDelayOptions, 'minDelayMs' | 'maxDelayMs' | 'random'>): number => {
  if (maxDelayMs <= minDelayMs) {
    return minDelayMs
  }

  return Math.round(minDelayMs + random() * (maxDelayMs - minDelayMs))
}

export const createDelayedAppDataService = <T extends AppDataService>(
  service: T,
  options: AppDataServiceDelayOptions,
): T => {
  const sleep = options.sleep ?? defaultSleep

  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)

      if (typeof property !== 'string' || property === 'constructor' || typeof value !== 'function') {
        return value
      }

      return async (...args: unknown[]) => {
        await sleep(getSimulatedDelayMs(options))
        return Reflect.apply(value, target, args)
      }
    },
  })
}