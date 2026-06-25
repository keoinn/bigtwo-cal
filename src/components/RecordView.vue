<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGame } from '../composables/useGame'
import { calculateRound, formatPenalties } from '../utils/scoring'

const { players, recorder, state, addRound } = useGame()

const winnerId = ref('')
const cardCounts = ref<Record<string, number>>({})

function initCardCounts() {
  const counts: Record<string, number> = {}
  for (const p of players.value) {
    counts[p.id] = cardCounts.value[p.id] ?? 0
  }
  cardCounts.value = counts
}

initCardCounts()

watch(winnerId, (id) => {
  if (id) cardCounts.value[id] = 0
})

const preview = computed(() => {
  if (!winnerId.value) return null
  const allValid = players.value.every(
    (p) => cardCounts.value[p.id] !== undefined && cardCounts.value[p.id] >= 0,
  )
  if (!allValid) return null

  return calculateRound(
    winnerId.value,
    cardCounts.value,
    state.settings.threshold,
    players.value.map((p) => p.id),
    recorder.value.id,
    state.settings.scoring,
  )
})

const scoringRules = computed(() => {
  const s = state.settings.scoring
  return {
    threshold: state.settings.threshold,
    normal: formatPenalties(s.penaltiesNormal),
    over: formatPenalties(s.penaltiesOver),
    bonus: s.winnerDeduction,
  }
})

const currentRound = computed(() => state.rounds.length + 1)

const canSubmit = computed(() => {
  if (!winnerId.value) return false
  return players.value.every((p) => {
    const n = cardCounts.value[p.id]
    return n !== undefined && n >= 0 && Number.isInteger(n)
  })
})

const submitted = ref(false)

function submit() {
  if (!canSubmit.value) return
  addRound(winnerId.value, { ...cardCounts.value })
  submitted.value = true
  setTimeout(() => {
    submitted.value = false
    winnerId.value = ''
    initCardCounts()
  }, 1200)
}

function getPlayerName(id: string) {
  return players.value.find((p) => p.id === id)?.name ?? id
}

function isTiedLoser(previewResult: NonNullable<typeof preview.value>, idx: number) {
  if (idx <= 0) return false
  const losers = previewResult.sortedLosers
  return (
    cardCounts.value[losers[idx]] === cardCounts.value[losers[idx - 1]]
  )
}

function adjustCardCount(playerId: string, delta: number) {
  if (playerId === winnerId.value) return
  const current = cardCounts.value[playerId] ?? 0
  cardCounts.value[playerId] = Math.max(0, Math.min(13, current + delta))
}

const holdTimers = {
  delay: null as ReturnType<typeof setTimeout> | null,
  repeat: null as ReturnType<typeof setInterval> | null,
}

function canStep(playerId: string, delta: number) {
  if (playerId === winnerId.value) return false
  const current = cardCounts.value[playerId] ?? 0
  return delta < 0 ? current > 0 : current < 13
}

function startStepHold(playerId: string, delta: number) {
  if (!canStep(playerId, delta)) return

  const tick = () => {
    if (!canStep(playerId, delta)) {
      stopStepHold()
      return
    }
    adjustCardCount(playerId, delta)
  }

  tick()
  holdTimers.delay = setTimeout(() => {
    holdTimers.repeat = setInterval(tick, 80)
  }, 350)
}

function stopStepHold() {
  if (holdTimers.delay) clearTimeout(holdTimers.delay)
  if (holdTimers.repeat) clearInterval(holdTimers.repeat)
  holdTimers.delay = null
  holdTimers.repeat = null
}
</script>

