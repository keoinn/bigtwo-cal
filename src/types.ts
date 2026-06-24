export interface Player {
  id: string
  name: string
  role: 'player' | 'recorder'
}

export interface ScoringConfig {
  penaltiesNormal: [number, number, number]
  penaltiesOver: [number, number, number]
  winnerDeduction: number
  recorderBonus: number
}

export interface RoundRecord {
  id: string
  timestamp: number
  winnerId: string
  cardCounts: Record<string, number>
  hasOverThreshold: boolean
  changes: Record<string, number>
}

export interface GameSettings {
  threshold: number
  scoring: ScoringConfig
  players: Player[]
}

export interface GameState {
  settings: GameSettings
  scores: Record<string, number>
  rounds: RoundRecord[]
}

export const DEFAULT_SCORING: ScoringConfig = {
  penaltiesNormal: [100, 200, 300],
  penaltiesOver: [200, 400, 600],
  winnerDeduction: 100,
  recorderBonus: 100,
}
