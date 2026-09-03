<template>
  <el-table
    :data="records"
    v-loading="loading"
    border
    class="toff-table"
    :empty-text="props.emptyText"
    :row-key="rowKey"
  >
    <el-table-column label="序号" width="70" align="center" fixed="left">
      <template #default="{ $index }">
        <span class="toff-seq">{{ startIndex + $index }}</span>
      </template>
    </el-table-column>
    <el-table-column label="同步对象" min-width="380" fixed="left">
      <template #default="{ row }">
        <div
          class="toff-sync-cell"
          @mouseenter="onSyncEnter(row, $event)"
          @mousemove="onSyncMove($event)"
          @mouseleave="onSyncLeave"
        >
          <template v-if="row.parseable && row.mapping && row.parsed">
            <div class="toff-sync-line">
              <!-- {CLIENT_ID} · {SOURCE_ORG} → {TARGET_ORG}：中点表示客户端与源库的中性关联，唯一箭头只表示源库→目标库 -->
              <span class="toff-seg">
                <span class="toff-seg-text">{{ clientSeg(row).text }}</span>
                <el-tag v-if="clientSeg(row).tag" :type="clientSeg(row).tagType" class="toff-seg-tag">{{
                  clientSeg(row).tag
                }}</el-tag>
              </span>
              <span class="toff-sep toff-sep-dot">·</span>
              <span class="toff-seg">
                <span class="toff-seg-text">{{ sourceSeg(row).text }}</span>
                <el-tag v-if="sourceSeg(row).tag" :type="sourceSeg(row).tagType" class="toff-seg-tag">{{
                  sourceSeg(row).tag
                }}</el-tag>
              </span>
              <span class="toff-sep toff-sep-arrow">→</span>
              <span class="toff-seg">
                <span class="toff-seg-text">{{ targetSeg(row).text }}</span>
                <el-tag v-if="targetSeg(row).tag" :type="targetSeg(row).tagType" class="toff-seg-tag">{{
                  targetSeg(row).tag
                }}</el-tag>
              </span>
            </div>
            <div class="toff-sync-line toff-schema">{{ row.parsed.schema }}.{{ row.parsed.table }}</div>
          </template>
          <div v-else class="toff-sync-line toff-unparse">Topic 格式无法解析</div>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="已保存消费位置" width="160" align="right">
      <template #default="{ row }">
        <span class="toff-offset">{{ textOrDash(row.nextOffset) }}</span>
      </template>
    </el-table-column>
    <el-table-column width="160" align="right">
      <template #header>
        <el-tooltip placement="top">
          <template #content>
            <span class="toff-header-tip">同步通道中下一条新数据将写入的位置，用于计算待消费数量。</span>
          </template>
          <span class="toff-header-text">最新数据位置</span>
        </el-tooltip>
      </template>
      <template #default="{ row }">
        <span class="toff-offset">{{ textOrDash(row.kafkaEndOffset) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="待消费数量" width="140" align="right">
      <template #default="{ row }">
        <span class="toff-offset">{{ textOrDash(row.pendingCount) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="消费延迟" width="140" align="right">
      <template #default="{ row }">
        <span class="toff-offset">{{ textOrDash(row.consumeLag) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="断点更新时间" width="170" align="center">
      <template #default="{ row }">
        <span class="toff-time">{{ row.updatedAt ?? '—' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="中心端" width="150" show-overflow-tooltip>
      <template #default="{ row }">
        <span class="toff-server">{{ row.serverId }}</span>
      </template>
    </el-table-column>
  </el-table>

  <!-- 同步对象 Tooltip 单实例（TOFF-REQ-018/019；R2 §4.5）：受控激活行 + 350ms 延迟，非 enterable -->
  <teleport to="body">
    <div
      v-if="tip.visible"
      ref="tipRef"
      class="toff-tip"
      :class="{ 'is-placed': tip.placed }"
      role="tooltip"
      :style="tipStyle"
    >
      <div class="toff-tip-topic">{{ tip.rawTopic }}</div>
      <div v-if="tip.hasNote" class="toff-tip-unparse">
        该 Topic 无法按“客户端.源库.Schema.表名.目标库”拆分，请人工核对 Topic 命名。
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { TopicMappingRef, TopicOffsetItem } from '@/types/topicOffset'
import { rowKey } from '@/views/topic-offset/utils/rowKey'
import { computeTooltipPosition } from '@/views/topic-offset/utils/tooltipPosition'

interface Seg {
  text: string
  tag?: string
  tagType?: 'warning' | 'info'
}

const props = withDefaults(
  defineProps<{
    records: TopicOffsetItem[]
    loading: boolean
    startIndex: number
    /** 空结果文案（TOFF-REQ-116）。 */
    emptyText?: string
  }>(),
  { emptyText: '暂无符合条件的数据' },
)

const DASH = '—'
/** 同步对象 Tooltip 延迟（R2 §4.5：同一固定值，代码注释与测试保持一致）。 */
const TIP_DELAY_MS = 350

interface TipModel {
  visible: boolean
  x: number
  y: number
  left: number
  top: number
  width: number
  height: number
  placed: boolean
  rawTopic: string
  hasNote: boolean
}
const tip = reactive<TipModel>({
  visible: false,
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  placed: false,
  rawTopic: '',
  hasNote: false,
})
const tipRef = ref<HTMLElement | null>(null)
let pendingKey: string | null = null
let openTimer: ReturnType<typeof setTimeout> | null = null

function clearOpenTimer(): void {
  if (openTimer !== null) {
    clearTimeout(openTimer)
    openTimer = null
  }
}

const tipStyle = computed(() => ({ left: `${tip.left}px`, top: `${tip.top}px` }))

/** 用当前指针 + 已测得真实尺寸重算 fixed 定位，并对视口四边做安全边距钳制（R3 §4）。 */
function applyTipPosition(): void {
  if (typeof window === 'undefined') return
  const pos = computeTooltipPosition(
    { x: tip.x, y: tip.y },
    { width: tip.width, height: tip.height },
    { width: window.innerWidth, height: window.innerHeight },
  )
  tip.left = pos.left
  tip.top = pos.top
}

/** 显示后读取 Tooltip 真实渲染宽高再定位；jsdom 无布局时 rect 为 0，保持隐藏但仍在 DOM。 */
function measureAndPlaceTip(): void {
  if (!tip.visible || tipRef.value === null) return
  const rect = tipRef.value.getBoundingClientRect()
  tip.width = rect.width
  tip.height = rect.height
  applyTipPosition()
  tip.placed = rect.width > 0 && rect.height > 0
}

// 显示瞬间先回到隐藏态并清空旧尺寸，用本行真实尺寸定位后再显示，避免沿用上一行尺寸闪跳
watch(
  () => tip.visible,
  (visible) => {
    if (!visible) return
    tip.placed = false
    tip.width = 0
    tip.height = 0
    void nextTick(measureAndPlaceTip)
  },
)

function scheduleTip(row: TopicOffsetItem, x: number, y: number): void {
  clearOpenTimer()
  const key = rowKey(row)
  pendingKey = key
  tip.rawTopic = row.rawTopic
  tip.hasNote = !row.parseable
  if (Number.isFinite(x)) tip.x = x
  if (Number.isFinite(y)) tip.y = y
  openTimer = setTimeout(() => {
    openTimer = null
    // 行键仍为当前激活行才显示（新行会先覆盖 pendingKey）
    if (pendingKey === key) tip.visible = true
  }, TIP_DELAY_MS)
}

function onSyncEnter(row: TopicOffsetItem, e: MouseEvent): void {
  scheduleTip(row, e.clientX, e.clientY)
}

function onSyncMove(e: MouseEvent): void {
  // 等待期或已显示时跟随指针；已显示后用已测得尺寸重新钳制，停在单元格内也不越界、不遮挡
  if (pendingKey !== null || tip.visible) {
    if (Number.isFinite(e.clientX)) tip.x = e.clientX
    if (Number.isFinite(e.clientY)) tip.y = e.clientY
    if (tip.visible) applyTipPosition()
  }
}

function onSyncLeave(): void {
  clearOpenTimer()
  pendingKey = null
  tip.visible = false
}

/** 页面滚动、视口变化都可能使 fixed Tooltip 漂移离开锚点，直接关闭避免遗留孤立提示。 */
function onViewportChange(): void {
  onSyncLeave()
}

function textOrDash(value: string | null | undefined): string {
  return value === null || value === undefined ? DASH : value
}

function refLabel(ref: TopicMappingRef): Seg {
  if (ref.state === 'NOT_FOUND') {
    return { text: ref.id, tag: '配置不存在', tagType: 'info' }
  }
  if (ref.state === 'INACTIVE') {
    return { text: ref.id, tag: '已停用', tagType: 'warning' }
  }
  return { text: ref.id }
}

function sourceTargetLabel(ref: TopicMappingRef): Seg {
  if (ref.state === 'NOT_FOUND') {
    return { text: ref.id, tag: '配置不存在', tagType: 'info' }
  }
  const org = ref.org && ref.org.trim().length > 0 ? ref.org : '未定义名称'
  if (ref.state === 'INACTIVE') {
    return { text: org, tag: '已停用', tagType: 'warning' }
  }
  return { text: org }
}

function clientSeg(row: TopicOffsetItem): Seg {
  const m = row.mapping
  return m ? refLabel(m.client) : { text: '' }
}

function sourceSeg(row: TopicOffsetItem): Seg {
  const m = row.mapping
  return m ? sourceTargetLabel(m.source) : { text: '' }
}

function targetSeg(row: TopicOffsetItem): Seg {
  const m = row.mapping
  return m ? sourceTargetLabel(m.target) : { text: '' }
}

// 查询结果替换/翻页/刷新提交时立即关闭 Tooltip
watch(() => props.records, onSyncLeave)
// 捕获阶段监听滚动（含表格内部滚动）与视口 resize，避免遗留孤立 Tooltip
onMounted(() => {
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
  onSyncLeave()
})
</script>

<style scoped>
.toff-table {
  width: 100%;
}
.toff-seq {
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  color: #606266;
}
.toff-sync-cell {
  line-height: 1.5;
  cursor: pointer;
  padding: 4px 0;
}
.toff-sync-line {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow: hidden;
}
.toff-sync-line + .toff-sync-line {
  margin-top: 2px;
}
.toff-seg {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  color: #303133;
  font-size: 14px;
  font-weight: 400;
}
.toff-seg-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  max-width: 170px;
}
.toff-seg-tag {
  margin-left: 4px;
}
.toff-sep {
  flex: 0 0 auto;
  margin: 0 6px;
  color: #909399;
  font-size: 14px;
}
.toff-schema {
  color: #606266;
  font-size: 13px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toff-unparse {
  color: #d92d20;
  font-size: 14px;
}
.toff-offset {
  color: #303133;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.toff-time {
  color: #303133;
  font-size: 14px;
  white-space: nowrap;
}
.toff-server {
  color: #303133;
  font-size: 14px;
}
.toff-header-text {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}
.toff-header-tip {
  white-space: normal;
  word-break: break-word;
  max-width: 280px;
  display: inline-block;
}
:deep(.el-table__header th .cell) {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>

<!-- 悬浮同步对象内容与不可解析提示 -->
<style>
.toff-tip {
  position: fixed;
  z-index: 3000;
  /* 窄视口下两侧各保留 8px 安全边距（R3 §4：与 tooltipPosition.ts 的 tooltipMaxWidth 一致） */
  max-width: min(340px, calc(100vw - 16px));
  padding: 8px 10px;
  border-radius: 6px;
  background: #303133;
  color: #fff;
  font-size: 13px;
  line-height: 1.5;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  /* 先以真实尺寸定位后再显示（is-placed），避免位置跳动 */
  visibility: hidden;
}
.toff-tip.is-placed {
  visibility: visible;
}
.toff-tip-topic {
  white-space: normal;
  word-break: break-all;
  overflow-wrap: anywhere;
}
.toff-tip-unparse {
  margin-top: 4px;
  color: #ffd04b;
}
</style>
