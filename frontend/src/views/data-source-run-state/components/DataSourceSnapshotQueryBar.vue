<template>
  <!-- 查询条件区容器改由公共层提供（SHARED_COMPONENT_DESIGN §7.4.2）：字段组流式换行区 + 操作区，
       本组件只保留字段组、标签与控件宽度等 Feature 专属内容。 -->
  <QueryListQueryPanel>
    <div class="dss-q-group">
      <span class="dss-q-label">探针端</span>
      <el-select
        :model-value="draft.clients"
        multiple
        collapse-tags
        class="dss-select dss-client-select"
        popper-class="dss-client-popper"
        placeholder="全部"
        @change="(val: string[]) => onChange('clients', val)"
      >
        <!-- 可见已选项（折叠 tags 仅渲染首个可关闭标签）的稳定身份来源：直接取 Element Plus label slot
             提供的原始 option value，不再用截断后的显示文字反查探针（R1 §6.2）。 -->
        <template #label="{ value, label }">
          <span :data-dss-client-id="value">{{ label }}</span>
        </template>
        <el-option
          v-for="opt in clientOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
          :data-dss-client-id="opt.value"
          :class="{ 'dss-ghost': opt.ghost }"
        />
      </el-select>
    </div>
    <div class="dss-q-group">
      <span class="dss-q-label">源库</span>
      <el-select
        :model-value="draft.sources"
        multiple
        collapse-tags
        class="dss-select dss-source-select"
        popper-class="dss-source-popper"
        placeholder="全部"
        @change="(val: string[]) => onChange('sources', val)"
      >
        <el-option
          v-for="opt in sourceOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
          :class="{ 'dss-ghost': opt.ghost }"
        />
      </el-select>
    </div>
    <div class="dss-q-group">
      <span class="dss-q-label">快照状态</span>
      <el-select
        :model-value="draft.statuses"
        multiple
        collapse-tags
        class="dss-select dss-status-select"
        popper-class="dss-status-popper"
        placeholder="全部"
        @change="(val: string[]) => onChange('statuses', val)"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
          :class="{ 'dss-ghost': opt.ghost }"
        />
      </el-select>
    </div>
    <!-- 查询/重置按钮由公共操作区渲染（§7.4.3）：固定宽度四值同锁与 Loading 几何稳定契约由公共层负责，
         查询文案恒为“查询”、被功能阻断时以 aria-disabled + 事件防御阻止二次请求，语义与冻结前一致。 -->
    <template #actions>
      <QueryListActions
        :height-px="30"
        :query-loading="queryLoading"
        :busy="busy"
        @query="onQuery"
        @reset="onReset"
      />
    </template>
  </QueryListQueryPanel>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import type { ClientCandidate, QueryDraft, SourceCandidate, StatusToken } from '@/types/dataSourceSnapshot'
import { QueryListActions, QueryListQueryPanel } from '@/components/query-list'
import type { QueryListTooltipShowOptions } from '@/components/query-list'
import { ALL_OPTION, concreteIds, normalizeDimension } from '@/views/data-source-run-state/utils/selection'
import { FIELD_TRUNCATE_CODE_POINTS, codePointLength, displayField, normalizeFieldText } from '@/views/data-source-run-state/utils/format'

interface Opt {
  value: string
  label: string
  ghost?: boolean
}

const props = defineProps<{
  clients: ClientCandidate[]
  sources: SourceCandidate[]
  statuses: StatusToken[]
  /** 任一实际请求在途：查询被功能阻断（事件防御），视觉保持稳定（DSS-REQ-071④）。 */
  busy: boolean
  /** 仅 kind=query 在途：查询按钮显示 loading（DSS-REQ-071③，AC-078）。 */
  queryLoading: boolean
  /** 页面唯一 Tooltip 控制器的 show（DSS-REQ-086，AC-100~102）。 */
  showTooltip: (opts: QueryListTooltipShowOptions) => void
  /** 页面唯一 Tooltip 控制器的 hide。 */
  hideTooltip: () => void
}>()

const emit = defineEmits<{
  (e: 'query', draft: QueryDraft): void
}>()

type DraftKey = keyof Pick<QueryDraft, 'clients' | 'sources' | 'statuses'>

