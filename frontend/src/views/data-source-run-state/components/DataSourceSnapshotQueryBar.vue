<template>
  <div class="dss-query-bar">
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
        <el-option
          v-for="opt in clientOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
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
    <div class="dss-q-actions">
      <!-- 查询按钮：仅 kind=query 显示 loading；被功能阻断时视觉稳定，以 aria-disabled + 事件防御阻止鼠标/键盘二次请求 -->
      <el-button
        type="primary"
        class="dss-query-btn"
        :loading="queryLoading"
        :aria-disabled="ariaBlocked || undefined"
        @click="onQuery"
      >查询</el-button>
      <el-button class="dss-reset-btn" @click="onReset">重置</el-button>
    </div>
    <!-- CLIENT_DESC 完整 Tooltip（DSS-REQ-086，AC-100~102）：查询控件内隔离的最小单实例实现。
         与页面级表格 Tooltip（.dss-single-tooltip + useSnapshotTooltip 控制器）互相独立：不复用其控制器、
         不复用其类名，因此不会污染表格既有 Tooltip 与源库表格 Tooltip 的批准规则。
         position:fixed + Teleport 到 body → 全程不参与查询栏布局，显隐不改变任何控件几何。 -->
    <Teleport to="body">
      <div
        v-if="tt.visible"
        ref="ttEl"
        class="dss-q-tt"
        role="tooltip"
        :style="ttStyle"
      >{{ tt.content }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { ClientCandidate, QueryDraft, SourceCandidate, StatusToken } from '@/types/dataSourceSnapshot'
import { ALL_OPTION, concreteIds, normalizeDimension } from '@/views/data-source-run-state/utils/selection'
import { FIELD_TRUNCATE_CODE_POINTS, codePointLength, truncateCodePoints } from '@/views/data-source-run-state/utils/format'
import { computeTooltipPlacement } from '@/views/data-source-run-state/tooltip/tooltipPosition'
import type { TooltipAnchor } from '@/views/data-source-run-state/tooltip/tooltipPosition'

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
}>()

/** busy 期间查询功能被阻断：以 aria-disabled 语义标记，不改变外观。 */
const ariaBlocked = computed(() => props.busy)

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

/** 探针端展示：truncate(CLIENT_ID,20)（truncate(CLIENT_DESC,20)）；描述 null/空/纯空白时不产生空括号（DSS-REQ-085，AC-098）。 */
function clientLabel(c: ClientCandidate): string {
  const desc = c.desc == null ? '' : c.desc.trim()
  const idPart = truncateCodePoints(c.id, FIELD_TRUNCATE_CODE_POINTS)
  if (desc.length === 0) return idPart
  return `${idPart}（${truncateCodePoints(desc, FIELD_TRUNCATE_CODE_POINTS)}）`
}

/** 源库展示：truncate(DATA_SOURCE_ORG,20)（truncate(DATA_SOURCE_ID,20)）；ORG 空/纯空白时回退截断后的原始 ID、不产生空括号（DSS-REQ-085，AC-098）。 */
function sourceLabel(s: SourceCandidate): string {
  const org = s.org == null ? '' : s.org.trim()
  const idPart = truncateCodePoints(s.id, FIELD_TRUNCATE_CODE_POINTS)
  if (org.length === 0) return idPart
  return `${truncateCodePoints(org, FIELD_TRUNCATE_CODE_POINTS)}（${idPart}）`
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
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.clients, known, knownOptions, (id) => `${truncateCodePoints(id, FIELD_TRUNCATE_CODE_POINTS)}（不在候选内）`)]
})

const sourceOptions = computed<Opt[]>(() => {
  const known = props.sources.map((s) => s.id)
  const knownOptions = props.sources.map((s) => ({ value: s.id, label: sourceLabel(s) }))
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.sources, known, knownOptions, (id) => `${truncateCodePoints(id, FIELD_TRUNCATE_CODE_POINTS)}（不在候选内）`)]
})

const statusOptions = computed<Opt[]>(() => {
  const known = props.statuses.map((s) => s as string)
  const knownOptions = props.statuses.map((s) => ({ value: s, label: statusLabel(s) }))
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.statuses, known, knownOptions, (t) => `${statusLabel(t)}（不在候选内）`)]
})

// ---------------------------------------------------------------- 查询控件内 CLIENT_DESC 完整 Tooltip
// DSS-REQ-086 / AC-100~102：仅当原始 CLIENT_DESC code point 长度 > 20 时，为①探针端下拉候选项与
// ②探针端控件中可见的选中项提供“完整未截断原始描述”单实例 Tooltip。源库字段/状态/超长 CLIENT_ID/
// 折叠 `+N` 一律不提供。仅在截断确实丢失信息时才出现，故判定与内容都取 trim 后的描述（与展示、与
// 表格既有 clientDescText 口径一致；§26.3 把 trim 视为展示管线的一部分，截断作用于 trim 后的值）。

/** 判定 + 内容：返回需要显示的完整原始 CLIENT_DESC；不需要 Tooltip 时返回 null。 */
function clientDescTooltip(c: ClientCandidate): string | null {
  const raw = c.desc
  if (raw == null) return null
  const desc = raw.trim()
  if (desc.length === 0) return null
  return codePointLength(desc) > FIELD_TRUNCATE_CODE_POINTS ? desc : null
}

/**
 * 把一段展示文案反查回唯一探针候选：候选与可见选中项使用同一套 clientLabel，
 * 因此“该文案是否可明确对应单个既有候选”等价于标签等值且命中唯一。
 * 命中 0 个（“全部”、幽灵项、折叠 `+N` 聚合文案）或多个时一律不作为 Tooltip 锚点。
 */
