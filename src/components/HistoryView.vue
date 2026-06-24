<script setup lang="ts">
import { useGame } from '../composables/useGame'
import { formatChange } from '../utils/scoring'

const { state, getPlayer, deleteRound } = useGame()

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function confirmDelete(id: string) {
  if (confirm('確定要刪除此局紀錄？分數將一併回退。')) {
    deleteRound(id)
  }
}
</script>

<template>
  <div class="history">
    <div v-if="state.rounds.length === 0" class="empty">
      尚無歷史紀錄
    </div>

    <div v-else class="round-list">
      <div
        v-for="(round, index) in state.rounds"
        :key="round.id"
        class="round-card"
      >
        <div class="round-header">
          <span class="round-num">第 {{ state.rounds.length - index }} 局</span>
          <span class="round-time">{{ formatTime(round.timestamp) }}</span>
          <button class="delete-btn" @click="confirmDelete(round.id)">刪除</button>
        </div>

        <div class="round-winner">
          🏆 {{ getPlayer(round.winnerId)?.name }}
          <span v-if="round.hasOverThreshold" class="over-tag">≥ 門檻</span>
        </div>

        <div class="changes">
          <div
            v-for="(delta, pid) in round.changes"
            :key="pid"
            v-show="delta !== 0"
            class="change-row"
          >
            <span>{{ getPlayer(pid)?.name }}</span>
            <span :class="delta >= 0 ? 'positive' : 'negative'">
              {{ formatChange(delta) }}
            </span>
          </div>
        </div>

        <div class="card-detail">
          <span
            v-for="(count, pid) in round.cardCounts"
            :key="pid"
            class="card-chip"
          >
            {{ getPlayer(pid)?.name }}: {{ count }}張
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty {
  text-align: center;
  color: var(--text-on-felt);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  padding: 2rem 1rem;
  font-size: 0.9375rem;
  font-weight: 700;
}

.round-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.round-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 0.875rem 1rem;
  border: 1px solid var(--border);
}

.round-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.round-num {
  font-weight: 700;
  font-size: 0.9375rem;
}

.round-time {
  flex: 1;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.delete-btn {
  background: none;
  border: none;
  color: var(--red);
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.round-winner {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.over-tag {
  font-size: 0.6875rem;
  background: var(--alert-bg);
  color: var(--alert-text);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: 500;
}

.changes {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.change-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.positive {
  color: var(--green);
  font-weight: 600;
}

.negative {
  color: var(--red);
  font-weight: 600;
}

.card-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.card-chip {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}
</style>