/** 每次页面实例创建默认三项“全部”；只保存于草稿层，绝不直接发送（DESIGN §7.1/§7.2）。 */
function defaultDraft(): QueryDraft {
  return { clients: [ALL_OPTION], sources: [ALL_OPTION], statuses: [ALL_OPTION] }
}

const draft = reactive<QueryDraft>(defaultDraft())

const STATUS_LABELS: Record<StatusToken, string> = {
  RUNNING: '快照进行中',
  COMPLETED: '快照已完成',
  UNKNOWN: '未知状态',
}

/** 探针端展示：displayField(CLIENT_ID)（displayField(CLIENT_DESC)）；描述 trim 后为空时不产生空括号（DSS-REQ-085，AC-098）。 */
function clientLabel(c: ClientCandidate): string {
  const idPart = displayField(c.id)
  const descPart = displayField(c.desc)
  if (descPart.length === 0) return idPart
  return `${idPart}（${descPart}）`
}

/** 源库展示：displayField(DATA_SOURCE_ORG)（displayField(DATA_SOURCE_ID)）；ORG trim 后为空时回退处理后的 ID、不产生空括号（DSS-REQ-085，AC-098）。 */
function sourceLabel(s: SourceCandidate): string {
  const idPart = displayField(s.id)
  const orgPart = displayField(s.org)
  if (orgPart.length === 0) return idPart
  return `${orgPart}（${idPart}）`
}

function statusLabel(token: string): string {
  const base = STATUS_LABELS[token as StatusToken]
  return base ? `${base}（${token}）` : token
}

function withGhost(
  model: string[],
  known: string[],
  knownOptions: Opt[],
  ghostLabel: (value: string) => string,
): Opt[] {
  const opts: Opt[] = [...knownOptions]
  for (const value of concreteIds(model)) {
    if (!known.includes(value)) {
      opts.push({ value, label: ghostLabel(value), ghost: true })
    }
  }
  return opts
}

const clientOptions = computed<Opt[]>(() => {
  const known = props.clients.map((c) => c.id)
  const knownOptions = props.clients.map((c) => ({ value: c.id, label: clientLabel(c) }))
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.clients, known, knownOptions, (id) => `${displayField(id)}（不在候选内）`)]
})

const sourceOptions = computed<Opt[]>(() => {
  const known = props.sources.map((s) => s.id)
  const knownOptions = props.sources.map((s) => ({ value: s.id, label: sourceLabel(s) }))
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.sources, known, knownOptions, (id) => `${displayField(id)}（不在候选内）`)]
})

const statusOptions = computed<Opt[]>(() => {
  const known = props.statuses.map((s) => s as string)
  const knownOptions = props.statuses.map((s) => ({ value: s, label: statusLabel(s) }))
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.statuses, known, knownOptions, (t) => `${statusLabel(t)}（不在候选内）`)]
})

// ---------------------------------------------------------------- 查询控件内 CLIENT_DESC 完整 Tooltip
// DSS-REQ-086 / AC-100~102：仅当原始 CLIENT_DESC code point 长度 > 20 时，为①探针端下拉候选项与
// ②探针端控件中可见的选中项提供“完整未截断原始描述”单实例 Tooltip。源库字段/状态/超长 CLIENT_ID/
// 折叠 `+N` 一律不提供。仅在截断确实丢失信息时才出现，故判定与内容都取 trim 后的描述（与展示、
// 与表格既有 clientDescText 口径一致；§26.3 把 trim 视为展示管线的一部分，截断作用于 trim 后的值）。
// 锚点定位只走 Feature 私有 `data-dss-client-id`（原始完整 CLIENT_ID），不以可见文字反查（R1 §6.2）。

/** 判定 + 内容：返回需要显示的完整 trim 后 CLIENT_DESC；不需要 Tooltip 时返回 null。 */
function clientDescTooltip(c: ClientCandidate): string | null {
  const desc = normalizeFieldText(c.desc)
  if (desc.length === 0) return null
  return codePointLength(desc) > FIELD_TRUNCATE_CODE_POINTS ? desc : null
}

/**
 * 探针稳定身份通道（R1 §6.2）：Feature 私有 `data-dss-client-id` 承载原始完整 CLIENT_ID。
 * 候选行由 `el-option` 的属性透传落到其渲染的 `li`；可见已选项由 Element Plus `label` slot
 * 提供的原始 option value 落到标签内层节点。两者都不依赖截断后的显示文字，因此 trim + 20 码点
 * 截断后可见标签相同的不同探针仍能被各自准确区分。
 */