<template>
  <div class="record-view">
    <div class="round-badge">
      <span class="round-label">當前局數</span>
      <span class="round-number">第 {{ currentRound }} 局</span>
    </div>

    <div class="info-card">
      <div class="info-header">
        <span class="label">門檻</span>
        <span class="value">≥ {{ scoringRules.threshold }} 張</span>
      </div>
      <ul class="rule-list">
        <li>一般：{{ scoringRules.normal }}</li>
        <li>
          超過門檻（≥ {{ scoringRules.threshold }} 張）者：{{ scoringRules.over }}；其餘維持一般計分，贏家分紅／記錄者 +{{ scoringRules.bonus }}
        </li>
        <li>剩餘張數相同者，平分對應名次罰款</li>
      </ul>
    </div>

    <section class="section">
      <h2 class="felt-title">選擇贏家</h2>
      <div class="player-grid">
        <button
          v-for="p in players"
          :key="p.id"
          class="player-btn"
          :class="{ active: winnerId === p.id }"
          @click="winnerId = p.id"
        >
          {{ p.name }}
        </button>
      </div>
    </section>

    <section v-if="winnerId" class="section">
      <h2 class="felt-title">剩餘手牌張數</h2>
      <p class="section-hint">贏家固定 0 張，其餘依實際剩餘張數填寫</p>
      <div class="card-inputs">
        <div
          v-for="p in players"
          :key="p.id"
          class="card-input-row"
          :class="{ winner: p.id === winnerId }"
        >
          <div class="card-input-header">
            <label>{{ p.name }}</label>
            <span v-if="p.id === winnerId" class="badge">贏家</span>
          </div>
          <div class="card-count-input" :class="{ locked: p.id === winnerId }">
            <button
              type="button"
              class="step-btn"
              :disabled="p.id === winnerId || cardCounts[p.id] <= 0"
              @pointerdown.prevent="startStepHold(p.id, -1)"
              @pointerup="stopStepHold"
              @pointerleave="stopStepHold"
              @pointercancel="stopStepHold"
            >
              −
            </button>
            <input
              type="number"
              inputmode="numeric"
              min="0"
              max="13"
              :value="cardCounts[p.id]"
              :disabled="p.id === winnerId"
              @input="
                p.id !== winnerId &&
                  (cardCounts[p.id] = Math.max(
                    0,
                    Math.min(
                      13,
                      parseInt(($event.target as HTMLInputElement).value) || 0,
                    ),
                  ))
              "
            />
            <button
              type="button"
              class="step-btn"
              :disabled="p.id === winnerId || cardCounts[p.id] >= 13"
              @pointerdown.prevent="startStepHold(p.id, 1)"
              @pointerup="stopStepHold"
              @pointerleave="stopStepHold"
              @pointercancel="stopStepHold"
            >
              +
            </button>
            <span class="unit">張</span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="preview" class="section preview">
      <h2 class="surface-title">本局預覽</h2>
      <div v-if="preview.hasOverThreshold" class="alert">
        ⚠️ 有人剩餘 ≥ {{ state.settings.threshold }} 張，該玩家罰款加倍
      </div>
      <div class="preview-list">
        <div
          v-for="(pid, idx) in preview.sortedLosers"
          :key="pid"
          class="preview-row loser"
        >
          <span>
            {{ getPlayerName(pid) }}
            <span v-if="isTiedLoser(preview, idx)" class="tie-tag">並列</span>
          </span>
          <span>{{ cardCounts[pid] }} 張</span>
          <span class="amount negative">-{{ preview.penalties[idx] }}</span>
        </div>
        <div class="preview-row winner">
          <span>{{ getPlayerName(winnerId) }}</span>
          <span>贏家</span>
          <span
            class="amount"
            :class="preview.changes[winnerId] >= 0 ? 'positive' : 'negative'"
          >
            {{ preview.changes[winnerId] >= 0 ? '+' : '' }}{{ preview.changes[winnerId] }}
          </span>
        </div>
        <div v-if="preview.hasOverThreshold" class="preview-row recorder">
          <span>{{ recorder.name }}</span>
          <span>記錄者</span>
          <span class="amount positive">+{{ preview.changes[recorder.id] }}</span>
        </div>
      </div>
    </section>

    <button
      class="submit-btn"
      :disabled="!canSubmit"
      :class="{ success: submitted }"
      @click="submit"
    >
      {{ submitted ? '✓ 已記錄' : '確認記錄' }}
    </button>
  </div>
</template>

<style scoped>
.record-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.round-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.round-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-muted);
}

.round-number {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--accent);
}

.info-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  font-size: 0.875rem;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-card .label {
  color: var(--text-muted);
}

.info-card .value {
  font-weight: 700;
  color: var(--accent);
}

.rule-list {
  margin: 0;
  padding-left: 1.125rem;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  line-height: 1.7;
}

.rule-list li::marker {
  color: var(--accent);
}

.section h2 {
  margin-bottom: 0.625rem;
}

.section-hint {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-on-felt);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  margin-bottom: 0.75rem;
}

.player-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
}

.player-btn {
  padding: 1rem;
  border-radius: var(--radius);
  border: 2px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.player-btn.active {
  border-color: var(--winner-border);
  background: var(--winner-bg);
  color: var(--winner-text);
  font-weight: 600;
}

.card-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.card-input-row {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
}

.card-input-row.winner {
  border-color: var(--winner-border);
  background: var(--winner-bg);
}

.card-input-row.winner .card-input-header label {
  color: var(--winner-text);
  font-weight: 600;
}

.card-input-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-input-header label {
  font-weight: 500;
  font-size: 0.9375rem;
}

.card-count-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-count-input input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-count-input.locked .step-btn:disabled {
  opacity: 0.35;
}

.step-btn {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--text);
  touch-action: manipulation;
  user-select: none;
}

.step-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.card-count-input input {
  width: 4rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
}

.unit {
  font-size: 1rem;
  color: var(--text-muted);
}

.badge {
  font-size: 0.75rem;
  background: var(--accent);
  color: #fff;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
}

.preview {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 1rem;
  border: 1px solid var(--border);
}

.preview .surface-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--winner-text);
  margin-bottom: 0.625rem;
}

.alert {
  background: var(--alert-bg);
  color: var(--alert-text);
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
}

.tie-tag {
  font-size: 0.6875rem;
  background: var(--winner-bg);
  color: var(--winner-text);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  margin-left: 0.375rem;
  font-weight: 600;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
}

.preview-row span:first-child {
  flex: 1;
  font-weight: 500;
}

.preview-row span:nth-child(2) {
  color: var(--text-muted);
  font-size: 0.8125rem;
  min-width: 3rem;
  text-align: right;
}

.amount {
  font-weight: 700;
  min-width: 4rem;
  text-align: right;
}

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.submit-btn.success {
  background: var(--green);
}
</style>
