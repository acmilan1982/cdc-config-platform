<template>
  <div class="dss-page">
    <!-- 标题行：页面标题 + 简短只读定位说明（UI §2） -->
    <header class="dss-header">
      <h2 class="dss-title">源库快照状态</h2>
      <p class="dss-desc">展示各探针端与源库组合的初始快照阶段状态；页面只读。</p>
    </header>

    <!-- 首次加载失败且从未成功：整区错误态 + 重新加载（UI §7.2，DSS-REQ-059，AC-056） -->
    <div v-if="firstLoadError" class="dss-state" role="alert">
      <el-icon class="dss-state-icon dss-state-icon--error"><WarningFilled /></el-icon>
      <p class="dss-state-title">数据加载失败</p>
      <p class="dss-state-desc">暂时无法获取快照状态数据，请重新加载或稍后自动重试。</p>
      <el-button type="primary" plain :loading="loading" @click="onRetry">重新加载</el-button>
    </div>

    <!-- 正常内容区 -->
    <template v-else>
      <DataSourceSnapshotQueryBar
        :clients="candidateClients"
        :sources="candidateSources"
        :statuses="candidateStatuses"
        :busy="busy"
        @query="onQuery"
      />

      <DataSourceSnapshotToolbar
        :last-refresh-text="lastRefreshText"
        :refreshing="refreshing"
        :busy="busy"
        :refresh-error="refreshError"
        @refresh="onManualRefresh"
      />

      <!-- 表格只接“大态”loading（首次/条件查询在途）；轻量刷新不清表、不遮罩（DESIGN §7.6） -->
      <DataSourceSnapshotTable :records="records" :loading="loading" empty-text="暂无数据" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
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
  loading,
  refreshing,
  busy,
  firstLoadError,
  refreshError,
  lastRefreshText,
} = ctl

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
  gap: 4px;
}
.dss-header {
  flex-shrink: 0;
  margin-bottom: 8px;
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
.dss-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 0;
}
.dss-state-icon {
  font-size: 26px;
}
.dss-state-icon--error {
  color: var(--el-color-danger, #f56c6c);
}
.dss-state-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.dss-state-desc {
  margin: 0 0 4px;
  font-size: 13px;
  color: #909399;
}
</style>
