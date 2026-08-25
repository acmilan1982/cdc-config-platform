<template>
  <div class="log-query-page">
    <!-- 状态检测中（LQ-UI-006） -->
    <div v-if="statusLoading" class="status-state" role="status">
      <el-icon class="is-loading" :size="26"><Loading /></el-icon>
      <p class="state-title">状态检测中</p>
    </div>

    <!-- 状态检测失败（LQ-UI-009 / LQ-AC-178）：固定文案，无"重新检测"按钮，不自动重试 -->
    <div v-else-if="statusError" class="status-state" role="alert">
      <el-icon class="state-icon"><WarningFilled /></el-icon>
      <p class="state-title">功能状态获取失败</p>
      <p class="state-desc">暂时无法获取日志查询功能状态，请刷新页面或稍后重新进入。</p>
    </div>

    <!-- 功能未开放（LQ-UI-019 / LQ-AC-176）：不初始化两 Tab，不调用原四接口 -->
    <div v-else-if="!enabled" class="status-state">
      <el-icon class="state-icon"><Lock /></el-icon>
      <p class="state-title">日志查询功能暂未开放</p>
      <p class="state-desc">当前环境尚未启用日志查询功能。如需使用，请联系系统管理员。</p>
    </div>

    <!-- 正常页面（enabled=true） -->
    <template v-else>
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
          :initializing="initializing"
          @query="onQuery('error')"
          @reset="onReset('error')"
          @retry-options="loadOptions"
        />
        <LogQueryTable
          :log-type="'error'"
          :items="errorTab.items"
          :loading="errorTab.loading"
          :error="errorTab.error"
          :elapsed="errorTab.elapsed"
          :query-status="errorQueryStatus"
          @detail="(row) => openDetail('error', row)"
          @raw="(row) => openRaw('error', row)"
        />
        <CursorPagination
          :loading="errorTab.loading"
          :has-prev="errorTab.requestCursorStack.length > 1"
          :has-next="errorTab.hasNext"
          @prev="onPrev('error')"
          @next="onNext('error')"
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
          :initializing="initializing"
          @query="onQuery('correct')"
          @reset="onReset('correct')"
          @retry-options="loadOptions"
        />
        <LogQueryTable
          :log-type="'correct'"
          :items="correctTab.items"
          :loading="correctTab.loading"
          :error="correctTab.error"
          :elapsed="correctTab.elapsed"
          :query-status="correctQueryStatus"
          @detail="(row) => openDetail('correct', row)"
          @raw="(row) => openRaw('correct', row)"
        />
        <CursorPagination
          :loading="correctTab.loading"
          :has-prev="correctTab.requestCursorStack.length > 1"
          :has-next="correctTab.hasNext"
          @prev="onPrev('correct')"
          @next="onNext('correct')"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Loading, Lock, WarningFilled } from '@element-plus/icons-vue'
import { useLogQueryTab, deriveTabQueryStatus } from './composables/useLogQueryTab'
import type { LogQueryTabState } from './composables/useLogQueryTab'
import type { DataSourceOptionVO, LogListVO, LogType } from '@/types/logQuery'
import { fetchDataSourceOptions, getLogQueryStatus } from '@/api/logQuery'
import { onLogQueryReinit } from './reinitBus'
import LogQueryFilter from './components/LogQueryFilter.vue'
import LogQueryTable from './components/LogQueryTable.vue'
import CursorPagination from './components/CursorPagination.vue'
import LogDetailDialog from './components/LogDetailDialog.vue'
import RawMessageDialog from './components/RawMessageDialog.vue'

/**
 * 页面代次：重新进入（组件重挂载或再次点击当前菜单）时递增，
 * 配合每 Tab 请求令牌丢弃旧响应（LQ-UI-145 / 217 / LQ-AC-181）。
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

const errorQueryStatus = computed(() => deriveTabQueryStatus(errorTab))
const correctQueryStatus = computed(() => deriveTabQueryStatus(correctTab))

// ---- 页面级功能开放状态（LQ-UI-219） ----
const statusLoading = ref(true)
const statusError = ref(false)
const enabled = ref(false)
let statusToken = 0

const sourceList = ref<DataSourceOptionVO[]>([])
const targetList = ref<DataSourceOptionVO[]>([])
const optionsLoading = ref(false)
const optionsError = ref('')

/**
 * 初始化锁定（R1.1）：enabled=true 到默认错误日志查询结束期间为 true。
 * 期间禁止一切会改变查询状态的用户操作（编辑条件、查询、重置、切换 Tab、翻页、打开弹窗），
 * 避免"用户主动查询先返回、初始化默认查询后返回并覆盖用户结果"的竞争。
 * 默认查询成功/业务失败/网络失败/超时后均解除锁定；只有当前页面代次可以结束锁定。
 */
const initializing = ref(false)

/** 状态接口请求也纳入页面代次/令牌失效管理，重新进入时旧状态响应不得覆盖新状态（LQ-UI-219） */
async function loadStatus() {
  const token = ++statusToken
  statusLoading.value = true
  statusError.value = false
  try {
    const res = await getLogQueryStatus()
    if (token !== statusToken) return
    if (res.code === 200) {
      enabled.value = res.data.enabled
      if (enabled.value) {
        void initNormal()
      }
    } else {
      statusError.value = true
    }
  } catch {
    if (token !== statusToken) return
    statusError.value = true
  } finally {
    if (token === statusToken) statusLoading.value = false
  }
}