function matchClientByLabel(label: string): ClientCandidate | null {
  const hits = props.clients.filter((c) => clientLabel(c) === label)
  return hits.length === 1 ? hits[0]! : null
}

const tt = reactive<{ visible: boolean; content: string; anchor: TooltipAnchor | null; seq: number }>({
  visible: false,
  content: '',
  anchor: null,
  seq: 0,
})
const ttEl = ref<HTMLElement | null>(null)
/** 定位态样式：先置不可见、测量新内容尺寸后再一次性显示（与页面级 Tooltip 同策略，无旧坐标残影）。 */
const ttStyle = ref('visibility:hidden')

function hideTt(): void {
  hoveredEl = null
  tt.visible = false
  ttStyle.value = 'visibility:hidden'
}

function showTt(el: HTMLElement, content: string): void {
  const r = el.getBoundingClientRect()
  tt.content = content
  tt.anchor = { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
  tt.seq += 1
  tt.visible = true
}

watch(
  () => tt.seq,
  async () => {
    ttStyle.value = 'visibility:hidden'
    await nextTick()
    const el = ttEl.value
    if (!tt.visible || !el || !tt.anchor) return
    const p = computeTooltipPlacement(
      tt.anchor,
      { width: el.offsetWidth || 0, height: el.offsetHeight || 0 },
      { width: window.innerWidth || 0, height: window.innerHeight || 0 },
    )
    ttStyle.value = `left:${Math.round(p.left)}px;top:${Math.round(p.top)}px`
  },
  { flush: 'post' },
)

/** 命中的悬停元素；用于同一锚点内移动时不重算、不重复显示。 */
let hoveredEl: HTMLElement | null = null

/**
 * 锚点解析（只依赖 Element Plus 公开的面板/标签类名，不改动其内部 DOM 与盒模型）：
 * ① 探针端下拉候选项 → 该行的 `.el-select-dropdown__item`；
 * ② 探针端控件中可见的选中项 → 可关闭标签 `.el-tag`（折叠 `+N` 标签无 is-closable，被排除）。
 */
function resolveTooltipAnchor(target: HTMLElement): { el: HTMLElement; content: string } | null {
  const row = target.closest('.dss-client-popper .el-select-dropdown__item')
  if (row) {
    const c = matchClientByLabel((row.textContent ?? '').trim())
    const content = c ? clientDescTooltip(c) : null
    return content === null ? null : { el: row as HTMLElement, content }
  }
  const tag = target.closest('.dss-client-select .el-tag')
  if (tag) {
    if (!tag.classList.contains('is-closable')) return null
    const text = tag.querySelector('.el-select__tags-text')?.textContent ?? ''
    const c = matchClientByLabel(text.trim())
    const content = c ? clientDescTooltip(c) : null
    return content === null ? null : { el: tag as HTMLElement, content }
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
  showTt(hit.el, hit.content)
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
.dss-query-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
}
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
.dss-q-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}
/* 查询：黑色主按钮；重置：浅灰底深灰字次按钮（Linear 单一主视觉） */
.dss-q-actions .dss-query-btn {
  background: var(--dss-primary, #09090b);
  border-color: var(--dss-primary, #09090b);
  color: #ffffff;
  font-weight: 500;
  border-radius: 6px;
  height: 30px;
  padding: 0 16px;
}
.dss-q-actions .dss-query-btn:hover,
.dss-q-actions .dss-query-btn:focus {
  background: #27272a;
  border-color: #27272a;
  color: #ffffff;
}
.dss-q-actions .dss-reset-btn {
  background: #e4e4e7;
  border-color: transparent;
  color: var(--dss-text-secondary, #3f3f46);
  font-weight: 500;
  border-radius: 6px;
  height: 30px;
  padding: 0 14px;
}
.dss-q-actions .dss-reset-btn:hover,
.dss-q-actions .dss-reset-btn:focus {
  background: #d9d9dd;
  border-color: transparent;
  color: var(--dss-text-secondary, #3f3f46);
}
/* 查询控件内 CLIENT_DESC 完整 Tooltip（DSS-REQ-086，AC-100~102）：
   安全最大宽度 min(480px, calc(100vw - 16px))，width:max-content → 在安全宽度内单行、超出才自然换行、不越出视口；
   单实例（同一时刻至多一个 DOM 节点）、不可交互、position:fixed 不参与查询栏布局。
   类名 dss-q-tt 独立于页面级表格 Tooltip 的 .dss-single-tooltip，两者互不干扰。 */
.dss-q-tt {
  position: fixed;
  z-index: 3000;
  box-sizing: border-box;
  max-width: min(480px, calc(100vw - 16px));
  width: max-content;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  color: #303133;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
  pointer-events: none;
}
</style>

<!-- 候选下拉幽灵项（teleport 到 body）：以弱化样式提示该值当前不在候选内（UI §3.5） -->
<style>
.dss-ghost .el-select-dropdown__item {
  color: #c0c4cc;
  font-style: italic;
}

/* 下拉面板宽度上限（DSS-REQ-075，AC-084）：探针端 ≤480px、源库 ≤560px，均不超过安全视口 calc(100vw - 16px)；
   探针端/源库/快照状态专属 popper-class 均使用本 Feature 命名空间，不污染全局选择器 */
.dss-client-popper {
  max-width: min(480px, calc(100vw - 16px));
}
.dss-source-popper {
  max-width: min(560px, calc(100vw - 16px));
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
