<template>
  <div class="source-table-selector" :class="{ disabled }">
    <div class="st-schemas-pane">
      <div class="st-pane-header">
        <span>Schema</span>
        <span v-if="schemas.length > 0" class="st-schemas-summary">{{ schemas.length }} 个</span>
      </div>
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
            :class="{ active: schema === currentSchema, failed: tableErrors.has(schema) }"
            :title="tableErrors.has(schema) ? `该 Schema 表清单加载失败：${tableErrors.get(schema)}` : ''"
            @click="selectSchema(schema)"
          >
            <span class="st-schema-name">{{ schema }}</span>
            <span v-if="tableErrors.has(schema)" class="st-schema-error">加载失败</span>
            <span v-else class="st-schema-count">已选 {{ selectedCountOf(schema) }} 张</span>
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
        <el-button size="small" @click="deselectFiltered">取消当前筛选</el-button>
        <el-button size="small" @click="clearSearch">清除搜索</el-button>
        <el-button
          size="small"
          :type="onlySelectedView ? 'primary' : 'default'"
          @click="onlySelectedView = !onlySelectedView"
        >
          仅看已选
        </el-button>
        <el-button size="small" @click="clearCurrentSchema">清空当前 Schema</el-button>
      </div>
      <div class="st-pane-body st-table-viewport">
        <div class="st-table-head">
          <span class="st-col-check"></span>
          <span class="st-col-name">表名</span>
        </div>
        <div v-if="currentSchemaLoading && !currentTables" class="st-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载表中…</span>
        </div>
        <div v-else-if="currentSchemaError" class="st-error">
          <div class="st-error-msg">{{ currentSchemaError }}</div>
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
            <span class="st-table-name" :title="reservedReason(currentSchema, table) || table">{{ table }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
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

const schemas = ref<string[]>([])
const schemasLoading = ref(false)
const schemasError = ref<string | null>(null)
const currentSchema = ref<string | null>(null)
const tableSearch = ref('')
const onlySelectedView = ref(false)
// 弹窗会话内缓存：键为 `${sourceId}::${schema}`，切换 Schema/源库不重复请求。
// 必须用响应式 Map，currentTables 派生计算才能感知缓存填充。
const tableCache = reactive(new Map<string, string[]>())
// 每个 Schema 独立的失败状态：一个 Schema 加载失败不影响其他 Schema（R1 §3.3）。
const tableErrors = reactive(new Map<string, string>())
const tableLoading = reactive(new Set<string>())

function cacheKeyOf(schema: string): string {
  return `${props.sourceId}::${schema}`
}

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

const currentTables = computed(() => {
  if (!currentSchema.value) return null
  return tableCache.get(cacheKeyOf(currentSchema.value)) ?? null
})

const currentSchemaLoading = computed(() => {
  return currentSchema.value !== null && tableLoading.has(currentSchema.value)
})

const currentSchemaError = computed(() => {
  return currentSchema.value ? tableErrors.get(currentSchema.value) ?? null : null
})

async function loadTables(schema: string) {
  const sourceId = props.sourceId
  if (!sourceId) return
  const key = cacheKeyOf(schema)
  if (tableCache.has(key)) return
  if (tableLoading.has(schema)) return
  const gen = sourceGen
  tableLoading.add(schema)
  tableErrors.delete(schema)
  try {
    const res = await fetchSourceTables(sourceId, schema)
    if (gen !== sourceGen) return
    const tables = res.code === 200 ? (res.data?.tables ?? []) : []
    tableCache.set(key, tables)
    tableErrors.delete(schema)
  } catch (e) {
    if (gen !== sourceGen) return
    tableErrors.set(schema, messageOf(e))
  } finally {
    if (gen === sourceGen) tableLoading.delete(schema)
  }
}

/** 自动加载并缓存全部已选 Schema 的表清单（R1 §3.3），受控并发避免串行阻塞。 */
async function preloadAllTables() {
  const sourceId = props.sourceId
  if (!sourceId) return
  const schemasToLoad = (props.preloadSchemas ?? []).filter((s) => !tableCache.has(cacheKeyOf(s)))
  const BATCH = 4
  for (let i = 0; i < schemasToLoad.length; i += BATCH) {
    await Promise.all(schemasToLoad.slice(i, i + BATCH).map((s) => loadTables(s)))
  }
}

async function loadSchemas() {
  const sourceId = props.sourceId
  if (!sourceId) return
  const gen = sourceGen
  schemasLoading.value = true
  schemasError.value = null
  try {
    const res = await fetchSourceSchemas(sourceId)
    if (gen !== sourceGen) return
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
      // 编辑回显默认定位到第一个已选 Schema（R1 §3.3）。
      currentSchema.value = preferred.length > 0 ? preferred[0] : schemas.value[0] ?? null
    }
    if (currentSchema.value) {
      void loadTables(currentSchema.value)
      void preloadAllTables()
    }
  } catch (e) {
    if (gen !== sourceGen) return
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
  void loadTables(schema)
}

function retryTables() {
  if (currentSchema.value) void loadTables(currentSchema.value)
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

/**
 * 取消当前 Schema 下当前过滤结果的选择（R1 §3.4）：
 * 只移除“当前 Schema 且命中当前筛选”的已选表，不得误删其他搜索结果或其他 Schema。
 */
function deselectFiltered() {
  if (props.disabled || !currentSchema.value) return
  const schema = currentSchema.value
  const filteredKeys = new Set(filteredTables.value.map((t) => tableKey(schema, t)))
  emit(
    'update:modelValue',
    props.modelValue.filter(
      (t) => !(t.schemaName === schema && filteredKeys.has(tableKey(t.schemaName, t.tableName))),
    ),
  )
}

/** 清除搜索关键字：仅清空搜索词，不等于取消当前搜索结果的勾选（R1 §3.4）。 */
function clearSearch() {
  tableSearch.value = ''
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

function resetForSourceChange() {
  schemas.value = []
  currentSchema.value = null
  tableSearch.value = ''
  onlySelectedView.value = false
  tableErrors.clear()
  tableLoading.clear()
}

watch(
  () => props.sourceId,
  (sourceId) => {
    sourceGen++
    resetForSourceChange()
    if (sourceId) void loadSchemas()
  },
  { immediate: true },
)

// preloadSchemas 在编辑打开时一次性传入；若其后变化，确保已选 Schema 仍被加载缓存。
watch(
  () => props.preloadSchemas,
  (preload) => {
    if (!preload || preload.length === 0 || schemas.value.length === 0) return
    void preloadAllTables()
  },
)
</script>

<style scoped>
.source-table-selector {
  display: flex;
  gap: 8px;
  height: 100%;
  min-height: 240px;
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
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  padding-right: 8px;
}
.st-tables-pane {
  flex: 1;
  min-width: 0;
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
.st-schemas-summary,
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
/* 右侧以表格形态呈现：固定表头 + 内容内部滚动（R1 §4.5）。 */
.st-table-head,
.st-table-item {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 6px;
}
.st-table-head {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--el-fill-color-blank, #fff);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.st-col-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.st-loading,
.st-empty,
.st-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
.st-schema-item.failed .st-schema-name {
  color: var(--el-color-danger);
}
.st-schema-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.st-schema-count,
.st-schema-error {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.st-schema-error {
  color: var(--el-color-danger);
}
.st-table-item {
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
