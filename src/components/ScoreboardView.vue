<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../composables/useGame'
import { formatChange } from '../utils/scoring'

const { allPeople, state } = useGame()

const sortedScores = computed(() => {
  return [...allPeople.value]
    .map((p) => ({
      ...p,
      score: state.scores[p.id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
})

const maxAbs = computed(() => {
  const vals = sortedScores.value.map((s) => Math.abs(s.score))
  return Math.max(...vals, 1)
})
</script>

<template>
  <div class="scoreboard">
    <div class="summary">
      <span class="round-count">共 {{ state.rounds.length }} 局</span>
    </div>

    <div class="score-list">
      <div
        v-for="(item, index) in sortedScores"
        :key="item.id"
        class="score-card"
        :class="{ recorder: item.role === 'recorder' }"
      >
        <div class="rank">{{ index + 1 }}</div>
        <div class="info">
          <div class="name-row">
            <span class="name">{{ item.name }}</span>
            <span v-if="item.role === 'recorder'" class="role-tag">記錄者</span>
          </div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :class="item.score >= 0 ? 'positive' : 'negative'"
              :style="{ width: `${(Math.abs(item.score) / maxAbs) * 100}%` }"
            />
          </div>
        </div>
        <div
          class="score"
          :class="item.score >= 0 ? 'positive' : 'negative'"
        >
          {{ formatChange(item.score) }}
        </div>
      </div>
    </div>

    <div v-if="state.rounds.length === 0" class="empty">
      尚無牌局紀錄，請至「記分」開始記錄
    </div>
  </div>
</template>

<style scoped>
.scoreboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary {
  text-align: center;
}

.round-count {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-on-felt);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 0.875rem 1rem;
  border: 1px solid var(--border);
}

.score-card.recorder {
  border-style: dashed;
}

.rank {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--winner-bg);
  border: 1px solid var(--winner-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--winner-text);
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.name {
  font-weight: 600;
  font-size: 0.9375rem;
}

.role-tag {
  font-size: 0.6875rem;
  background: var(--winner-bg);
  color: var(--winner-text);
  border: 1px solid var(--border);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.bar-track {
  height: 4px;
  background: color-mix(in srgb, var(--border) 45%, var(--surface));
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.bar-fill.positive {
  background: var(--green);
}

.bar-fill.negative {
  background: var(--red);
}

.score {
  font-size: 1.125rem;
  font-weight: 700;
  min-width: 4rem;
  text-align: right;
  flex-shrink: 0;
}

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}

.empty {
  text-align: center;
  color: var(--text-on-felt);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  padding: 2rem 1rem;
  font-size: 0.9375rem;
  font-weight: 700;
}
</style>
