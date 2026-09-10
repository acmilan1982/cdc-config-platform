<template>
  <div class="dss-table-wrap">
    <el-table
      :data="records"
      v-loading="loading"
      class="dss-table"
      :empty-text="emptyText"
      :row-key="rowKey"
      :row-class-name="rowClassName"
    >
      <el-table-column label="序号" width="70" align="center">
        <template #default="{ $index }">
          <span class="dss-seq">{{ $index + 1 }}</span>
        </template>
      </el-table-column>

      <!-- 探针端列（弹性列，min-width:170，R5）：始终显示原始 CLIENT_ID（600 字重）；非启用(FG_ACTIVE≠'1')在 ID 后追加浅红微型"停用"Badge；完整非空 CLIENT_DESC 走页面级单实例 Tooltip -->
      <el-table-column label="探针端" min-width="170" align="left">
        <template #default="{ row }">
          <div class="dss-cell">
            <span
              class="dss-cell-main dss-probe-main dss-tt dss-mono"
              :data-tt-kind="`client-desc-${rowKey(row)}`"
              @mouseenter="onProbeMainEnter(row, $event)"
              @mouseleave="tooltip.hide()"
            >{{ row.clientId }}</span>
            <span v-if="isProbeInactive(row)" class="dss-inactive-mark">停用</span>
          </div>
        </template>
      </el-table-column>

      <!-- 源库列（弹性列，min-width:285，R5；始终明显宽于探针端）：正常 ORG 非空只显示 ORG；ORG 空/配置缺失回退原始 DATA_SOURCE_ID；Tooltip 恒为完整原始 DATA_SOURCE_ID -->
      <el-table-column label="源库" min-width="285" align="left">
        <template #default="{ row }">
          <div class="dss-cell">
            <span
              class="dss-cell-main dss-tt"
              :data-tt-kind="`source-main-${rowKey(row)}`"
              @mouseenter="onSourceMainEnter(row, $event)"
              @mouseleave="tooltip.hide()"
            >{{ sourceMainText(row) }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="快照状态" width="140" align="center">
        <template #default="{ row }">
          <span
            class="dss-tt dss-status-trigger"
            :data-tt-kind="`status-${rowKey(row)}`"
            @mouseenter="onStatusEnter(row, $event)"
            @mouseleave="tooltip.hide()"
          >
            <DataSourceSnapshotStatusTag :status-category="row.statusCategory" />
          </span>
        </template>
      </el-table-column>

      <!-- 三时间列（弹性列，min-width:170，R5）：与探针端/源库同为 min-width 弹性列；三列等宽并在宽屏吸收富余，但不无限吞掉空间（探针端/源库亦同步拉宽） -->
      <el-table-column label="快照启动时间" min-width="170" align="left">
        <template #default="{ row }">
          <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.snapshotLastSeenAt) }">
            {{ formatTime(row.snapshotLastSeenAt) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="快照完成时间" min-width="170" align="left">
        <template #default="{ row }">
          <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.snapshotCompletedAt) }">
            {{ formatTime(row.snapshotCompletedAt) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="记录更新时间" min-width="170" align="left">
        <template #default="{ row }">
          <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.updatedAt) }">
            {{ formatTime(row.updatedAt) }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 页面级单实例 Tooltip Host：页面唯一表格 → 任意时刻最多 1 个 Tooltip -->
    <SnapshotTooltipHost :target="ttCurrent" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import type { SnapshotStatusItem } from '@/types/dataSourceSnapshot'
import { rowKey } from '@/views/data-source-run-state/utils/rowKey'
import { formatTimeOrDash } from '@/views/data-source-run-state/utils/format'
import DataSourceSnapshotStatusTag from './DataSourceSnapshotStatusTag.vue'
import SnapshotTooltipHost from '../tooltip/SnapshotTooltipHost.vue'
import { useSnapshotTooltip } from '../tooltip/useSnapshotTooltip'
import type { ShowTooltipOptions } from '../tooltip/useSnapshotTooltip'

const props = withDefaults(
  defineProps<{
    records: SnapshotStatusItem[]
    /** 整表 loading：仅 initial 首载在途（DSS-REQ-071①，query 不遮罩表格）。 */
    loading: boolean
    emptyText?: string
  }>(),
  { emptyText: '暂无数据' },
)

const tooltip = useSnapshotTooltip()
// 顶层 ref 绑定在模板自动解包：将 tooltip.current 解出为顶层 ref，Host :target 才收到真实状态（而非 Ref 本体）
const ttCurrent = tooltip.current

/** 仅 statusCategory=UNKNOWN 的行追加浅黄整行背景（纯视觉试验类，DSS-AC-070；不改变行数据与任何事件）。 */
function rowClassName({ row }: { row: SnapshotStatusItem; rowIndex: number }): string {
  return row.statusCategory === 'UNKNOWN' ? 'dss-warning-row' : ''
}

function formatTime(value: string | null): string {
  return formatTimeOrDash(value)
}

function isDash(value: string | null): boolean {
  return value === null || value === undefined || value === ''
}

/** 探针端非启用（FG_ACTIVE≠'1'）时在 CLIENT_ID 后追加红字"停用"（DSS-REQ-073，AC-082）。 */
function isProbeInactive(row: SnapshotStatusItem): boolean {
  return row.clientRef.state === 'INACTIVE'
}

function clientDescText(row: SnapshotStatusItem): string {
  const desc = row.clientRef.desc
  return desc === null || desc === undefined ? '' : desc.trim()
}

function sourceOrgText(row: SnapshotStatusItem): string {
  const org = row.sourceRef.org
  return org === null || org === undefined ? '' : org.trim()
}

function sourceShowsOrg(row: SnapshotStatusItem): boolean {
  return sourceOrgText(row).length > 0
}

function sourceMainText(row: SnapshotStatusItem): string {
  return sourceShowsOrg(row) ? sourceOrgText(row) : row.sourceId
}

function openTooltip(opts: ShowTooltipOptions): void {
  tooltip.show(opts)
}

function onProbeMainEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({ key: `client-${rowKey(row)}`, content: clientDescText(row), el: e.currentTarget as HTMLElement })
}