/**
 * enabled=true 后初始化顺序（LQ-AC-177 / LQ-DESIGN-177 / R1-03 / R1.1）：
 * 重置两 Tab → 进入初始化锁定 → 按顺序等待本次页面代次的数据源候选加载结束 →
 * 若页面代次仍有效且仍为 enabled=true，再 await 错误日志默认首查（真正等待其结束）→
 * 默认查询成功/失败/超时后由当前代次 finally 解除锁定。
 * 候选加载失败只影响下拉框（显示候选失败状态），不阻止列表默认查询；
 * 重新进入导致代次变化时，旧初始化链不再触发默认查询、旧 finally 不解锁新代次；
 * 不自动重试/轮询。
 */
async function initNormal() {
  const generation = getGeneration()
  activeTab.value = 'error'
  errorTab.reinitialize()
  correctTab.reinitialize()
  initializing.value = true
  try {
    await loadOptions()
    if (generation !== getGeneration() || !enabled.value) return
    await errorTab.initialQuery()
  } finally {
    // 只有当前有效代次可以结束初始化锁定；旧链 finally 不得误解锁新代次（R1.1 §6.3）
    if (generation === getGeneration()) {
      initializing.value = false
    }
  }
}

/** 初始化锁定期间禁止查询/重置/翻页，避免与初始化默认查询竞争（R1.1） */
function onQuery(logType: LogType) {
  if (initializing.value) return
  const tab = logType === 'error' ? errorTab : correctTab
  void tab.query()
}

function onReset(logType: LogType) {
  if (initializing.value) return
  const tab = logType === 'error' ? errorTab : correctTab
  tab.reset()
}

function onPrev(logType: LogType) {
  if (initializing.value) return
  const tab = logType === 'error' ? errorTab : correctTab
  void tab.prevPage()
}

function onNext(logType: LogType) {
  if (initializing.value) return
  const tab = logType === 'error' ? errorTab : correctTab
  void tab.nextPage()
}

async function loadOptions() {
  if (optionsLoading.value) return
  const generation = getGeneration()
  optionsLoading.value = true
  optionsError.value = ''
  try {
    const res = await fetchDataSourceOptions()
    if (generation !== getGeneration()) return
    if (res.code === 200) {
      sourceList.value = res.data.sourceList ?? []
      targetList.value = res.data.targetList ?? []
    } else {
      optionsError.value = res.message || '数据源候选加载失败'
    }
  } catch {
    if (generation !== getGeneration()) return
    optionsError.value = '数据源候选加载失败'
  } finally {
    if (generation === getGeneration()) optionsLoading.value = false
  }
}

/**
 * 切换 Tab（本任务修订）：只切换活动 Tab，不再触发首次自动查询。
 * 错误日志默认首查仍由初始化链（initNormal → errorTab.initialQuery）负责；
 * 正确日志首次切换只展示已初始化的缺省条件，保持 NOT_QUERIED，等待用户点击"查询"。
 */
function onTabSwitch(key: LogType) {
  if (initializing.value) return
  activeTab.value = key
}

const detailTarget = ref<{ logType: LogType; row: LogListVO } | null>(null)
const detailVisible = ref(false)
function openDetail(logType: LogType, row: LogListVO) {
  if (initializing.value) return
  detailTarget.value = { logType, row }
  detailVisible.value = true
}

const rawTarget = ref<{ logType: LogType; row: LogListVO } | null>(null)
const rawVisible = ref(false)
function openRaw(logType: LogType, row: LogListVO) {
  if (initializing.value) return
  rawTarget.value = { logType, row }
  rawVisible.value = true
}

/**
 * 完整重新初始化（LQ-AC-181）：作废两 Tab 与状态接口在途请求、关闭并清理弹窗、
 * 清空两 Tab 全部状态、恢复默认错误日志 Tab，再重新调用状态接口。
 */
function fullReinit() {
  pageGeneration += 1
  statusToken += 1
  errorTab.reinitialize()
  correctTab.reinitialize()
  activeTab.value = 'error'
  detailVisible.value = false
  rawVisible.value = false
  detailTarget.value = null
  rawTarget.value = null
  sourceList.value = []
  targetList.value = []
  optionsError.value = ''
  optionsLoading.value = false
  initializing.value = false
  void loadStatus()
}

let stopReinit: (() => void) | null = null

onMounted(() => {
  pageGeneration += 1
  stopReinit = onLogQueryReinit(fullReinit)
  void loadStatus()
})

onUnmounted(() => {
  pageGeneration += 1
  if (stopReinit) stopReinit()
})
</script>

<style scoped>
.log-query-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 0;
}

.status-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #909399;
}

.state-icon {
  font-size: 24px;
  color: #909399;
}

.state-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.state-desc {
  margin: 0;
  font-size: 13px;
  color: #606266;
  max-width: 420px;
  text-align: center;
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
