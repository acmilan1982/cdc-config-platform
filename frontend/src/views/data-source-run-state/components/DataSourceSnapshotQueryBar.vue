<template>
  <div class="dss-query-bar">
    <div class="dss-q-group">
      <span class="dss-q-label">探针端</span>
      <el-select
        :model-value="draft.clients"
        multiple
        collapse-tags
        class="dss-select"
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
        class="dss-select"
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
        class="dss-select"
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

function clientLabel(c: ClientCandidate): string {
  const desc = c.desc == null ? '' : c.desc.trim()
  return desc.length > 0 ? `${c.id}（${c.desc}）` : c.id
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
  return [{ value: ALL_OPTION, label: '全部' }, ...withGhost(draft.clients, known, knownOptions, (id) => `${id}（不在候选内）`)]
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
</style>
