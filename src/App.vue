<script setup lang="ts">
import { ref } from 'vue'
import RecordView from './components/RecordView.vue'
import ScoreboardView from './components/ScoreboardView.vue'
import HistoryView from './components/HistoryView.vue'
import SettingsView from './components/SettingsView.vue'

type Tab = 'record' | 'scoreboard' | 'history' | 'settings'

const activeTab = ref<Tab>('record')

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'record', label: '記分', icon: '✏️' },
  { id: 'scoreboard', label: '排行', icon: '🏆' },
  { id: 'history', label: '紀錄', icon: '📋' },
  { id: 'settings', label: '設定', icon: '⚙️' },
]
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="felt-title">牌局計算機</h1>
    </header>

    <main class="main">
      <RecordView v-if="activeTab === 'record'" />
      <ScoreboardView v-else-if="activeTab === 'scoreboard'" />
      <HistoryView v-else-if="activeTab === 'history'" />
      <SettingsView v-else-if="activeTab === 'settings'" />
    </main>

    <nav class="bottom-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="nav-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
}

.header {
  padding: 1rem 1.25rem 0.75rem;
  text-align: center;
  flex-shrink: 0;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem 1rem;
  -webkit-overflow-scrolling: touch;
}

.bottom-nav {
  display: flex;
  border-top: 1px solid var(--border-felt);
  background: var(--felt-dark);
  padding: 0.375rem 0 calc(0.375rem + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.375rem 0;
  border: none;
  background: none;
  color: rgba(245, 240, 225, 0.55);
  cursor: pointer;
  transition: color 0.15s;
}

.nav-btn.active {
  color: var(--accent);
}

.nav-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.nav-label {
  font-size: 0.6875rem;
  font-weight: 500;
}
</style>