const CLIENT_ID_ATTR = 'data-dss-client-id'

/** 由原始完整 CLIENT_ID 精确定位候选；`__ALL__`、幽灵项或不存在的值时返回 null（不作为锚点）。 */
function clientById(id: string | null): ClientCandidate | null {
  if (id === null) return null
  return props.clients.find((c) => c.id === id) ?? null
}

/**
 * 锚点、延迟、单实例与定位全部交给页面唯一控制器（§7.6.1/§7.6.4）：本组件只负责 Feature 专属的
 * “何时显示 CLIENT_DESC Tooltip”判定与锚点解析，不再持有 Teleport / Tooltip DOM / 定位状态，
 * 也不重复实现定位算法。
 */
function hideTt(): void {
  hoveredEl = null
  props.hideTooltip()
}

/** 命中的悬停元素；用于同一锚点内移动时不重发 show。 */
let hoveredEl: HTMLElement | null = null

/**
 * 锚点解析（只依赖 Element Plus 公开的面板/标签类名 + 本 Feature 私有 `data-*`，不改动其内部 DOM 与盒模型）：
 * ① 探针端下拉候选项 → 该行的 `.el-select-dropdown__item`，身份取行上的 `data-dss-client-id`；
 * ② 探针端控件中可见的选中项 → 可关闭标签 `.el-tag`（折叠 `+N` 标签无 is-closable 且无身份节点，双重排除）。
 * 一律按原始完整 CLIENT_ID 定位，绝不以截断/组合后的可见文字反查。
 */
function resolveTooltipAnchor(target: HTMLElement): { el: HTMLElement; id: string; content: string } | null {
  const row = target.closest('.dss-client-popper .el-select-dropdown__item')
  if (row) {
    const id = row.getAttribute(CLIENT_ID_ATTR)
    const c = clientById(id)
    const content = c ? clientDescTooltip(c) : null
    return content === null || id === null ? null : { el: row as HTMLElement, id, content }
  }
  const tag = target.closest('.dss-client-select .el-tag')
  if (tag) {
    if (!tag.classList.contains('is-closable')) return null
    const holder = tag.querySelector(`[${CLIENT_ID_ATTR}]`)
    const id = holder?.getAttribute(CLIENT_ID_ATTR) ?? null
    const c = clientById(id)
    const content = c ? clientDescTooltip(c) : null
    return content === null || id === null ? null : { el: tag as HTMLElement, id, content }
  }
  return null
}

function isElement(node: unknown): node is HTMLElement {
  return !!node && typeof (node as HTMLElement).closest === 'function'
}

function onDocMouseOver(e: MouseEvent): void {
  const target = e.target
  if (!isElement(target)) return
  const hit = resolveTooltipAnchor(target)
  if (!hit) {
    hideTt()
    return
  }
  if (hit.el === hoveredEl) return
  hoveredEl = hit.el
  // 查询栏内容上限固定 480px（§7.6.2）：与候选下拉外部宽度一致，超出才换行且不越出视口。
  props.showTooltip({ key: `client-desc:${hit.id}`, content: hit.content, el: hit.el, maxWidthPx: 480 })
}

function onDocMouseOut(e: MouseEvent): void {
  const target = e.target
  if (!isElement(target)) return
  if (!resolveTooltipAnchor(target)) return
  const to = e.relatedTarget
  if (isElement(to) && hoveredEl && hoveredEl.contains(to)) return
  hideTt()
}

