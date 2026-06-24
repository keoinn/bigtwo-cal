import type { ScoringConfig } from '../types'

export interface RoundResult {
  changes: Record<string, number>
  hasOverThreshold: boolean
  sortedLosers: string[]
  penalties: number[]
}

/** 剩餘張數相同者，平分所佔名次的罰款（例如並列第 2、3 名則付 (200+300)/2） */
export function getLoserPenalties(
  sortedLosers: string[],
  cardCounts: Record<string, number>,
  tiers: number[],
): number[] {
  const penalties: number[] = []
  let rank = 0
  let i = 0

  while (i < sortedLosers.length) {
    const count = cardCounts[sortedLosers[i]]
    let j = i + 1
    while (
      j < sortedLosers.length &&
      cardCounts[sortedLosers[j]] === count
    ) {
      j++
    }

    const groupSize = j - i
    let sum = 0
    for (let r = rank; r < rank + groupSize; r++) {
      sum += tiers[r] ?? tiers[tiers.length - 1]
    }
    const each = Math.round(sum / groupSize)

    for (let k = i; k < j; k++) {
      penalties.push(each)
    }

    rank += groupSize
    i = j
  }

  return penalties
}

export function calculateRound(
  winnerId: string,
  cardCounts: Record<string, number>,
  threshold: number,
  playerIds: string[],
  recorderId: string,
  scoring: ScoringConfig,
): RoundResult {
  const losers = playerIds.filter((id) => id !== winnerId)
  const sortedLosers = [...losers].sort(
    (a, b) => cardCounts[a] - cardCounts[b],
  )

  const hasOverThreshold = losers.some((id) => cardCounts[id] >= threshold)
  const tiers = hasOverThreshold
    ? [...scoring.penaltiesOver]
    : [...scoring.penaltiesNormal]

  const penalties = getLoserPenalties(sortedLosers, cardCounts, tiers)

  const changes: Record<string, number> = {}
  for (const id of [...playerIds, recorderId]) {
    changes[id] = 0
  }

  let winnerGain = 0

  sortedLosers.forEach((id, index) => {
    changes[id] = -penalties[index]
    winnerGain += penalties[index]
  })

  if (hasOverThreshold) {
    const bonus = scoring.winnerDeduction
    winnerGain -= bonus
    changes[recorderId] = bonus
  }

  changes[winnerId] = winnerGain

  return { changes, hasOverThreshold, sortedLosers, penalties }
}

export function formatChange(value: number): string {
  if (value > 0) return `+${value}`
  return String(value)
}

export function formatPenalties(penalties: [number, number, number]): string {
  return penalties.join(' / ')
}

export function hasTiedCounts(
  sortedLosers: string[],
  cardCounts: Record<string, number>,
): boolean {
  for (let i = 1; i < sortedLosers.length; i++) {
    if (
      cardCounts[sortedLosers[i]] === cardCounts[sortedLosers[i - 1]]
    ) {
      return true
    }
  }
  return false
}
