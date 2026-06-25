<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useGame } from '../composables/useGame'
import NumberStepper from './NumberStepper.vue'
import { formatPenalties } from '../utils/scoring'
import type { Player, ScoringConfig } from '../types'
import { DEFAULT_SCORING } from '../types'

type SettingsTab = 'threshold' | 'normal' | 'over' | 'players'

const { state, updateSettings, clearRecords } = useGame()

const activeTab = ref<SettingsTab>('threshold')

const settingsTabs: { id: SettingsTab; label: string }[] = [
  { id: 'threshold', label: '門檻' },
  { id: 'normal', label: '一般計分' },
  { id: 'over', label: '超過門檻' },
  { id: 'players', label: '玩家' },
]

const threshold = ref(state.settings.threshold)
const localPlayers = ref<Player[]>(
  JSON.parse(JSON.stringify(state.settings.players)),
)
const localScoring = ref<ScoringConfig>(
  JSON.parse(JSON.stringify(state.settings.scoring ?? DEFAULT_SCORING)),
)

function syncLinkedBonus() {
  const value = localScoring.value.winnerDeduction
  localScoring.value.recorderBonus = value
}

syncLinkedBonus()

const penaltyLabels = ['第 2 名（剩餘最少）', '第 3 名', '第 4 名（剩餘最多）']

const rulesSummary = computed(() => {
  const s = localScoring.value
  return {
    normal: formatPenalties(s.penaltiesNormal),
    over: formatPenalties(s.penaltiesOver),
  }
})

const linkedBonus = computed({
  get: () => localScoring.value.winnerDeduction,
  set: (value: number) => {
    localScoring.value.winnerDeduction = value
    localScoring.value.recorderBonus = value
  },
})

const saved = ref(false)
let savedTimer: ReturnType<typeof setTimeout> | undefined

const cleared = ref(false)
let clearedTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => state.settings,
  (s) => {
    threshold.value = s.threshold
    localPlayers.value = JSON.parse(JSON.stringify(s.players))
    localScoring.value = JSON.parse(
      JSON.stringify(s.scoring ?? DEFAULT_SCORING),
    )
    syncLinkedBonus()
  },
  { deep: true },
)

function save() {
  syncLinkedBonus()
  updateSettings(threshold.value, localPlayers.value, localScoring.value)
  saved.value = true
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => {
    saved.value = false
  }, 1500)
}

function confirmClear() {
  if (confirm('確定要清空所有分數與牌局紀錄？設定將保留。')) {
    clearRecords()
    cleared.value = true
    clearTimeout(clearedTimer)
    clearedTimer = setTimeout(() => {
      cleared.value = false
    }, 1500)
  }
}
</script>

