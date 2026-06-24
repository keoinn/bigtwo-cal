<script setup lang="ts">
import { ref } from 'vue'
import RecordView from './components/RecordView.vue'
import ScoreboardView from './components/ScoreboardView.vue'
import HistoryView from './components/HistoryView.vue'
import SettingsView from './components/SettingsView.vue'
import { useFullscreen } from './composables/useFullscreen'
import { usePwaInstall } from './composables/usePwaInstall'

type Tab = 'record' | 'scoreboard' | 'history' | 'settings'

const activeTab = ref<Tab>('record')
const { isFullscreen, supported, toggle: toggleFullscreen } = useFullscreen()
const {
  showInstallButton,
  showIOSHint,
  install,
  dismissIOSHint,
} = usePwaInstall()

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
      <button
        v-if="showInstallButton"
        type="button"
        class="header-action install-btn"
        aria-label="安裝 App"
        @click="install"
      >
        <span class="header-action-icon">📲</span>
        <span class="header-action-label">安裝</span>
      </button>
      <button
        v-if="supported"
        type="button"
        class="header-action fullscreen-btn"
        :aria-label="isFullscreen ? '退出全螢幕' : '進入全螢幕'"
        @click="toggleFullscreen"
      >
        <span class="header-action-icon">{{ isFullscreen ? '⤡' : '⛶' }}</span>
        <span class="header-action-label">{{ isFullscreen ? '退出' : '全螢幕' }}</span>
      </button>
      <h1 class="felt-title">牌局計算機</h1>
    </header>

    <div v-if="showIOSHint" class="ios-hint-overlay" @click.self="dismissIOSHint">
      <div class="ios-hint-card">
        <h3>安裝到主畫面</h3>
        <p>請點選 Safari 底部的 <strong>分享</strong> 按鈕，再選擇 <strong>加入主畫面</strong>。</p>
        <button type="button" class="ios-hint-close" @click="dismissIOSHint">
          知道了
        </button>
      </div>
    </div>

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
  position: relative;
  padding: calc(1rem + env(safe-area-inset-top, 0px)) 3.75rem 0.75rem;
  text-align: center;
  flex-shrink: 0;
}

.header-action {
  position: absolute;
  top: calc(0.875rem + env(safe-area-inset-top, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem 0.375rem;
  border: 1px solid var(--border-felt);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-on-felt);
  cursor: pointer;
  touch-action: manipulation;
}

.install-btn {
  left: 1rem;
}

.fullscreen-btn {
  right: 1rem;
}

.header-action-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.header-action-label {
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
}

.ios-hint-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(1.5rem + env(safe-area-inset-top, 0px)) 1.5rem
    calc(1.5rem + env(safe-area-inset-bottom, 0px));
}

.ios-hint-card {
  width: 100%;
  max-width: 320px;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 1.25rem;
  border: 1px solid var(--border);
}

.ios-hint-card h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.625rem;
}

.ios-hint-card p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.ios-hint-close {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
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
