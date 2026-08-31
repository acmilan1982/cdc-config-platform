<template>
  <div class="source-table-selector" :class="{ disabled }">
    <div class="st-schemas-pane">
      <div class="st-pane-header">Schema</div>
      <div class="st-pane-body">
        <div v-if="schemasLoading" class="st-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载 Schema 中…</span>
        </div>
        <div v-else-if="schemasError" class="st-error">
          <div class="st-error-msg">{{ schemasError }}</div>
          <el-button size="small" @click="loadSchemas">重试加载</el-button>
        </div>
        <div v-else-if="schemas.length === 0" class="st-empty">该源库无可订阅的普通表 Schema</div>
        <div v-else class="st-schema-list">
          <div
            v-for="schema in schemas"
            :key="schema"
            class="st-schema-item"
            :class="{ active: schema === currentSchema }"
            @click="selectSchema(schema)"
          >
            <span class="st-schema-name" :title="schema">{{ schema }}</span>
            <span class="st-schema-count">已选 {{ selectedCountOf(schema) }} 张</span>
          </div>
        </div>
      </div>
    </div>

    <div class="st-tables-pane">
      <div class="st-pane-header">
        <span>{{ currentSchema ? currentSchema : '请选择 Schema' }}</span>
        <span v-if="currentSchema" class="st-tables-summary">
          共 {{ currentTables ? currentTables.length : 0 }} 张，已选 {{ selectedCountOf(currentSchema) }} 张
        </span>
      </div>
      <div v-if="currentSchema" class="st-toolbar">
        <el-input
          v-model="tableSearch"
          size="small"
          placeholder="表名模糊搜索（不区分大小写）"
          clearable
          class="st-search"
        />
        <el-button size="small" @click="selectAllSearch">全选当前筛选</el-button>
        <el-button size="small" @click="tableSearch = ''">清除搜索</el-button>
        <el-button size="small" :type="onlySelectedView ? 'primary' : 'default'" @click="onlySelectedView = !onlySelectedView">
          仅看已选
        </el-button>
        <el-button size="small" @click="clearCurrentSchema">清空当前 Schema</el-button>
      </div>
      <div class="st-pane-body">
        <div v-if="tableLoadingSchema === currentSchema && !currentTables" class="st-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载表中…</span>
        </div>
        <div v-else-if="tableError && tableError.schema === currentSchema" class="st-error">
          <div class="st-error-msg">{{ tableError.message }}</div>
          <el-button size="small" @click="retryTables">重试加载</el-button>
        </div>
        <div v-else-if="currentSchema && currentTables && currentTables.length === 0" class="st-empty">
          该 Schema 下没有可订阅的普通表
        </div>
        <div v-else-if="currentSchema && currentTables && filteredTables.length === 0" class="st-empty">
          没有匹配当前搜索的源表
        </div>
        <div v-else-if="currentSchema" class="st-table-list">
          <label
            v-for="table in filteredTables"
            :key="table"
            class="st-table-item"
            :class="{ selected: isSelected(currentSchema, table), reserved: isReserved(currentSchema, table) }"
          >
            <el-checkbox
              :model-value="isSelected(currentSchema, table)"
              :disabled="disabled || isReserved(currentSchema, table)"
              @change="toggleTable(currentSchema, table)"
            />
            <span class="st-table-name" :title="reservedReason(currentSchema, table)">{{ table }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { fetchSourceSchemas, fetchSourceTables } from '@/api/subscription'
import type { SourceTableInput } from '@/types/subscription'
import { isReservedCommaOrDot, tableKey } from '../utils/subscriptionFormat'

const props = defineProps<{
  sourceId: string | null
  modelValue: SourceTableInput[]
  disabled?: boolean
  /** 编辑打开回显时需确保展示的 Schema（其表会自动加载以便回显勾选）。 */
  preloadSchemas?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SourceTableInput[]): void
}>()

// 请求代际防护：切换源库时 sourceGen 自增，使旧源库在途响应失效，防止串扰（UI.md §7.2）。
let sourceGen = 0
let schemaSeq = 0
let tableSeq = 0

const schemas = ref<string[]>([])
const schemasLoading = ref(false)
const schemasError = ref<string | null>(null)
const currentSchema = ref<string | null>(null)
const currentTables = ref<string[] | null>(null)
const tableLoadingSchema = ref<string | null>(null)
const tableError = ref<{ schema: string; message: string } | null>(null)
const tableSearch = ref('')
const onlySelectedView = ref(false)
// 弹窗会话内缓存：键为 `${sourceId}::${schema}`，切换 Schema/源库不重复请求。
const tableCache = new Map<string, string[]>()

function messageOf(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: string }).message
    if (m) return m
  }
  return '加载失败'
}

function isSelected(schema: string, table: string): boolean {
  return props.modelValue.some((t) => t.schemaName === schema && t.tableName === table)
}

function selectedCountOf(schema: string): number {
  return props.modelValue.filter((t) => t.schemaName === schema).length
}

function isReserved(schema: string, table: string): boolean {
  return isReservedCommaOrDot(schema) || isReservedCommaOrDot(table)
}

function reservedReason(schema: string, table: string): string {
  if (isReservedCommaOrDot(schema)) return 'Schema 名含协议保留字符（英文逗号或英文句点），不能用于订阅配置'
  if (isReservedCommaOrDot(table)) return '表名含协议保留字符（英文逗号或英文句点），不能用于订阅配置'
  return ''
}

