import { computed, reactive, watch } from 'vue'
import type { GameState, Player, RoundRecord, ScoringConfig } from '../types'
import { DEFAULT_SCORING } from '../types'
import { calculateRound } from '../utils/scoring'

const STORAGE_KEY = 'bigtwo-cal-state'

const DEFAULT_PLAYERS: Player[] = [
  { id: 'p1', name: '玩家 1', role: 'player' },
  { id: 'p2', name: '玩家 2', role: 'player' },
  { id: 'p3', name: '玩家 3', role: 'player' },
  { id: 'p4', name: '玩家 4', role: 'player' },
  { id: 'p5', name: '記錄者', role: 'recorder' },
]

function createDefaultState(): GameState {
  const ids = DEFAULT_PLAYERS.map((p) => p.id)
  const scores = Object.fromEntries(ids.map((id) => [id, 0]))
  return {
    settings: {
      threshold: 10,
      scoring: { ...DEFAULT_SCORING, penaltiesNormal: [...DEFAULT_SCORING.penaltiesNormal], penaltiesOver: [...DEFAULT_SCORING.penaltiesOver] },
      players: DEFAULT_PLAYERS,
    },
    scores,
    rounds: [],
  }
}

function migrateState(parsed: GameState): GameState {
  if (!parsed.settings.scoring) {
    parsed.settings.scoring = {
      ...DEFAULT_SCORING,
      penaltiesNormal: [...DEFAULT_SCORING.penaltiesNormal],
      penaltiesOver: [...DEFAULT_SCORING.penaltiesOver],
    }
  }
  parsed.settings.scoring.recorderBonus =
    parsed.settings.scoring.winnerDeduction
  return parsed
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrateState(JSON.parse(raw) as GameState)
  } catch {
    /* ignore */
  }
  return createDefaultState()
}

const state = reactive<GameState>(loadState())

watch(
  state,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true },
)

export function useGame() {
  const players = computed(() =>
    state.settings.players.filter((p) => p.role === 'player'),
  )
  const recorder = computed(
    () => state.settings.players.find((p) => p.role === 'recorder')!,
  )
  const allPeople = computed(() => state.settings.players)

  function getPlayer(id: string) {
    return state.settings.players.find((p) => p.id === id)
  }

  function updateSettings(
    threshold: number,
    players: Player[],
    scoring: ScoringConfig,
  ) {
    state.settings.threshold = threshold
    state.settings.players = players
    state.settings.scoring = scoring

    const ids = players.map((p) => p.id)
    for (const id of ids) {
      if (!(id in state.scores)) state.scores[id] = 0
    }
    for (const key of Object.keys(state.scores)) {
      if (!ids.includes(key)) delete state.scores[key]
    }
  }

  function addRound(
    winnerId: string,
    cardCounts: Record<string, number>,
  ): RoundRecord {
    const playerIds = players.value.map((p) => p.id)
    const result = calculateRound(
      winnerId,
      cardCounts,
      state.settings.threshold,
      playerIds,
      recorder.value.id,
      state.settings.scoring,
    )

    const record: RoundRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      winnerId,
      cardCounts: { ...cardCounts },
      hasOverThreshold: result.hasOverThreshold,
      changes: result.changes,
    }

    for (const [id, delta] of Object.entries(result.changes)) {
      state.scores[id] = (state.scores[id] ?? 0) + delta
    }

    state.rounds.unshift(record)
    return record
  }

  function deleteRound(id: string) {
    const index = state.rounds.findIndex((r) => r.id === id)
    if (index === -1) return

    const record = state.rounds[index]
    for (const [pid, delta] of Object.entries(record.changes)) {
      state.scores[pid] = (state.scores[pid] ?? 0) - delta
    }
    state.rounds.splice(index, 1)
  }

  function restoreDefaults() {
    const defaults = createDefaultState()
    state.settings.threshold = defaults.settings.threshold
    state.settings.scoring = JSON.parse(
      JSON.stringify(defaults.settings.scoring),
    )
    state.settings.players = JSON.parse(
      JSON.stringify(defaults.settings.players),
    )
  }

  function clearRecords() {
    const ids = state.settings.players.map((p) => p.id)
    state.scores = Object.fromEntries(ids.map((id) => [id, 0]))
    state.rounds.splice(0, state.rounds.length)
  }

  return {
    state,
    players,
    recorder,
    allPeople,
    getPlayer,
    updateSettings,
    addRound,
    deleteRound,
    restoreDefaults,
    clearRecords,
  }
}
