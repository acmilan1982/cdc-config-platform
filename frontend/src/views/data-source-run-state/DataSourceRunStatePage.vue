<template>
  <div class="dss-page">
    <!-- 页头语义区：标题 + 功能说明（DSS-REQ-066①，AC-069） -->
    <header class="dss-page-header">
      <h2 class="dss-title">源库快照状态</h2>
      <p class="dss-desc">展示各探针端与源库组合的初始快照阶段状态；页面只读。</p>
    </header>

    <!-- 首次加载失败且从未成功：错误态 + 重新加载（仅 retry 在途按钮 loading，UI §7.2，AC-056） -->
    <section v-if="firstLoadError" class="dss-card dss-error-card" role="alert">
      <el-icon class="dss-error-icon"><WarningFilled /></el-icon>
      <p class="dss-error-title">数据加载失败</p>
      <p class="dss-error-desc">暂时无法获取快照状态数据，请重新加载或稍后自动重试。</p>
      <el-button type="primary" plain :loading="retryLoading" @click="onRetry">重新加载</el-button>
    </section>

    <!-- 正常内容：独立查询卡片 + 独立结果卡片 -->
    <template v-else>
      <section class="dss-card dss-query-card">
        <DataSourceSnapshotQueryBar
          :clients="candidateClients"
          :sources="candidateSources"
          :statuses="candidateStatuses"
          :busy="busy"
          :query-loading="queryLoading"
          @query="onQuery"
        />
      </section>

      <section class="dss-card dss-result-card">
        <div class="dss-result-card__header">
          <div class="dss-result-summary">
            <span class="dss-summary-count">共 {{ records.length }} 条</span>
            <span v-if="unknownCount > 0" class="dss-summary-unknown">其中 {{ unknownCount }} 条未知状态</span>
          </div>
          <DataSourceSnapshotToolbar
            :last-refresh-text="lastRefreshText"
            :countdown-seconds="autoRefreshRemainingSeconds"
            :countdown-progress="autoRefreshProgress"
            :manual-loading="manualLoading"
            :busy="busy"
            @refresh="onManualRefresh"
          />
        </div>

        <!-- 刷新失败提示稳定槽位：固定高度，出现/消失不推动刷新逻辑组关键元素（DSS-REQ-068，AC-072） -->
        <div class="dss-result-error-slot">
          <span v-if="refreshError" class="dss-result-error" role="status">{{ refreshError }}</span>
        </div>

        <div class="dss-result-card__divider"></div>

        <div class="dss-result-card__body">
          <!-- 整表 loading 仅 initial 首载在途（query 不遮罩表格，DSS-REQ-071③） -->
          <DataSourceSnapshotTable :records="records" :loading="initialLoading" empty-text="暂无数据" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import type { QueryDraft } from '@/types/dataSourceSnapshot'
import { useDataSourceSnapshot } from './composables/useDataSourceSnapshot'
import DataSourceSnapshotQueryBar from './components/DataSourceSnapshotQueryBar.vue'
import DataSourceSnapshotToolbar from './components/DataSourceSnapshotToolbar.vue'
import DataSourceSnapshotTable from './components/DataSourceSnapshotTable.vue'

const ctl = useDataSourceSnapshot()
const {
  records,
  candidateClients,
  candidateSources,
  candidateStatuses,
  initialLoading,
  retryLoading,
  queryLoading,
  manualLoading,
  autoRefreshRemainingSeconds,
  autoRefreshProgress,
  busy,
  firstLoadError,
  refreshError,
  lastRefreshText,
} = ctl

/** 当前成功结果中 statusCategory=UNKNOWN 的数量；>0 才显示“其中 N 条未知状态”（DSS-REQ-067，AC-070）。 */
const unknownCount = computed(() => records.value.filter((r) => r.statusCategory === 'UNKNOWN').length)

function onQuery(draft: QueryDraft): void {
  ctl.submitQuery(draft.clients, draft.sources, draft.statuses)
}

