<template>
  <div class="toff-page">
    <!-- 页面标题 + Kafka 提示（UI §2，TOFF-REQ-067） -->
    <header class="toff-header">
      <h2 class="toff-title">数据同步进度</h2>
      <div class="toff-kafka-notice" role="note">
        <el-icon class="toff-kafka-icon"><InfoFilled /></el-icon>
        <span class="toff-kafka-text">Kafka 实时数据尚未接入。Kafka 末端位置、待消费数量和消费延迟暂不计算。</span>
      </div>
    </header>

    <!-- 首次加载失败且从未成功：整区错误态 + 重新加载（TOFF-REQ-115） -->
    <div v-if="firstLoadError" class="toff-state" role="alert">
      <el-icon class="toff-state-icon toff-state-icon--error"><WarningFilled /></el-icon>
      <p class="toff-state-title">数据加载失败</p>
      <p class="toff-state-desc">暂时无法获取同步进度数据，请重新加载或稍后重试。</p>
      <el-button size="small" type="primary" plain :loading="loading" @click="onRetry">重新加载</el-button>
    </div>

    <!-- 正常内容区 -->
    <template v-else>
      <OffsetQueryBar
        :clients="clients"
        :sources="sources"
        :targets="targets"
        :initial="store.appliedCriteria"
        @query="onQuery"
      />

      <OffsetToolbar
        :total="store.total"
        :unparseable-total="store.unparseableTotal"
        :refreshing="refreshing"
        :busy="requesting"
        :last-refresh-text="store.lastRefreshText"
        :refresh-error="refreshError"
        @refresh="onManualRefresh"
      />

      <OffsetTable
        :records="store.records"
        :loading="requesting"
        :start-index="startIndex"
        empty-text="暂无符合条件的数据"
      />

      <!-- 分页：固定 150/页，无规格选择器；查询回第 1 页、刷新保持当前页（UI §7） -->
      <div v-if="store.pages > 0" class="toff-pagination">
        <span class="toff-page-text">
          共 {{ store.total }} 条 · 第 {{ store.pageNum }} / 共 {{ store.pages }} 页（每页 {{ store.pageSize }} 条）
        </span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="store.total"
          :page-size="store.pageSize"
          :current-page="store.pageNum"
          @current-change="onPageChange"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, WarningFilled } from '@element-plus/icons-vue'
import { useTopicOffsetStore } from '@/stores/topicOffset'
import type { QueryDraft } from '@/types/topicOffset'
import { useTopicOffset } from './composables/useTopicOffset'
import OffsetQueryBar from './components/OffsetQueryBar.vue'
import OffsetToolbar from './components/OffsetToolbar.vue'
import OffsetTable from './components/OffsetTable.vue'

const store = useTopicOffsetStore()

/** 手工动作失败用一次轻提示（自动刷新失败仅工具栏内联弱提示，不弹堆叠，TOFF-REQ-113）。 */
function notify(message: string): void {
  ElMessage.warning(message)
}

const ctl = useTopicOffset(notify)
const { loading, refreshing, refreshError, firstLoadError } = ctl

/** 任一请求进行中即禁用“立即刷新”，保证请求不重叠（TOFF-REQ-109）。 */
const requesting = computed(() => loading.value || refreshing.value)

const candidates = computed(() => store.candidates)
const clients = computed(() => candidates.value?.clients ?? [])
const sources = computed(() => candidates.value?.sources ?? [])
const targets = computed(() => candidates.value?.targets ?? [])

/** 跨页连续序号（UI §5：`(page-1)×150 + 行内行号`，TOFF-REQ-082）。 */
const startIndex = computed(() => (store.pageNum - 1) * store.pageSize + 1)

function onQuery(draft: QueryDraft): void {
  ctl.submitQuery(draft.clients, draft.sources, draft.targets, draft.tableName)
}

function onPageChange(page: number): void {
  ctl.changePage(page)
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
  ctl.onPageMounted()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  ctl.destroy()
})
</script>

<style scoped>
.toff-page {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toff-header {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.toff-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.toff-kafka-notice {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: var(--app-card-radius, 8px);
  background-color: #ecf5ff;
  line-height: 1.5;
}

.toff-kafka-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--el-color-info, #909399);
  font-size: 14px;
}

.toff-kafka-text {
  font-size: 13px;
  color: #606266;
}

.toff-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 0;
}

.toff-state-icon {
  font-size: 26px;
}

.toff-state-icon--error {
  color: var(--el-color-danger, #f56c6c);
}

.toff-state-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.toff-state-desc {
  margin: 0 0 4px;
  font-size: 13px;
  color: #909399;
}

.toff-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.toff-page-text {
  font-size: 13px;
  color: #606266;
}
</style>