/** 源库列 Tooltip 恒为完整原始 DATA_SOURCE_ID（正常行与回退行同源，DSS-REQ-074，AC-075）。 */
function onSourceMainEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({ key: `source-${rowKey(row)}`, content: row.sourceId, el: e.currentTarget as HTMLElement })
}

function onStatusEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({
    key: `status-${rowKey(row)}`,
    content: `原始状态：${row.snapshotStatus}`,
    el: e.currentTarget as HTMLElement,
  })
}

let unbindGlobalClose: (() => void) | null = null

onMounted(() => {
  unbindGlobalClose = tooltip.bindGlobalClose()
})

onUnmounted(() => {
  if (unbindGlobalClose) unbindGlobalClose()
  tooltip.destroy()
})

/** 表格数据替换（records 变化）关闭 Tooltip（DSS-REQ-070②，AC-076）。 */
watch(
  () => props.records,
  () => tooltip.hide(),
)
</script>

<style scoped>
/* Linear 原型（纯视觉试验）：仅在本表格子树内收紧 EP 表观感；不改全局 --el-*、不改业务结构。
   表已移除 border（模板层），EP 默认即无垂直网格，仅每行 1px 水平分隔线，其颜色经表根自定义属性局部收紧到 #f4f4f5。 */
.dss-table-wrap {
  width: 100%;
  overflow-x: auto;
}
/* 弹性表格（DSS-REQ-069/AC-073，R5 列宽模型）：固定列 序号70＋快照状态140；弹性列（min-width）探针端170/源库285/三时间列各170，
   按 min-width 成比例吸收宽屏富余并铺满结果卡片（源库增量最大、始终明显宽于探针端）；最小总宽 70+170+285+140+170×3=1175、窄屏容器横向滚动 */
