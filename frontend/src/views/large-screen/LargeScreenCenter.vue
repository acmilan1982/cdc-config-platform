<template>
  <div class="lsc-container">
    <!-- 同步概览 -->
    <div class="lsc-panel lsc-overview">
      <div class="lsc-panel-body lsc-3d-area">
        <div class="lsc-center-bg"></div>

        <div class="lsc-stat-hero lsc-pos-tl">
          <div class="lsc-hero-label">今日同步量</div>
          <div class="lsc-hero-value">
            <span v-html="formatLargeNum(metrics.todaySync)"></span>
          </div>
        </div>

        <div class="lsc-stat-hero lsc-pos-tr">
          <div class="lsc-hero-label">累计同步量</div>
          <div class="lsc-hero-value">
            <span v-html="formatLargeNum(metrics.cumulativeSync)"></span>
          </div>
        </div>

        <!-- 四组规模指标 -->
        <div class="lsc-stat-icon lsc-pos-bl">
          <div class="lsc-icon-wrap"><img src="@/assets/large-screen/source/icon_1.png" alt="" /></div>
          <div class="lsc-icon-info">
            <div class="lsc-icon-label">接入机构数</div>
            <div class="lsc-icon-value">{{ fmtNum(coverage.institutionCount) }}</div>
          </div>
        </div>
        <div class="lsc-stat-icon lsc-pos-bcl">
          <div class="lsc-icon-wrap"><img src="@/assets/large-screen/source/icon_2.png" alt="" /></div>
          <div class="lsc-icon-info">
            <div class="lsc-icon-label">启用客户端数</div>
            <div class="lsc-icon-value">{{ fmtNum(coverage.clientCount) }}</div>
          </div>
        </div>
        <div class="lsc-stat-icon lsc-pos-bcr">
          <div class="lsc-icon-wrap"><img src="@/assets/large-screen/source/icon_3.png" alt="" /></div>
          <div class="lsc-icon-info">
            <div class="lsc-icon-label">业务库数</div>
            <div class="lsc-icon-value">{{ fmtNum(coverage.sourceDbCount) }}</div>
          </div>
        </div>
        <div class="lsc-stat-icon lsc-pos-br">
          <div class="lsc-icon-wrap"><img src="@/assets/large-screen/source/icon_4.png" alt="" /></div>
          <div class="lsc-icon-info">
            <div class="lsc-icon-label">订阅表数</div>
            <div class="lsc-icon-value">{{ fmtNum(coverage.subscribeTableCount) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 目标库同步量 Top10 -->
    <div class="lsc-panel lsc-detail">
      <div class="lsc-panel-header lsc-panel-header-lg">目标库同步量 Top10</div>
      <div class="lsc-panel-body lsc-table-wrap">
        <div v-if="targetList.length === 0" class="lsc-empty">暂无统计数据</div>
        <table v-else class="lsc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>目标库名称</th>
              <th>成功量</th>
              <th>错误量</th>
              <th>总同步量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in targetList" :key="item.key">
              <td class="lsc-td-rank">{{ item.rank }}</td>
              <td class="lsc-td-name" :title="item.name">{{ item.name }}</td>
              <td class="lsc-td-success">{{ fmtLong(item.successCount) }}</td>
              <td :class="{ 'lsc-td-error': (item.errorCount || 0) > 0 }">{{ fmtLong(item.errorCount) }}</td>
              <td class="lsc-td-total">{{ fmtLong(item.totalCount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CoreMetricsVO, CoverageStatsVO, TopItemVO } from '@/types/largeScreen'

const props = defineProps<{
  coreMetrics: CoreMetricsVO | null
  coverageStats: CoverageStatsVO | null
  targetDatabases: TopItemVO[]
  tables: TopItemVO[]
}>()

const metrics = computed(() => props.coreMetrics || {
  todaySync: 0, cumulativeSync: 0, todaySuccess: 0, todayError: 0, todaySuccessRate: 0
} as CoreMetricsVO)

const coverage = computed(() => props.coverageStats || {
  institutionCount: 0, clientCount: 0, sourceDbCount: 0, targetDbCount: 0, subscribeTableCount: 0
} as CoverageStatsVO)

const targetList = computed(() => {
  return [...props.targetDatabases].sort((a, b) => (a.rank || 0) - (b.rank || 0))
})

function fmtNum(v: number | undefined | null): string { return v == null ? '--' : v.toLocaleString() }
function fmtLong(v: number | undefined | null): string { return v == null ? '--' : v.toLocaleString() }

function formatLargeNum(num: number | undefined | null): string {
  if (num == null || num === 0) return '<span>0</span>'
  if (num >= 100000000) { const v = (num / 100000000).toFixed(1); return `<span>${v}</span><span class="lsc-unit">亿条</span>` }
  if (num >= 10000) { const v = (num / 10000).toFixed(1); return `<span>${v}</span><span class="lsc-unit">万条</span>` }
  return `<span>${num.toLocaleString()}</span>`
}
</script>

<style scoped>
.lsc-container { height: 100%; display: flex; flex-direction: column; gap: 11px; }

.lsc-panel {
  display: flex; flex-direction: column;
  border: 1px solid rgba(0, 210, 255, 0.3); background: rgba(5, 22, 52, 0.85); position: relative;
}
.lsc-panel::before {
  content: ''; position: absolute; top: -1px; left: 20px; right: 20px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.55), transparent);
}
.lsc-panel-header {
  height: 36px; line-height: 36px; padding: 0 20px; font-size: 15px; font-weight: 700;
  color: #e0f4ff; background: url('@/assets/large-screen/source/panel_bg.png') no-repeat center;
  background-size: 100% 100%; text-align: center;
}
.lsc-panel-header-lg { background-image: url('@/assets/large-screen/source/panel_bg_large.png'); }
.lsc-panel-body { flex: 1; min-height: 0; }

/* 3D 环形区域 */
.lsc-overview { flex: 2.8; }
.lsc-3d-area { position: relative; overflow: visible; }
.lsc-center-bg {
  position: absolute; inset: 5% 8%;
  background: url('@/assets/large-screen/source/icon_center.png') no-repeat center;
  background-size: contain; opacity: 0.85; pointer-events: none;
}

.lsc-stat-hero {
  position: absolute; width: 19vw; max-width: 300px; height: 7vh; max-height: 70px;
  background: url('@/assets/large-screen/source/icon_title.png') no-repeat center;
  background-size: 100% 100%;
  display: flex; flex-direction: column; justify-content: center; padding: 0 15px 0 60px;
}
.lsc-pos-tl { top: 3%; left: 2%; }
.lsc-pos-tr { top: 3%; right: 2%; }
.lsc-hero-label { font-size: 14px; color: rgba(255,255,255,0.95); line-height: 1.3; }
.lsc-hero-value { font-size: 22px; font-weight: 700; color: #00f0ff; line-height: 1.3; text-shadow: 0 0 14px rgba(0,240,255,0.55); }
.lsc-hero-value :deep(.lsc-unit) { font-size: 11px; color: #a0e8ff; margin-left: 4px; }

.lsc-stat-icon { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
.lsc-pos-bl  { bottom: 18%; left: 5%; }
.lsc-pos-bcl { bottom: 5%;  left: 28%; }
.lsc-pos-bcr { bottom: 5%;  right: 28%; }
.lsc-pos-br  { bottom: 18%; right: 5%; }
.lsc-icon-wrap { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lsc-icon-wrap img { width: 70px; height: auto; object-fit: contain; }
.lsc-icon-label { font-size: 13px; color: rgba(255,255,255,0.9); padding: 4px 12px; background: url('@/assets/large-screen/source/Rectangle194522x.png') no-repeat center; background-size: 100% 100%; white-space: nowrap; }
.lsc-icon-value { font-size: 20px; font-weight: 700; color: #00f0ff; text-shadow: 0 0 12px rgba(0,240,255,0.5); }

/* 目标库表格 */
.lsc-detail { flex: 2; min-height: 0; }
.lsc-table-wrap { overflow: hidden; padding: 4px 8px; }
.lsc-empty { text-align: center; padding-top: 20px; color: #8aa0b8; font-size: 13px; }
.lsc-table { width: 100%; border-collapse: collapse; font-size: 12px; color: #d8e8f8; }
.lsc-table thead th { background: transparent; color: #c0d8f0; font-weight: 500; font-size: 12px; padding: 5px 4px; text-align: center; border-bottom: 1px solid rgba(0,200,255,0.15); }
.lsc-table tbody td { padding: 4px; text-align: center; border-bottom: 1px solid rgba(0,200,255,0.05); }
.lsc-table tbody tr:hover { background: rgba(0,200,255,0.06); }
.lsc-td-rank { width: 30px; color: #8aa0b8; }
.lsc-td-name { text-align: left !important; padding-left: 8px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
.lsc-td-success { color: #69f0ae; }
.lsc-td-error { color: #ff6b6b; }
.lsc-td-total { color: #00f0ff; font-weight: 700; }
</style>
