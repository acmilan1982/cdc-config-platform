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
        :loading="queryLoading"
        :aria-disabled="ariaBlocked || undefined"
        @click="onQuery"
      >查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { ClientCandidate, QueryDraft, SourceCandidate, StatusToken } from '@/types/dataSourceSnapshot'
import { ALL_OPTION, concreteIds, normalizeDimension } from '@/views/data-source-run-state/utils/selection'

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

/** 展示截断：按 Unicode code point（等价 code-point 安全）截取前 max 个，超出追加英文 "..."；只影响展示，不改变完整 value（DSS-REQ-075，AC-084）。 */
function truncateCodePoints(text: string, max: number): string {
  const points = Array.from(text)
  if (points.length <= max) return text
  return `${points.slice(0, max).join('')}...`
}

function clientLabel(c: ClientCandidate): string {
  const desc = c.desc == null ? '' : c.desc.trim()
  const idPart = truncateCodePoints(c.id, 20)
  if (desc.length === 0) return idPart
  return `${idPart}（${truncateCodePoints(desc, 20)}）`
}

function sourceLabel(s: SourceCandidate): string {
  const org = s.org == null ? '' : s.org.trim()
  return org.length > 0 ? `${s.org}（${s.id}）` : s.id
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
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.clients, known, knownOptions, (id) => `${truncateCodePoints(id, 20)}（不在候选内）`)]
})

const sourceOptions = computed<Opt[]>(() => {
  const known = props.sources.map((s) => s.id)
  const knownOptions = props.sources.map((s) => ({ value: s.id, label: sourceLabel(s) }))
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.sources, known, knownOptions, (id) => `${id}（不在候选内）`)]
})

const statusOptions = computed<Opt[]>(() => {
  const known = props.statuses.map((s) => s as string)
  const knownOptions = props.statuses.map((s) => ({ value: s, label: statusLabel(s) }))
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.statuses, known, knownOptions, (t) => `${statusLabel(t)}（不在候选内）`)]
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
  gap: 4px;
  flex: 0 0 auto;
}
.dss-q-label {
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
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
/* 选中标签宽度约束与 ellipsis：超长 ID/描述不撑大选择框、不换行推高、不推动其后条件与按钮；底层选中值仍为完整 ID */
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
</style>
