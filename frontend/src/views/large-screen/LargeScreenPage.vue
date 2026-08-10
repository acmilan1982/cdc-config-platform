<template>
  <div class="ls-container">
    <header class="ls-header">
      <div class="ls-header-bg"></div>
      <div class="ls-header-content">
        <div class="ls-header-left">
          <div class="ls-date-group">
            <span class="ls-weekday">{{ currentWeekday }}</span>
            <span class="ls-date">{{ currentDate }}</span>
          </div>
        </div>
        <div class="ls-header-center">
          <h1 class="ls-title">{{ dashboardTitle }}</h1>
        </div>
        <div class="ls-header-right">
          <div class="ls-header-meta">
            <span v-if="dataStatusText" class="ls-data-status">{{ dataStatusText }}</span>
            <span v-if="dataUpdateTime" class="ls-update-time">更新 {{ dataUpdateTime }}</span>
            <span class="ls-time">{{ currentTime }}</span>
          </div>
        </div>
      </div>
    </header>

    <div v-if="pageState === 'loading'" class="ls-state-overlay">
      <div class="ls-state-text">数据加载中...</div>
    </div>

    <div v-else-if="pageState === 'error'" class="ls-state-overlay">
      <div class="ls-state-text ls-state-error">数据加载失败，请稍后刷新页面</div>
    </div>

    <template v-else>
      <div v-if="dataStale" class="ls-stale-banner">数据刷新失败，当前数据可能已过期</div>

      <div class="ls-body">
        <div class="ls-left">
          <LargeScreenLeft
            :core-metrics="dashboardData?.coreMetrics ?? null"
            :today-ratio="dashboardData?.todayRatio ?? null"
            :source-databases="dashboardData?.top?.sourceDatabases ?? []"
          />
        </div>
        <div class="ls-center">
          <LargeScreenCenter
            :core-metrics="dashboardData?.coreMetrics ?? null"
            :coverage-stats="dashboardData?.coverageStats ?? null"
            :target-databases="dashboardData?.top?.targetDatabases ?? []"
            :tables="dashboardData?.top?.tables ?? []"
          />
        </div>
        <div class="ls-right">
          <LargeScreenRight
            :seven-day-trend="dashboardData?.sevenDayTrend ?? []"
            :tables="dashboardData?.top?.tables ?? []"
          />
        </div>
      </div>
    </template>

    <footer class="ls-footer"></footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import LargeScreenLeft from './LargeScreenLeft.vue'
import LargeScreenCenter from './LargeScreenCenter.vue'
import LargeScreenRight from './LargeScreenRight.vue'
import { fetchDashboard } from '@/api/largeScreen'
import type { DashboardVO } from '@/types/largeScreen'

type PageState = 'loading' | 'ready' | 'error'

const dashboardTitle = ref('CDC 数据同步统计大屏')
const dataStatusText = ref('')
const dataUpdateTime = ref('')
const dataStale = ref(false)
const pageState = ref<PageState>('loading')
const dashboardData = ref<DashboardVO | null>(null)

const currentDate = ref('')
const currentTime = ref('')
const currentWeekday = ref('')

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
let timeTimer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let pollActive = true
let fetchInFlight = false

const DATA_STATUS_MAP: Record<string, string> = {
  NORMAL: '数据正常',
  NO_DATA: '暂无数据',
  PARTIAL: '部分数据',
  CATCHING_UP: '追赶中'
}

function updateDateTime() {
  const now = new Date()
  currentWeekday.value = weekDays[now.getDay()]
  currentDate.value = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0')
  currentTime.value = String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0')
}

const DESIGN_W = 1920
const DESIGN_H = 1080

function handleResize() {
  const scale = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
  const offsetX = (window.innerWidth - DESIGN_W * scale) / 2
  const offsetY = (window.innerHeight - DESIGN_H * scale) / 2
  const el = document.querySelector('.ls-container') as HTMLElement
  if (el) {
    el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
  }
}

