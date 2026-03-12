import type { BulletLevel } from '../types/state'

export const bulletLevels: BulletLevel[] = [1, 2, 3]
export const defaultBulletLevel: BulletLevel = 1

export const bulletLevelLabels: Record<BulletLevel, string> = {
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
}

export const isBulletLevel = (value: unknown): value is BulletLevel => bulletLevels.includes(value as BulletLevel)

export const parseBulletLevel = (value: string): BulletLevel | null => {
  const parsedValue = Number.parseInt(value, 10)

  return isBulletLevel(parsedValue) ? parsedValue : null
}

export const getBulletIndentClassName = (level: BulletLevel) => {
  switch (level) {
    case 2:
      return 'ml-5'
    case 3:
      return 'ml-10'
    case 1:
    default:
      return 'ml-0'
  }
}

export const getResumeBulletMarkerClassName = (level: BulletLevel) => {
  switch (level) {
    case 2:
      return 'list-[circle]'
    case 3:
      return 'list-[square]'
    case 1:
    default:
      return 'list-disc'
  }
}

export const formatBulletCopyLine = (content: string, level: BulletLevel) => `${'  '.repeat(level - 1)}- ${content}`