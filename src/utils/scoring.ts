import type { ScoringConfig } from '../types'

export interface RoundResult {
  changes: Record<string, number>
  hasOverThreshold: boolean
  sortedLosers: string[]
  penalties: number[]
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
  const penalties = hasOverThreshold
    ? [...scoring.penaltiesOver]
    : [...scoring.penaltiesNormal]

  const changes: Record<string, number> = {}
  for (const id of [...playerIds, recorderId]) {
    changes[id] = 0
  }

  let winnerGain = penalties.reduce((sum, p) => sum + p, 0)

  sortedLosers.forEach((id, index) => {
    changes[id] = -penalties[index]
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
