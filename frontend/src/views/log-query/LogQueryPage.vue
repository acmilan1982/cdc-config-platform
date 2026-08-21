<template>
  <div class="log-query-page">
    <header class="page-header">
      <h2 class="page-title">日志查询</h2>
      <p class="page-desc">只读检索同步日志，错误日志 / 正确日志双 Tab 查看，按固定排序游标分页。</p>
    </header>

    <div class="tab-bar" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        role="tab"
        :aria-selected="activeTab === tab.key"
        @click="onTabSwitch(tab.key)"
      >
        <span>{{ tab.label }}</span>
        <el-icon v-if="tab.state.loading" class="is-loading tab-loading"><Loading /></el-icon>
      </button>
    </div>

    <section v-show="activeTab === 'error'" class="tab-panel">
      <LogQueryFilter
        :form="errorTab.form"
        :validation-error="errorTab.validationError"
        :loading="errorTab.loading"
        :source-options="sourceList"
        :target-options="targetList"
        :options-error="optionsError"
        :options-loading="optionsLoading"
        @query="errorTab.query"
        @reset="errorTab.reset"
        @retry-options="loadOptions"
      />
      <LogQueryTable
        :log-type="'error'"
        :items="errorTab.items"
        :loading="errorTab.loading"
        :error="errorTab.error"
        :elapsed="errorTab.elapsed"
        :applied="errorTab.applied"
        @detail="(row) => openDetail('error', row)"
        @raw="(row) => openRaw('error', row)"
      />
      <CursorPagination
        :loading="errorTab.loading"
        :has-prev="errorTab.requestCursorStack.length > 1"
        :has-next="errorTab.hasNext"
        @prev="errorTab.prevPage"
        @next="errorTab.nextPage"
      />
    </section>

    <section v-show="activeTab === 'correct'" class="tab-panel">
      <LogQueryFilter
        :form="correctTab.form"
        :validation-error="correctTab.validationError"
        :loading="correctTab.loading"
        :source-options="sourceList"
        :target-options="targetList"
        :options-error="optionsError"
        :options-loading="optionsLoading"
        @query="correctTab.query"
        @reset="correctTab.reset"
        @retry-options="loadOptions"
      />
      <LogQueryTable
        :log-type="'correct'"
        :items="correctTab.items"
        :loading="correctTab.loading"
        :error="correctTab.error"
        :elapsed="correctTab.elapsed"
        :applied="correctTab.applied"
        @detail="(row) => openDetail('correct', row)"
        @raw="(row) => openRaw('correct', row)"
      />
      <CursorPagination
        :loading="correctTab.loading"
        :has-prev="correctTab.requestCursorStack.length > 1"
        :has-next="correctTab.hasNext"
        @prev="correctTab.prevPage"
        @next="correctTab.nextPage"
      />
    </section>

    <LogDetailDialog
      v-model:visible="detailVisible"
      :log-type="detailTarget?.logType ?? null"
      :row="detailTarget?.row ?? null"
    />
    <RawMessageDialog
      v-model:visible="rawVisible"
      :log-type="rawTarget?.logType ?? null"
      :row="rawTarget?.row ?? null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useLogQueryTab } from './composables/useLogQueryTab'
import type { LogQueryTabState } from './composables/useLogQueryTab'
import type { DataSourceOptionVO, LogListVO, LogType } from '@/types/logQuery'
import { fetchDataSourceOptions } from '@/api/logQuery'
import LogQueryFilter from './components/LogQueryFilter.vue'
import LogQueryTable from './components/LogQueryTable.vue'
import CursorPagination from './components/CursorPagination.vue'
import LogDetailDialog from './components/LogDetailDialog.vue'
import RawMessageDialog from './components/RawMessageDialog.vue'

/**
 * 页面代次：重新进入（组件重挂载）时递增，配合每 Tab 请求令牌丢弃旧响应（LQ-UI-145 / 217）。
 */
let pageGeneration = 0
const getGeneration = () => pageGeneration

const errorTab = useLogQueryTab('error', getGeneration)
const correctTab = useLogQueryTab('correct', getGeneration)

const tabs: { key: LogType; label: string; state: LogQueryTabState }[] = [
  { key: 'error', label: '错误日志', state: errorTab },
  { key: 'correct', label: '正确日志', state: correctTab },
]

const activeTab = ref<LogType>('error')

const sourceList = ref<DataSourceOptionVO[]>([])
const targetList = ref<DataSourceOptionVO[]>([])
const optionsLoading = ref(false)
const optionsError = ref('')

async function loadOptions() {
  if (optionsLoading.value) return
  optionsLoading.value = true
  optionsError.value = ''
  try {
    const res = await fetchDataSourceOptions()
    if (res.code === 200) {
      sourceList.value = res.data.sourceList ?? []
      targetList.value = res.data.targetList ?? []
    } else {
      optionsError.value = res.message || '数据源候选加载失败'
    }
  } catch {
    optionsError.value = '数据源候选加载失败'
  } finally {
    optionsLoading.value = false
  }
}

function onTabSwitch(key: LogType) {
  activeTab.value = key
  const tab = key === 'error' ? errorTab : correctTab
  if (!tab.initialQueryAttempted) {
    void tab.initialQuery()
  }
}

const detailTarget = ref<{ logType: LogType; row: LogListVO } | null>(null)
const detailVisible = ref(false)
function openDetail(logType: LogType, row: LogListVO) {
  detailTarget.value = { logType, row }
  detailVisible.value = true
}

const rawTarget = ref<{ logType: LogType; row: LogListVO } | null>(null)
const rawVisible = ref(false)
function openRaw(logType: LogType, row: LogListVO) {
  rawTarget.value = { logType, row }
  rawVisible.value = true
}

onMounted(() => {
  pageGeneration += 1
  errorTab.initialize()
  correctTab.initialize()
  void loadOptions()
  void errorTab.initialQuery()
})

onUnmounted(() => {
  pageGeneration += 1
})
</script>

<style scoped>
.log-query-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 0;
}

.page-header {
  flex-shrink: 0;
  padding-bottom: 10px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.tab-bar {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.tab-item {
  position: relative;
  border: none;
  background: none;
  font: inherit;
  padding: 9px 16px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tab-item:hover {
  color: #409eff;
}

.tab-item.active {
  color: #409eff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  background: #409eff;
  border-radius: 2px;
}

.tab-item:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: -2px;
}

.tab-loading {
  font-size: 14px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding-top: 12px;
}
</style>
