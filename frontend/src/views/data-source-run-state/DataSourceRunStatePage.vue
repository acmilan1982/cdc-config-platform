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
            :refresh-active="refreshActive"
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
  refreshActive,
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
.dss-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dss-page-header {
  flex-shrink: 0;
}
.dss-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.dss-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}
/* 与 app-shell / Element Plus 浅色企业后台一致的独立白色卡片（DSS-REQ-066②③，AC-069） */
.dss-card {
  background: #ffffff;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: var(--el-border-radius-base, 4px);
  box-shadow: var(--el-box-shadow-light, 0 2px 12px 0 rgba(0, 0, 0, 0.05));
}
.dss-query-card {
  padding: 14px 16px;
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
  padding: 12px 16px 4px;
}
.dss-result-summary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dss-summary-count {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  font-variant-numeric: tabular-nums;
}
.dss-summary-unknown {
  font-size: 13px;
  color: #e6a23c;
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
  color: #d92d20;
  white-space: nowrap;
}
.dss-result-card__divider {
  height: 1px;
  background: var(--el-border-color-lighter, #ebeef5);
  margin: 0 16px;
}
.dss-result-card__body {
  padding: 12px 16px 16px;
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
  color: var(--el-color-danger, #f56c6c);
}
.dss-error-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.dss-error-desc {
  margin: 0 0 4px;
  font-size: 13px;
  color: #909399;
}
</style>