// 下拉面板被 Teleport 到 body，不在组件子树内，故用捕获阶段的文档级委托统一覆盖“候选 + 可见选中项”两处锚点。
onMounted(() => {
  document.addEventListener('mouseover', onDocMouseOver, true)
  document.addEventListener('mouseout', onDocMouseOut, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('mouseover', onDocMouseOver, true)
  document.removeEventListener('mouseout', onDocMouseOut, true)
  hoveredEl = null
})

/** 多选互斥：选“全部”清空具体、选具体去“全部”、清空回“全部”；只改草稿，不发请求（DSS-REQ-022/023）。 */
function onChange(key: DraftKey, next: string[]): void {
  const prev = [...draft[key]]
  draft[key] = normalizeDimension(prev, next)
}

/** 任一实际请求在途时点击“查询”直接返回（鼠标/键盘均不会产生第二个请求，DSS-REQ-071 a）。 */
function onQuery(): void {
  if (props.busy) return
  emit('query', { clients: [...draft.clients], sources: [...draft.sources], statuses: [...draft.statuses] })
}

/** 重置：仅恢复草稿为三项“全部”，不查询、不清表格（DESIGN §8 E7，DSS-REQ-025）。 */
function onReset(): void {
  const d = defaultDraft()
  draft.clients = d.clients
  draft.sources = d.sources
  draft.statuses = d.statuses
}

defineExpose({ reset: onReset })
</script>

<style scoped>
/* 字段组容器、操作区容器与按钮本体均已由公共层提供（.ql-q-panel__flow / .ql-q-panel__actions /
   .ql-actions）；本文件只保留字段组、标签、控件宽度与下拉外观等 Feature 专属样式。 */
.dss-q-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}
/* R6 §1：三个查询字段标签提升为明确字段标签层级（14px / 600 / #3F3F46），
   与下拉框形成自然视觉层级；仍为无背景、无边框的单行文字，垂直居中由 .dss-q-group 的 align-items 保证。
   三个标签共用本规则 → 字体/字号/字重/颜色/行高完全一致；不改盒模型，因此控件尺寸与查询区域布局不变 */
.dss-q-label {
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 600;
  color: var(--dss-text-secondary, #3f3f46);
  white-space: nowrap;
}
.dss-select {
  width: 200px;
}
/* 控件宽度约束（DSS-REQ-075，AC-085）：探针端 240px < 源库 300px，延续“探针端列表短于源库”约束；快照状态维持约 200px */
.dss-client-select {
  width: 240px;
}
.dss-source-select {
  width: 300px;
}
.dss-status-select {
  width: 200px;
}
/* 外部几何锁（DSS-REQ-084，AC-096/097）：在上方 width 之上补齐 min-width / max-width / flex-basis，
   把 240 / 300 / 200 从“取自 Element Plus 内部收缩行为的结果”升级为本 Feature 命名空间的显式契约。
   三者共同作用：min-width + max-width 夹住宽度，flex: 0 0 <w> 阻止作为 .dss-q-group 的 flex 子项
   被内容撑开（flex-grow）或被过窄的查询栏压缩（flex-shrink）；因此宽度不随选中内容长度、多选、
   折叠 tags、清空、重置、面板开合或 Tooltip 显隐变化。真实浏览器 before/after 测量见实现报告。 */
.dss-client-select {
  min-width: 240px;
  max-width: 240px;
  flex: 0 0 240px;
}
.dss-source-select {
  min-width: 300px;
  max-width: 300px;
  flex: 0 0 300px;
}
.dss-status-select {
  min-width: 200px;
  max-width: 200px;
  flex: 0 0 200px;
}
/* 下拉框 wrapper：白底、无硬边框、6px 圆角、极弱阴影；聚焦＝局部 1px 深色焦点环，不出现厚重蓝色外框 */
.dss-select :deep(.el-select__wrapper) {
  background: var(--dss-surface, #ffffff);
  border-radius: 6px;
  min-height: 30px;
  padding-left: 10px;
  padding-right: 8px;
  box-shadow: 0 1px 2px rgba(9, 9, 11, 0.05);
  transition: box-shadow 0.12s ease;
}
.dss-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 1px 2px rgba(9, 9, 11, 0.08);
}
.dss-select :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px rgba(9, 9, 11, 0.7) inset;
}
/* 已选值轻量化（R5 §4）：去掉"全部"/具体选中项的灰色块背景与边框，只留文字 + 清除 ×；
   仅改标签底色，不触碰盒模型（高度/内边距/宽度不变），下拉框尺寸与布局保持不变 */