<template>
  <div class="settings">
    <nav class="settings-tabs">
      <button
        v-for="tab in settingsTabs"
        :key="tab.id"
        class="settings-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="settings-content">
      <section v-if="activeTab === 'threshold'" class="section">
        <h2 class="felt-title">超過門檻張數</h2>
        <p class="hint felt-hint">
          任一位輸家剩餘手牌 ≥ 此張數時，該玩家改用「超過門檻計分」；其餘輸家仍用一般計分
        </p>
        <div class="scoring-row">
          <span class="scoring-label">門檻張數</span>
          <NumberStepper v-model="threshold" :min="1" :max="13" unit="張" />
        </div>

        <div class="rules-card">
          <h3>規則摘要</h3>
          <ul>
            <li>4 位玩家 + 1 位記錄者</li>
            <li>一般：<strong>{{ rulesSummary.normal }}</strong></li>
            <li>
              超過門檻（≥ {{ threshold }} 張）：<strong>{{ rulesSummary.over }}</strong>；其餘維持一般計分，贏家分紅／記錄者獲得
              <strong>{{ linkedBonus }}</strong>
            </li>
            <li>分數累計至排行榜</li>
            <li>剩餘張數相同者，平分對應名次罰款</li>
          </ul>
        </div>
      </section>

      <section v-else-if="activeTab === 'normal'" class="section">
        <h2 class="felt-title">一般計分</h2>
        <p class="hint felt-hint">未達門檻者，依剩餘手牌由少到多支付；張數相同者平分對應名次罰款</p>
        <div class="scoring-rows">
          <div
            v-for="(_, idx) in localScoring.penaltiesNormal"
            :key="'normal-' + idx"
            class="scoring-row"
          >
            <span class="scoring-label">{{ penaltyLabels[idx] }}</span>
            <NumberStepper
              v-model="localScoring.penaltiesNormal[idx]"
              :min="0"
              :max="9999"
              :step="50"
              unit="元"
            />
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'over'" class="section">
        <h2 class="felt-title">超過門檻計分</h2>
        <p class="hint felt-hint">剩餘 ≥ {{ threshold }} 張的輸家套用；未達門檻者仍用一般計分</p>
        <div class="scoring-rows">
          <div
            v-for="(_, idx) in localScoring.penaltiesOver"
            :key="'over-' + idx"
            class="scoring-row"
          >
            <span class="scoring-label">{{ penaltyLabels[idx] }}</span>
            <NumberStepper
              v-model="localScoring.penaltiesOver[idx]"
              :min="0"
              :max="9999"
              :step="50"
              unit="元"
            />
          </div>
          <div class="scoring-row">
            <span class="scoring-label">贏家分紅/記錄者獲得</span>
            <NumberStepper
              v-model="linkedBonus"
              :min="0"
              :max="9999"
              :step="50"
              unit="元"
            />
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'players'" class="section">
        <h2 class="felt-title">玩家名稱</h2>
        <p class="hint felt-hint">4 位玩家與 1 位記錄者</p>
        <div class="name-list">
          <div
            v-for="p in localPlayers"
            :key="p.id"
            class="name-row"
            :class="{ recorder: p.role === 'recorder' }"
          >
            <span v-if="p.role === 'recorder'" class="role-label felt-label">記錄者</span>
            <span v-else class="role-label felt-label">玩家</span>
            <input v-model="p.name" type="text" maxlength="8" />
          </div>
        </div>
      </section>
    </div>

    <div class="settings-actions">
      <button
        class="save-btn"
        :class="{ success: saved }"
        @click="save"
      >
        {{ saved ? '✓ 已儲存' : '儲存設定' }}
      </button>
      <button
        class="reset-btn"
        :class="{ success: cleared }"
        @click="confirmClear"
      >
        {{ cleared ? '✓ 已清空' : '清空紀錄' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
}

.settings-tabs {
  display: flex;
  gap: 0.375rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 0.125rem;
}

.settings-tabs::-webkit-scrollbar {
  display: none;
}

.settings-tab {
  flex: 1;
  min-width: 4.5rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.settings-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.settings-content {
  flex: 1;
}

.section h2 {
  margin-bottom: 0.375rem;
}

.hint {
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.hint.felt-hint {
  font-weight: 700;
  color: var(--text-on-felt-muted);
}

.scoring-rows {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.scoring-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
}

.scoring-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.name-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.name-row.recorder {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border);
}

.role-label {
  font-size: 0.75rem;
  min-width: 2.5rem;
}

.name-row input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font-size: 1rem;
}

.rules-card {
  margin-top: 1.25rem;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 0.875rem 1rem;
  border: 1px solid var(--border);
}

.rules-card h3 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.rules-card ul {
  padding-left: 1.25rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.rules-card strong {
  color: var(--accent);
}

.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding-top: 0.5rem;
}

.save-btn {
  width: 100%;
  padding: 0.875rem;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.save-btn:active:not(.success) {
  transform: scale(0.98);
}

.save-btn.success {
  background: var(--green);
}

.reset-btn {
  width: 100%;
  padding: 0.875rem;
  border: none;
  border-radius: var(--radius);
  background: var(--red);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.reset-btn:active:not(.success) {
  transform: scale(0.98);
}

.reset-btn.success {
  background: var(--green);
}
</style>
