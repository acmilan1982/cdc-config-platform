<template>
  <!-- 页面外壳、查询区容器、结果区容器与 Tooltip Host 全部来自公共层（SHARED_COMPONENT_DESIGN §7.3.2/§9.1）：
       页面只拥有 Feature 文案、Feature 业务内容与唯一 Tooltip 控制器；默认槽内容逐一成为 .ql-page 直接子节点，
       不新增任何包装层。 -->
  <QueryListPageShell
    class="dss-scope"
    title="源库快照状态"
    description="展示各探针端与源库组合的初始快照阶段状态；页面只读。"
  >
    <!-- 首次加载失败且从未成功：错误态 + 重新加载（仅 retry 在途按钮 loading，UI §7.2，AC-056） -->
    <section v-if="firstLoadError" class="dss-card dss-error-card" role="alert">
      <el-icon class="dss-error-icon"><WarningFilled /></el-icon>
      <p class="dss-error-title">数据加载失败</p>
      <p class="dss-error-desc">暂时无法获取快照状态数据，请重新加载或稍后自动重试。</p>
      <el-button type="primary" plain :loading="retryLoading" @click="onRetry">重新加载</el-button>
    </section>

    <!-- 正常内容：公共查询面板（查询栏组件根节点）+ 公共结果面板 -->
    <template v-else>
      <DataSourceSnapshotQueryBar
        :clients="candidateClients"
        :sources="candidateSources"
        :statuses="candidateStatuses"
        :busy="busy"
        :query-loading="queryLoading"
        :show-tooltip="tooltip.show"
        :hide-tooltip="tooltip.hide"
        @query="onQuery"
      />

      <QueryListResultPanel>
        <template #summary>
          <div class="dss-result-summary">
            <span class="dss-summary-count">共 {{ records.length }} 条</span>
            <span v-if="unknownCount > 0" class="dss-summary-unknown">其中 {{ unknownCount }} 条未知状态</span>
          </div>
        </template>
        <template #toolbar>
          <!-- 指示器内缩 3px 为本页既有事实值（§7.5.5）：公共默认 2px 供查询/重置按钮使用，
               刷新按钮只在本页通过组件根令牌覆盖，不新增 DOM 与类名。 -->
          <QueryListRefreshToolbar
            :countdown="countdown"
            :last-refresh-text="lastRefreshText"
            :manual-loading="manualLoading"
            :busy="busy"
            :style="{ '--ql-btn-spinner-inset': '3px' }"
            @refresh="onManualRefresh"
          />
        </template>
        <!-- 刷新失败提示稳定槽位：槽位高度由公共结果面板保留，出现/消失不推动刷新逻辑组关键元素（DSS-REQ-068，AC-072） -->
        <template #error>
          <span v-if="refreshError" class="dss-result-error" role="status">{{ refreshError }}</span>
        </template>
        <template #body>
          <!-- 整表 loading 仅 initial 首载在途（query 不遮罩表格，DSS-REQ-071③） -->
          <DataSourceSnapshotTable
            :records="records"
            :loading="initialLoading"
            empty-text="暂无数据"
            :show-tooltip="tooltip.show"
            :hide-tooltip="tooltip.hide"
          />
        </template>
      </QueryListResultPanel>
    </template>

    <!-- 页面唯一 Tooltip Host：id 直接使用控制器生成的 hostId，查询栏与表格共用同一控制器，任意时刻至多 1 个 -->
    <QueryListTooltipHost :id="tooltip.hostId" :target="tooltipCurrent" />
  </QueryListPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import type { QueryDraft } from '@/types/dataSourceSnapshot'
import {
  QueryListPageShell,
  QueryListRefreshToolbar,
  QueryListResultPanel,
  QueryListTooltipHost,
  useQueryListTooltip,
} from '@/components/query-list'
import type { QueryListCountdown } from '@/components/query-list'
import { useDataSourceSnapshot } from './composables/useDataSourceSnapshot'
import DataSourceSnapshotQueryBar from './components/DataSourceSnapshotQueryBar.vue'
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

/** 本页使用自动刷新，故倒计时投影恒为对象；无已安排周期时以 `{ seconds: null, progress: null }` 表达（§7.4.5）。 */
const countdown = computed<QueryListCountdown>(() => ({
  seconds: autoRefreshRemainingSeconds.value,
  progress: autoRefreshProgress.value,
}))

/** 页面唯一 Tooltip 控制器（§7.6.1）：查询栏与表格共用同一实例，同一时刻至多 1 个 Tooltip。 */
const tooltip = useQueryListTooltip()
// 模板中嵌套 ref 不解包：取出顶层 ref 使 Host 的 :target 收到真实状态（而非 Ref 本体）。
const tooltipCurrent = tooltip.current

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

let unbindGlobalClose: (() => void) | null = null

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  // 页面级关闭事件由唯一控制器统一绑定：滚动/resize/页面隐藏时关闭，避免残留。
  unbindGlobalClose = tooltip.bindGlobalClose()
  ctl.onPageMounted(document.hidden)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (unbindGlobalClose) unbindGlobalClose()
  tooltip.destroy()
  ctl.destroy()
})
</script>

<style scoped>
/* Linear / Notion 极简视觉隔离试验：仅本页面局部令牌与样式，不影响其它路由页面。
   命名空间保持 .dss-*；不覆写 :root 上的 --el-*，不改 global.css，不引入外部样式。
   页面外壳 / 查询区容器 / 结果区容器 / 刷新逻辑组 / Tooltip Host 的样式已移入公共层
   （.ql-page / .ql-q-panel / .ql-result-panel / .ql-refresh-group / .ql-tooltip），本文件不再重复声明；
   仅保留仍被本页 Feature 内容引用的局部令牌与 Feature 专属样式。 */
.dss-scope {
  /* 局部继承令牌（只在此画布子树生效；只声明仍被引用的项） */
  --dss-surface: #ffffff;
  --dss-text: #09090b;
  --dss-text-secondary: #3f3f46;
  --dss-text-muted: #71717a;
  --dss-danger: #991b1b;
  --dss-warning: #b45309;
}
/* 首次失败错误卡片底座：无硬边框、极弱阴影（Linear 面板） */
.dss-card {
  background: var(--dss-surface, #ffffff);
  border: none;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(9, 9, 11, 0.04), 0 1px 3px rgba(9, 9, 11, 0.03);
}
/* 结果摘要左侧两段：本页 Feature 内容，保留 10px 段间距（公共摘要容器只负责居中与溢出） */
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
.dss-result-error {
  font-size: 13px;
  color: var(--dss-danger, #991b1b);
  white-space: nowrap;
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