.dss-select :deep(.el-select__wrapper .el-tag) {
  background: transparent;
  border: none;
  color: var(--dss-text-secondary, #3f3f46);
  border-radius: 4px;
}
/* 内部可收缩区域显式 min-width: 0（DSS-REQ-084）：selection 是 wrapper 的 flex:1 1 0% 子项，
   显式归零其自动最小尺寸（automatic minimum size），使长候选/长选中文本只能被裁切而不能把外框顶宽。
   Element Plus 自身已给同样的值，此处再声明一次使契约落在本 Feature 命名空间内、不依赖 EP 内部实现。 */
.dss-client-select :deep(.el-select__selection),
.dss-source-select :deep(.el-select__selection),
.dss-status-select :deep(.el-select__selection) {
  min-width: 0;
}
/* 选中标签宽度约束与 ellipsis：超长 ID/描述不撑大选择框、不换行推高、不推动其后条件与按钮；底层选中值仍为完整 ID。
   DSS-REQ-085 统一字段级截断为主手段，text-overflow 仅作组合文本超出实际可用像素宽度时的最后保护（DSS-REQ-084④）。 */
.dss-client-select :deep(.el-select__selected-item),
.dss-source-select :deep(.el-select__selected-item),
.dss-status-select :deep(.el-select__selected-item) {
  max-width: 100%;
  overflow: hidden;
}
.dss-client-select :deep(.el-select__selected-item .el-tag),
.dss-source-select :deep(.el-select__selected-item .el-tag),
.dss-status-select :deep(.el-select__selected-item .el-tag) {
  max-width: 100%;
  overflow: hidden;
}
.dss-client-select :deep(.el-select__tags-text),
.dss-source-select :deep(.el-select__tags-text),
.dss-status-select :deep(.el-select__tags-text) {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 查询/重置按钮的固定宽度四值同锁、常驻 Loading 指示器、文字标签节点与 Tooltip 宿主样式
   全部移入公共层（.ql-actions__query / .ql-actions__reset / .ql-btn-spinner / .ql-tooltip，§7.4.3/§7.4.6）：
   本文件不再声明按钮几何、指示器、定位或任何 Tooltip DOM 样式。 */
</style>

<!-- 候选下拉幽灵项（teleport 到 body）：以弱化样式提示该值当前不在候选内（UI §3.5） -->
<style>
.dss-ghost .el-select-dropdown__item {
  color: #c0c4cc;
  font-style: italic;
}

/* 下拉弹层外层固定外部宽度（DSS-REQ-087，AC-104~107）：固定对象是携带 Feature 私有 popper class 的
   外层可见边界 `.el-popper.el-select__popper`（Teleport 到 body），不是其内部 `.el-select-dropdown` 内容盒，
   也不是查询栏 trigger。Element Plus 会把 `popper-class` 同时落到外层 popper 与内层 dropdown（实测裸 class 命中
   2 个元素），故必须使用 `.el-popper.<class>` 精确选择器，避免把内外两层按同一 border-box 宽度同时写死。
   实测外层无 inline width/min-width/max-width（仅 z-index/position/inset），三值同写即可决定 used width，
   因此无需 important 提升，也不依赖 resize 事件、尺寸观察器或轮询等任何脚本尺寸监听。
   内层 `.el-select-dropdown` 保持自适应、由内容盒填满外层，本规则不写其宽度。
   小视口上界统一为 min(目标宽度, calc(100vw - 16px))。 */
.el-popper.dss-client-popper {
  width: min(480px, calc(100vw - 16px));
  min-width: min(480px, calc(100vw - 16px));
  max-width: min(480px, calc(100vw - 16px));
}
.el-popper.dss-source-popper {
  width: min(400px, calc(100vw - 16px));
  min-width: min(400px, calc(100vw - 16px));
  max-width: min(400px, calc(100vw - 16px));
}
.el-popper.dss-status-popper {
  width: min(240px, calc(100vw - 16px));
  min-width: min(240px, calc(100vw - 16px));
  max-width: min(240px, calc(100vw - 16px));
}
/* 下拉项保持单行：逻辑截断（20 字符）为主，text-overflow:ellipsis 作为面板极窄或字体差异下的最终保护 */
.dss-client-popper .el-select-dropdown__item,
.dss-source-popper .el-select-dropdown__item,
.dss-status-popper .el-select-dropdown__item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 下拉面板 Linear 化（仅本 Feature 专属 popper-class）：白底、8px 圆角、无硬边框、柔和阴影 */
.el-select-dropdown.dss-client-popper,
.el-select-dropdown.dss-source-popper,
.el-select-dropdown.dss-status-popper {
  border: none;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(9, 9, 11, 0.12);
}
.el-select-dropdown.dss-client-popper .el-select-dropdown__item.is-hovering,
.el-select-dropdown.dss-source-popper .el-select-dropdown__item.is-hovering,
.el-select-dropdown.dss-status-popper .el-select-dropdown__item.is-hovering {
  background-color: rgba(9, 9, 11, 0.05);
}
</style>
