<template>
  <div class="toff-query-bar">
    <div class="toff-q-group">
      <span class="toff-q-label">客户端</span>
      <el-select
        :model-value="draft.clients"
        multiple
        collapse-tags
        class="toff-select"
        placeholder="全部"
        @change="(val: string[]) => onChange('clients', val)"
      >
        <el-option v-for="opt in clientOptions" :key="opt.value" :label="opt.label" :value="opt.value">
          <div class="toff-opt" :title="opt.label">{{ opt.label }}</div>
        </el-option>
      </el-select>
    </div>
    <div class="toff-q-group">
      <span class="toff-q-label">源库</span>
      <el-select
        :model-value="draft.sources"
        multiple
        collapse-tags
        class="toff-select"
        placeholder="全部"
        @change="(val: string[]) => onChange('sources', val)"
      >
        <el-option v-for="opt in sourceOptions" :key="opt.value" :label="opt.label" :value="opt.value">
          <div class="toff-opt" :title="opt.label">{{ opt.label }}</div>
        </el-option>
      </el-select>
    </div>
    <div class="toff-q-group">
      <span class="toff-q-label">目标库</span>
      <el-select
        :model-value="draft.targets"
        multiple
        collapse-tags
        class="toff-select"
        placeholder="全部"
        @change="(val: string[]) => onChange('targets', val)"
      >
        <el-option v-for="opt in targetOptions" :key="opt.value" :label="opt.label" :value="opt.value">
          <div class="toff-opt" :title="opt.label">{{ opt.label }}</div>
        </el-option>
      </el-select>
    </div>
    <div class="toff-q-group">
      <span class="toff-q-label">表名</span>
      <el-input
        :model-value="draft.tableName"
        class="toff-table-input"
        placeholder="请输入表名"
        clearable
        @update:model-value="(v: string) => (draft.tableName = v ?? '')"
        @clear="draft.tableName = ''"
        @keyup.enter="onQuery"
      />
    </div>
    <div class="toff-q-actions">
      <el-button type="primary" @click="onQuery">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { ClientCandidate, DataSourceCandidate, QueryDraft } from '@/types/topicOffset'
import { ALL_OPTION, concreteIds, draftFromCriteria, normalizeDimension } from '@/views/topic-offset/utils/selection'
import type { AppliedCriteria } from '@/types/topicOffset'

interface OptionItem {
  value: string
  label: string
}

const props = defineProps<{
  clients: ClientCandidate[]
  sources: DataSourceCandidate[]
  targets: DataSourceCandidate[]
  /** 挂载时表单初始条件（返回本页时恢复已生效条件，DESIGN §6.3）。 */
  initial?: AppliedCriteria | null
}>()

const emit = defineEmits<{
  (e: 'query', draft: QueryDraft): void
}>()

function defaultDraft(): QueryDraft {
  return draftFromCriteria(null)
}

const draft = reactive<QueryDraft>(props.initial ? draftFromCriteria(props.initial) : defaultDraft())

function onChange(key: keyof Pick<QueryDraft, 'clients' | 'sources' | 'targets'>, next: string[]): void {
  const prev = [...draft[key]]
  draft[key] = normalizeDimension(prev, next)
}

function onQuery(): void {
  emit('query', {
    clients: [...draft.clients],
    sources: [...draft.sources],
    targets: [...draft.targets],
    tableName: draft.tableName,
  })
}

/** 重置仅恢复草稿为缺省，不查询（TOFF-REQ-037）。 */
function onReset(): void {
  const d = defaultDraft()
  draft.clients = d.clients
  draft.sources = d.sources
  draft.targets = d.targets
  draft.tableName = d.tableName
}

function clientLabel(c: ClientCandidate): string {
  const base = c.desc ? `${c.id}（${c.desc}）` : c.id
  return c.active ? base : `${base}（已停用）`
}

function dataSourceLabel(d: DataSourceCandidate): string {
  const org = d.org && d.org.trim().length > 0 ? d.org : '未定义名称'
  const base = `${org}（${d.id}）`
  return d.active ? base : `${base}（已停用）`
}

function withGhost(model: string[], known: string[], labeller: (id: string) => string): OptionItem[] {
  const opts: OptionItem[] = known.map((id) => ({ value: id, label: labeller(id) }))
  for (const id of concreteIds(model)) {
    if (!known.includes(id)) {
      opts.push({ value: id, label: `${id}（配置不存在）` })
    }
  }
  return opts
}

const clientOptions = computed<OptionItem[]>(() => {
  const known = props.clients.map((c) => c.id)
  const items = withGhost(draft.clients, known, (id) => {
    const c = props.clients.find((x) => x.id === id)
    return c ? clientLabel(c) : `${id}（配置不存在）`
  })
  return [{ value: ALL_OPTION, label: '全部' }, ...items]
})

const sourceOptions = computed<OptionItem[]>(() => {
  const known = props.sources.map((s) => s.id)
  const items = withGhost(draft.sources, known, (id) => {
    const s = props.sources.find((x) => x.id === id)
    return s ? dataSourceLabel(s) : `${id}（配置不存在）`
  })
  return [{ value: ALL_OPTION, label: '全部' }, ...items]
})

const targetOptions = computed<OptionItem[]>(() => {
  const known = props.targets.map((t) => t.id)
  const items = withGhost(draft.targets, known, (id) => {
    const t = props.targets.find((x) => x.id === id)
    return t ? dataSourceLabel(t) : `${id}（配置不存在）`
  })
  return [{ value: ALL_OPTION, label: '全部' }, ...items]
})

defineExpose({ reset: onReset, draft })
</script>

<style scoped>
.toff-query-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
}
.toff-q-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}
.toff-q-label {
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}
.toff-select {
  width: 200px;
}
.toff-table-input {
  width: 200px;
}
.toff-q-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}
</style>

<!-- 候选下拉项（teleport 到 body）：长描述/标签省略，悬浮显示完整内容（TOFF-REQ-047，R1 §4.5） -->
<style>
.toff-opt {
  max-width: 220px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