function onManualRefresh(): void {
  ctl.manualRefresh()
}

function onRetry(): void {
  ctl.retry()
}

function onVisibilityChange(): void {
  ctl.visibilityChanged(document.hidden)
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  ctl.onPageMounted(document.hidden)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  ctl.destroy()
})
</script>

<style scoped>
/* Linear / Notion 极简视觉隔离试验：仅本页面局部令牌与样式，不影响其它路由页面。
   命名空间保持 .dss-*；不覆写 :root 上的 --el-*，不改 global.css，不引入外部样式。 */
.dss-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* R7：本页直接承接外层白色内容区，不再叠加第二重页面级近白底色 */
  background: transparent;
  border-radius: 10px;
  padding: 14px 16px;
  /* 局部继承令牌（只在此画布子树生效） */
  --dss-surface: #ffffff;
  --dss-embedded: #f4f4f5;
  --dss-divider: #f0f0f1;
  --dss-border-soft: #e6e6e8;
  --dss-text: #09090b;
  --dss-text-secondary: #3f3f46;
  --dss-text-muted: #71717a;
  --dss-text-faint: #a1a1aa;
  --dss-primary: #09090b;
  --dss-accent: #2563eb;
  --dss-danger: #991b1b;
  --dss-warning: #b45309;
}
.dss-page-header {
  flex-shrink: 0;
}
.dss-title {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--dss-text, #09090b);
}
.dss-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--dss-text-muted, #71717a);
  line-height: 1.5;
}
/* 卡片底座：无硬边框、极弱阴影（Linear 面板）；查询筛选条在其上叠加嵌入式色块 */
.dss-card {
  background: var(--dss-surface, #ffffff);
  border: none;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(9, 9, 11, 0.04), 0 1px 3px rgba(9, 9, 11, 0.03);
}
.dss-query-card {
  background: var(--dss-embedded, #f4f4f5);
  border-radius: 8px;
  box-shadow: none;
  padding: 10px 16px;
}
.dss-result-card {
  display: flex;
  flex-direction: column;
}
.dss-result-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  flex-wrap: wrap;
  padding: 12px 16px 2px;
}
.dss-result-summary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
/* '共 N 条'（R5 §3 放大）：16px/700/#09090B，头部主层级；不设行高，避免推动头部整行高度 */
.dss-summary-count {
  font-size: 16px;
  font-weight: 700;
  color: var(--dss-text, #09090b);
  font-variant-numeric: tabular-nums;
}
/* '其中 N 条未知状态'＝小号暖黄胶囊（R5 §3）：12px/700，line-height 22px 使胶囊总高≈22px，
   在字号与字重上都明显低于 16px 主计数，保持"共 N 条 > 未知状态胶囊"的层级；两段经 flex align-items:center 垂直居中 */
.dss-summary-unknown {
  display: inline-block;
  background: #fef3c7;
  color: var(--dss-warning, #b45309);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  padding: 0 8px;
  white-space: nowrap;
}
/* 稳定槽位：恒占固定高度一行，失败提示出现/消失不改变上方刷新组与下方表格的几何 */
.dss-result-error-slot {
  min-height: 22px;
  padding: 0 16px;
  display: flex;
  align-items: center;
}
.dss-result-error {
  font-size: 13px;
  color: var(--dss-danger, #991b1b);
  white-space: nowrap;
}
.dss-result-card__divider {
  height: 1px;
  background: var(--dss-divider, #f0f0f1);
  margin: 0 16px;
}
.dss-result-card__body {
  padding: 10px 16px 14px;
  min-width: 0;
}
/* 首次失败错误态 */
.dss-error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
}
.dss-error-icon {
  font-size: 26px;
  color: var(--dss-danger, #991b1b);
}
.dss-error-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--dss-text, #09090b);
}
.dss-error-desc {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--dss-text-muted, #71717a);
}
</style>