async function loadTables(schema: string) {
  const sourceId = props.sourceId
  if (!sourceId) return
  const cacheKey = `${sourceId}::${schema}`
  const cached = tableCache.get(cacheKey)
  if (cached !== undefined) {
    currentTables.value = cached
    return
  }
  const gen = sourceGen
  const seq = ++tableSeq
  tableLoadingSchema.value = schema
  tableError.value = null
  try {
    const res = await fetchSourceTables(sourceId, schema)
    if (gen !== sourceGen || seq !== tableSeq) return
    const tables = res.code === 200 ? (res.data?.tables ?? []) : []
    tableCache.set(cacheKey, tables)
    currentTables.value = tables
  } catch (e) {
    if (gen !== sourceGen || seq !== tableSeq) return
    tableError.value = { schema, message: messageOf(e) }
    currentTables.value = null
  } finally {
    if (gen === sourceGen && seq === tableSeq) tableLoadingSchema.value = null
  }
}

async function loadSchemas() {
  const sourceId = props.sourceId
  if (!sourceId) return
  const gen = sourceGen
  const seq = ++schemaSeq
  schemasLoading.value = true
  schemasError.value = null
  try {
    const res = await fetchSourceSchemas(sourceId)
    if (gen !== sourceGen || seq !== schemaSeq) return
    if (res.code !== 200) {
      schemasError.value = res.message
      schemas.value = []
      return
    }
    schemas.value = [...(res.data?.schemas ?? [])]
    for (const s of props.preloadSchemas ?? []) {
      if (!schemas.value.includes(s)) schemas.value.push(s)
    }
    if (currentSchema.value === null) {
      const preferred = props.preloadSchemas ?? []
      currentSchema.value = preferred.length > 0 ? preferred[0] : schemas.value[0] ?? null
    }
    if (currentSchema.value) {
      loadTables(currentSchema.value)
    }
  } catch (e) {
    if (gen !== sourceGen || seq !== schemaSeq) return
    schemasError.value = messageOf(e)
    schemas.value = []
  } finally {
    if (gen === sourceGen) schemasLoading.value = false
  }
}

function selectSchema(schema: string) {
  if (props.disabled) return
  if (schema === currentSchema.value) return
  currentSchema.value = schema
  tableSearch.value = ''
  loadTables(schema)
}

function retryTables() {
  if (currentSchema.value) loadTables(currentSchema.value)
}

function toggleTable(schema: string, table: string) {
  if (props.disabled || isReserved(schema, table)) return
  const key = tableKey(schema, table)
  const selected = [...props.modelValue]
  const idx = selected.findIndex((t) => tableKey(t.schemaName, t.tableName) === key)
  if (idx >= 0) {
    selected.splice(idx, 1)
  } else {
    selected.push({ schemaName: schema, tableName: table })
  }
  emit('update:modelValue', selected)
}

const filteredTables = computed(() => {
  if (!currentTables.value) return []
  const kw = tableSearch.value.trim().toLowerCase()
  let list = kw ? currentTables.value.filter((t) => t.toLowerCase().includes(kw)) : currentTables.value
  if (onlySelectedView.value && currentSchema.value) {
    list = list.filter((t) => isSelected(currentSchema.value as string, t))
  }
  return list
})

function selectAllSearch() {
  if (props.disabled || !currentSchema.value) return
  const schema = currentSchema.value
  const selected = [...props.modelValue]
  const existingKeys = new Set(selected.map((t) => tableKey(t.schemaName, t.tableName)))
  for (const t of filteredTables.value) {
    if (isReserved(schema, t)) continue
    const key = tableKey(schema, t)
    if (!existingKeys.has(key)) {
      selected.push({ schemaName: schema, tableName: t })
      existingKeys.add(key)
    }
  }
  emit('update:modelValue', selected)
}

function clearCurrentSchema() {
  if (props.disabled || !currentSchema.value) return
  const schema = currentSchema.value
  ElMessageBox.confirm(`确定清空当前 Schema（${schema}）下已选择的源表吗？`, '提示', {
    type: 'warning',
  })
    .then(() => {
      emit('update:modelValue', props.modelValue.filter((t) => t.schemaName !== schema))
    })
    .catch(() => undefined)
}

watch(
  () => props.sourceId,
  (sourceId) => {
    sourceGen++
    schemaSeq = 0
    tableSeq = 0
    schemas.value = []
    currentSchema.value = null
    currentTables.value = null
    tableError.value = null
    tableSearch.value = ''
    onlySelectedView.value = false
    if (sourceId) loadSchemas()
  },
  { immediate: true },
)
</script>

<style scoped>
.source-table-selector {
  display: flex;
  gap: 8px;
  height: 360px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 8px;
  box-sizing: border-box;
}
.source-table-selector.disabled {
  opacity: 0.6;
  pointer-events: none;
}
.st-schemas-pane,
.st-tables-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.st-schemas-pane {
  width: 42%;
  border-right: 1px solid var(--el-border-color-lighter);
  padding-right: 8px;
}
.st-tables-pane {
  flex: 1;
  padding-left: 8px;
}
.st-pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
  padding: 0 2px 8px;
  flex-shrink: 0;
}
.st-tables-summary {
  font-weight: 400;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.st-pane-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.st-toolbar {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: 8px;
  flex-shrink: 0;
}
.st-search {
  width: 150px;
}
.st-loading,
.st-empty,
.st-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.st-error {
  flex-direction: column;
}
.st-error-msg {
  color: var(--el-color-danger);
  word-break: break-all;
  padding: 0 8px;
  text-align: center;
}
.st-schema-list,
.st-table-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.st-schema-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.st-schema-item:hover {
  background: var(--el-color-primary-light-9);
}
.st-schema-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}
.st-schema-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.st-schema-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.st-table-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.st-table-item.selected {
  background: var(--el-color-primary-light-9);
}
.st-table-item.reserved {
  opacity: 0.55;
  cursor: not-allowed;
}
.st-table-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