.dss-table {
  width: 100%;
  min-width: 1175px;
  /* 局部收紧 EP 表令牌：scoped 属性选择器将根类抬到 (0,2,0)，稳定覆盖 .el-table 单类默认（作用仅限本表） */
  --el-table-border-color: #f4f4f5;
  --el-table-header-text-color: #71717a;
  --el-table-header-bg-color: #ffffff;
}
.dss-seq {
  font-size: 13px;
  color: #71717a;
  font-variant-numeric: tabular-nums;
}
.dss-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  line-height: 1.5;
}
.dss-cell-main {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #3f3f46;
  font-size: 14px;
}
/* 探针端主文本（R3）：600 字重 / 最深深色 #09090B；本规则位于 .dss-cell-main 之后，同等特异性下覆盖其 400/#3f3f46 */
.dss-probe-main {
  font-weight: 600;
  color: var(--dss-text-strong, #09090b);
}
/* 探针端 ID / 时间列统一等宽字体：数字纵向对齐（Linear 数据表观感） */
.dss-mono,
.dss-time {
  font-family: "SF Mono", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-variant-numeric: tabular-nums;
}
.dss-tt {
  outline: none;
}
/* 非启用微型 Badge（R4 §8）：浅红胶囊 #FEE2E2 底 / #991B1B 字，11px/700，radius 4，高 20px；UI 无衬线字体（不继承探针 ID 等宽字体）；
   inline-flex 内居中，line-height 用无单位 1（保持 R2 行高契约：全 CSS 无 px line-height/min-height）；
   flex:0 0 auto 保证不收缩；与 ID 间距沿用 .dss-cell gap 6px；Badge 不改变行内容高度（ID 14px 行高更大，行高仍由单元格文本驱动） */
.dss-inactive-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  box-sizing: border-box;
  padding: 0 6px;
  height: 20px;
  border-radius: 4px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  font-family: var(
    --el-font-family,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "Microsoft YaHei",
    "Noto Sans CJK SC",
    sans-serif
  );
  white-space: nowrap;
}
.dss-status-trigger {
  display: inline-block;
}
/* R5 §2 时间完整（1280 最小列宽下的硬性要求）：三个时间列（第 5/6/7 列）单元格水平内边距 12→8px，
   使 19 字符 yyyy-MM-dd HH:mm:ss 在 170px 最小列宽下仍完整（内容区 146→154px，等宽字体栈下需 ≈148px）。
   仅收紧水平内边距：垂直 padding 与行高（49px）不变，列宽与表格最小宽度亦不变；表头同列同步左移 4px 保持对齐。 */
.dss-table :deep(th.el-table__cell:nth-child(n + 5) .cell),
.dss-table :deep(td.el-table__cell:nth-child(n + 5) .cell) {
  padding-left: 8px;
  padding-right: 8px;
}
.dss-time {
  font-size: 13px;
  color: #3f3f46;
  white-space: nowrap;
}
.dss-time-dash {
  color: #c0c4cc;
}
/* 表头次标题化：12px/600/#71717A，正文单元行高加大到约 45px（td 垂直 padding 12px ×2 ＋ 内容行高） */
.dss-table :deep(.el-table__header th .cell) {
  font-size: 12px;
  font-weight: 600;
  color: var(--dss-text-muted, #71717a);
  letter-spacing: 0.01em;
}
.dss-table :deep(td.el-table__cell) {
  padding: 12px 0;
}
.dss-table :deep(th.el-table__cell) {
  padding: 11px 0;
}
/* UNKNOWN 行浅黄整行背景（纯视觉试验类，DSS-AC-070）：不改行数据与任何事件；非悬停 0.42，悬停加深 0.66 */
.dss-table :deep(.el-table__body tr.dss-warning-row > td.el-table__cell) {
  background-color: rgba(254, 243, 199, 0.42);
}
.dss-table :deep(.el-table__body tr.dss-warning-row:hover > td.el-table__cell) {
  background-color: rgba(254, 243, 199, 0.66);
}
</style>