async function loadData() {
  if (fetchInFlight) return
  fetchInFlight = true
  try {
    const res = await fetchDashboard()
    if (res.code === 200 && res.data) {
      dashboardData.value = res.data
      dashboardTitle.value = res.data.title || 'CDC 数据同步统计大屏'
      dataStatusText.value = DATA_STATUS_MAP[res.data.dataStatus] || res.data.dataStatus || ''
      dataUpdateTime.value = res.data.dataUpdateTime || ''
      dataStale.value = false
      pageState.value = 'ready'
    }
  } catch {
    if (!dashboardData.value) {
      pageState.value = 'error'
    } else {
      dataStale.value = true
    }
  } finally {
    fetchInFlight = false
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    pollActive = false
  } else {
    pollActive = true
    loadData()
  }
}

onMounted(() => {
  // Reset body/html for full-viewport dark background (standalone page only)
  const htmlEl = document.documentElement
  const bodyEl = document.body
  htmlEl.style.cssText = 'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#060e1c'
  bodyEl.style.cssText = 'margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#060e1c'

  updateDateTime()
  timeTimer = setInterval(updateDateTime, 2000)
  window.addEventListener('resize', handleResize)
  handleResize()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  loadData()
  pollTimer = setInterval(() => {
    if (pollActive) loadData()
  }, 60_000)
})

onBeforeUnmount(() => {
  // Restore body/html styles
  document.documentElement.style.cssText = ''
  document.body.style.cssText = ''

  if (timeTimer) { clearInterval(timeTimer); timeTimer = null }
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  pollActive = false
})
</script>

<style scoped>
.ls-container {
  width: 1920px;
  height: 1080px;
  overflow: hidden;
  background: #060e1c;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  transform-origin: top left;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.ls-header {
  position: relative;
  width: 100%;
  height: 92px;
  flex-shrink: 0;
  z-index: 10;
}
.ls-header-bg {
  position: absolute;
  inset: 0;
  background: url('@/assets/large-screen/source/bg_nav2x.png') no-repeat center top;
  background-size: 100% 100%;
}
.ls-header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 96px;
}
.ls-header-left { display: flex; align-items: flex-end; gap: 12px; min-width: 200px; }
.ls-date-group { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; color: #c8d8e8; font-size: 14px; }
.ls-weekday { font-size: 14px; }
.ls-date { font-size: 14px; }
.ls-header-center { flex: 1; text-align: center; }
.ls-title {
  font-size: 28px; font-weight: 700; color: #f0f8ff;
  text-shadow: 0 0 24px rgba(0, 240, 255, 0.6), 0 0 48px rgba(0, 200, 255, 0.4);
  letter-spacing: 6px; margin: 0;
}
.ls-header-right { min-width: 200px; text-align: right; }
.ls-header-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.ls-data-status { font-size: 12px; color: #00e5ff; background: rgba(0, 229, 255, 0.12); padding: 2px 8px; border-radius: 2px; }
.ls-update-time { font-size: 11px; color: #8899aa; }
.ls-time { font-size: 26px; color: #00f0ff; font-weight: 700; font-variant-numeric: tabular-nums; text-shadow: 0 0 16px rgba(0, 240, 255, 0.6); }

.ls-state-overlay { flex: 1; display: flex; align-items: center; justify-content: center; z-index: 5; }
.ls-state-text { font-size: 20px; color: #8aa0b8; text-shadow: 0 0 12px rgba(0, 200, 255, 0.3); }
.ls-state-error { color: #ff6b6b; }

.ls-stale-banner { width: 100%; text-align: center; padding: 4px 0; font-size: 12px; color: #ffa726; background: rgba(255, 167, 38, 0.08); border-bottom: 1px solid rgba(255, 167, 38, 0.2); z-index: 5; }

.ls-body { flex: 1; display: flex; gap: 0; padding: 0 29px; min-height: 0; position: relative; z-index: 5; }
.ls-left, .ls-right { width: 442px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; padding-top: 11px; }
.ls-center { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 11px 19px 0; }

.ls-footer {
  width: 100%; height: 54px; flex-shrink: 0;
  background: url('@/assets/large-screen/source/bg-bottom2x.png') no-repeat center bottom;
  background-size: 100% 100%; position: relative; z-index: 10;
}
</style>
