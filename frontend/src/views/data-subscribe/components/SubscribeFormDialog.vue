<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '新增订阅' : '编辑订阅'"
    destroy-on-close
    :close-on-click-modal="true"
    :before-close="onBeforeClose"
    class="subscribe-form-dialog"
    @opened="onDialogOpened"
  >
    <div v-if="editLoading" v-loading="true" class="sf-loading"></div>
    <div v-else-if="editError" class="sf-error">
      <el-alert type="error" :closable="false" :title="editError" show-icon />
      <el-button class="sf-retry" @click="loadEdit">重试</el-button>
    </div>
    <div v-else class="sf-body">
      <el-alert
        v-if="blockingReason"
        type="error"
        :closable="false"
        show-icon
        :title="blockingReason"
        class="sf-banner"
      />
      <el-alert
        v-if="limitedEdit"
        type="warning"
        :closable="false"
        show-icon
        title="当前使用已保存源表配置，源库暂不可连接，仅可修改描述与正常目标库"
        class="sf-banner"
      />
      <el-alert
        v-if="invalidTables.length > 0"
        type="warning"
        :closable="false"
        show-icon
        class="sf-banner"
      >
        <template #title>以下已选源表在当前源库中已不存在或不可访问，保存前必须移除：</template>
        <div class="sf-list">{{ invalidTables.join('、') }}</div>
        <el-button size="small" type="warning" plain class="sf-fix-invalid" @click="removeInvalidTables">
          移除异常已选表
        </el-button>
      </el-alert>
      <el-alert
        v-if="rawUnparseableTables.length > 0"
        type="warning"
        :closable="false"
        show-icon
        class="sf-banner"
      >
        <template #title>
          以下源表片段无法解析，存在历史格式异常；请重新选择有效源表，或直接维护数据库：
        </template>
        <div class="sf-list">{{ rawUnparseableTables.join('、') }}</div>
      </el-alert>

      <div class="sf-form">
        <el-form-item label="订阅描述" required class="sf-desc-item">
          <el-input
            v-model="form.dataSubDesc"
            maxlength="255"
            show-word-limit
            placeholder="请输入订阅描述（必填，最多 255 字符）"
            class="sf-desc-input"
          />
        </el-form-item>

        <div class="sf-top-row">
          <el-form-item label="源库" required class="sf-source-item">
            <el-select
              :model-value="form.dataFromSourceId"
              filterable
              :filter-method="onSourceFilter"
              :disabled="limitedEdit"
              placeholder="选择源库"
              class="sf-source-select"
              @update:model-value="onSourceSelect"
            >
              <el-option
                v-for="s in filteredSources"
                :key="s.dataSourceId"
                :value="s.dataSourceId"
                :disabled="sourceOptionDisabled(s)"
                :label="s.dataSourceOrg || s.dataSourceId"
              >
                <div class="sf-source-option" :class="{ selected: s.dataSourceId === form.dataFromSourceId }">
                  <span class="sf-source-org">
                    <template v-for="(part, i) in highlightParts(s.dataSourceOrg, sourceKeyword)" :key="`o${i}`">
                      <em v-if="part.match" class="sf-hl">{{ part.text }}</em>
                      <template v-else>{{ part.text }}</template>
                    </template>
                    <template v-if="s.dataSourceId === form.dataFromSourceId">
                      <el-icon class="sf-source-selected-icon"><Check /></el-icon>
                      <span class="sf-source-selected-text">已选择</span>
                    </template>
                  </span>
                  <span class="sf-source-id">
                    <template v-for="(part, i) in highlightParts(s.dataSourceId, sourceKeyword)" :key="`i${i}`">
                      <em v-if="part.match" class="sf-hl">{{ part.text }}</em>
                      <template v-else>{{ part.text }}</template>
                    </template>
                  </span>
                  <span v-if="s.abnormal" class="sf-source-status">{{ refStatusLabel(s.status) }}</span>
                  <span v-if="s.reserved" class="sf-reserved">名称含协议保留字符，不能用于订阅配置</span>
                </div>
              </el-option>
            </el-select>
            <div v-if="filteredSources.length === 0" class="sf-no-match">未找到匹配的源库</div>
          </el-form-item>

          <el-form-item label="目标库" required class="sf-target-item">
            <div class="sf-target-grid">
              <label
                v-for="t in displayTargets"
                :key="t.dataSourceId"
                class="sf-target-card"
                :class="{ selected: form.dataToSourceIds.includes(t.dataSourceId), disabled: t.reserved || t.abnormal }"
                :title="t.reserved ? '名称含协议保留字符，不能用于订阅配置' : ''"
              >
                <el-checkbox
                  :model-value="form.dataToSourceIds.includes(t.dataSourceId)"
                  :disabled="t.reserved || t.abnormal"
                  @change="toggleTarget(t.dataSourceId)"
                />
                <div class="sf-target-info">
                  <div class="sf-target-org" :title="t.dataSourceOrg">{{ t.dataSourceOrg }}</div>
                  <div class="sf-target-id" :title="t.dataSourceId">{{ t.dataSourceId }}</div>
                </div>
                <span v-if="t.abnormal" class="sf-target-status">{{ refStatusLabel(t.status) }}</span>
                <span v-else-if="t.reserved" class="sf-target-reserved">保留字符</span>
                <el-button
                  v-if="t.abnormal"
                  size="small"
                  text
                  type="danger"
                  class="sf-target-remove"
                  @click.stop="removeAbnormalTarget(t.dataSourceId)"
                >
                  移除
                </el-button>
              </label>
            </div>
          </el-form-item>
        </div>

        <div class="sf-summary">{{ summaryText }}</div>

        <el-form-item label="源表" required class="sf-tables-item">
          <div class="sf-tables-wrap">
            <SourceTableSelector
              :source-id="form.dataFromSourceId"
              v-model="form.selectedTables"
              :disabled="limitedEdit"
              :preload-schemas="preloadSchemas"
              class="sf-source-table-selector"
            />
          </div>
        </el-form-item>

        <div v-if="validationErrors.length > 0" class="sf-validation">
          <div class="sf-validation-title">存在 {{ validationErrors.length }} 个校验失败项，请修正后重试：</div>
          <div v-for="(item, i) in validationErrors" :key="i" class="sf-validation-item">
            [{{ item.field }}] {{ item.name }}：{{ item.message }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button :disabled="saving || editLoading" @click="onBeforeClose">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        :disabled="editLoading || editError !== null || !!blockingReason"
        @click="save"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import {
  createSubscription,
  fetchSubscriptionEdit,
  updateSubscription,
} from '@/api/subscription'
import type {
  DataSourceRefStatus,
  SourceOptionVO,
  SourceRefVO,
  SourceTableInput,
  SubscriptionOptionsVO,
  TargetRefVO,
  ValidationErrorVO,
  ValidationErrorsVO,
} from '@/types/subscription'
import { enableDialogDrag, type DialogDragController } from '@/views/data-source/draggableDialog'
import { useSubscribeForm } from '../composables/useSubscribeForm'
import {
  describeRef,
  filterSourceOptions,
  formatSelectionSummary,
  highlightParts,
  isReservedCommaOrDot,
  refStatusLabel,
  summarizeSelection,
  tableKey,
} from '../utils/subscriptionFormat'
import SourceTableSelector from './SourceTableSelector.vue'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  dataSubId: string | null
  options: SubscriptionOptionsVO
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', success: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const {
  form,
  isEditMode,
  sourceChanged,
  tablesChanged,
  isDirty,
  reset,
  applyEcho,
  buildCreatePayload,
  buildUpdatePayload,
} = useSubscribeForm()

const editLoading = ref(false)
const editError = ref<string | null>(null)
const saving = ref(false)
const validationErrors = ref<ValidationErrorVO[]>([])
const sourceKeyword = ref('')
const preloadSchemas = ref<string[]>([])
const limitedEdit = ref(false)
const invalidTables = ref<string[]>([])
const rawUnparseableTables = ref<string[]>([])
const echoSource = ref<SourceRefVO | null>(null)
const echoTargets = ref<TargetRefVO[]>([])

interface SourceDisplayOption extends SourceOptionVO {
  reserved: boolean
  abnormal: boolean
  status: DataSourceRefStatus
}

interface DisplayTarget {
  dataSourceId: string
  dataSourceOrg: string
  reserved: boolean
  abnormal: boolean
  status: DataSourceRefStatus
}

/** 维护候选 + 编辑回显中的异常源库（停用/不存在），保证异常源库显式可见并要求更换。 */
const selectableSources = computed<SourceDisplayOption[]>(() => {
  const list: SourceDisplayOption[] = props.options.sources.map((s) => ({
    ...s,
    reserved: isReservedCommaOrDot(s.dataSourceId),
    abnormal: false,
    status: 'NORMAL',
  }))
  const echo = echoSource.value
  if (isEditMode.value && echo) {
    const abnormal = echo.status !== 'NORMAL'
    const reserved = isReservedCommaOrDot(echo.dataSourceId)
    const existing = list.find((s) => s.dataSourceId === echo.dataSourceId)
    if (existing) {
      if (abnormal || reserved) {
        existing.abnormal = abnormal
        existing.status = echo.status
      }
    } else {
      list.push({
        dataSourceId: echo.dataSourceId,
        dataSourceOrg: echo.dataSourceOrg ?? echo.dataSourceId,
        reserved,
        abnormal,
        status: echo.status,
      })
    }
  }
  return list
})

const filteredSources = computed<SourceDisplayOption[]>(() =>
  filterSourceOptions(selectableSources.value, sourceKeyword.value),
)

/** 目标卡片：启用候选 + 编辑回显中的异常目标库（即使不在当前启用候选列表也显式回显）。 */
const displayTargets = computed<DisplayTarget[]>(() => {
  const list: DisplayTarget[] = props.options.targets.map((t) => ({
    dataSourceId: t.dataSourceId,
    dataSourceOrg: t.dataSourceOrg,
    reserved: isReservedCommaOrDot(t.dataSourceId),
    abnormal: false,
    status: 'NORMAL',
  }))
  const index = new Map(list.map((t) => [t.dataSourceId, t]))
  for (const t of echoTargets.value) {
    const existing = index.get(t.dataSourceId)
    if (existing) {
      if (t.status !== 'NORMAL' || isReservedCommaOrDot(t.dataSourceId)) {
        existing.abnormal = true
        existing.status = t.status
      }
      continue
    }
    const abnormal = t.status !== 'NORMAL' || isReservedCommaOrDot(t.dataSourceId)
    const item: DisplayTarget = {
      dataSourceId: t.dataSourceId,
      dataSourceOrg: t.dataSourceOrg ?? t.dataSourceId,
      reserved: isReservedCommaOrDot(t.dataSourceId),
      abnormal,
      status: t.status,
    }
    index.set(t.dataSourceId, item)
    list.push(item)
  }
  return list
})

const summaryText = computed(() =>
  formatSelectionSummary(
    summarizeSelection(form.dataFromSourceId, form.selectedTables, form.dataToSourceIds),
  ),
)

function sourceOptionDisabled(s: SourceDisplayOption): boolean {
  if (s.reserved) return true
  // 异常源库若仍是当前选择，禁止再次选中以强制更换
  if (s.abnormal && s.dataSourceId === form.dataFromSourceId) return true
  return false
}

function onSourceFilter(query: string) {
  sourceKeyword.value = query
}

function toggleTarget(targetId: string) {
  const item = displayTargets.value.find((t) => t.dataSourceId === targetId)
  if (item && (item.reserved || item.abnormal)) return
  const idx = form.dataToSourceIds.indexOf(targetId)
  if (idx >= 0) {
    form.dataToSourceIds.splice(idx, 1)
  } else {
    form.dataToSourceIds.push(targetId)
  }
  validationErrors.value = []
}

function removeAbnormalTarget(targetId: string) {
  const idx = form.dataToSourceIds.indexOf(targetId)
  if (idx >= 0) form.dataToSourceIds.splice(idx, 1)
  validationErrors.value = []
}

function onSourceSelect(id: string) {
  if (limitedEdit.value || id === form.dataFromSourceId) return
  const hasTables = form.selectedTables.length > 0
  const proceed = () => {
    form.dataFromSourceId = id
    form.selectedTables = []
    // 更换源库后旧源库的失效表/不可解析片段不再适用
    invalidTables.value = []
    rawUnparseableTables.value = []
    validationErrors.value = []
  }
  if (hasTables) {
    ElMessageBox.confirm('切换源库将清空当前已选择的源表，是否继续？', '提示', { type: 'warning' })
      .then(proceed)
      .catch(() => undefined)
  } else {
    proceed()
  }
}

function isInvalidMatch(entry: string, t: SourceTableInput): boolean {
  return tableKey(t.schemaName, t.tableName) === entry || t.tableName === entry
}

function removeInvalidTables() {
  if (invalidTables.value.length === 0) return
  const invalid = new Set(invalidTables.value)
  form.selectedTables = form.selectedTables.filter((t) => !invalid.has(tableKey(t.schemaName, t.tableName)) && !invalid.has(t.tableName))
  invalidTables.value = []
  validationErrors.value = []
}

// ---- 异常引用与失效源表：保存前必须修复（R1 §3.2）----

const abnormalSourceReason = computed<string | null>(() => {
  const id = form.dataFromSourceId
  if (!id) return null
  if (isReservedCommaOrDot(id)) return `源库 ${id} 名称含协议保留字符，请更换源库后保存`
  const echo = echoSource.value
  if (echo && echo.dataSourceId === id && echo.status !== 'NORMAL') {
    return `源库 ${describeRef(echo)} ${refStatusLabel(echo.status)}，请更换源库后保存`
  }
  return null
})

const abnormalTargetReasons = computed<string[]>(() => {
  const reasons: string[] = []
  for (const id of form.dataToSourceIds) {
    if (isReservedCommaOrDot(id)) {
      reasons.push(`目标库 ${id}（名称含协议保留字符）`)
      continue
    }
    const echo = echoTargets.value.find((t) => t.dataSourceId === id)
    if (echo && echo.status !== 'NORMAL') {
      reasons.push(`目标库 ${describeRef(echo)}（${refStatusLabel(echo.status)}）`)
    }
  }
  return reasons
})

/** 保存按钮禁用与点击后的本地校验共用同一判断（R1 §3.2.7）。 */
const blockingReason = computed<string | null>(() => {
  if (abnormalSourceReason.value) return abnormalSourceReason.value
  if (abnormalTargetReasons.value.length > 0) {
    return `存在异常目标库：${abnormalTargetReasons.value.join('、')}，请移除后保存`
  }
  if (invalidTables.value.length > 0) {
    return `存在 ${invalidTables.value.length} 个已失效的已选源表，请移除异常已选表后保存`
  }
  if (rawUnparseableTables.value.length > 0) {
    return '存在无法解析的源表片段，请重新选择有效源表，或直接维护数据库'
  }
  if (limitedEdit.value && (sourceChanged.value || tablesChanged.value)) {
    return '源库暂不可连接，仅可修改描述与正常目标库'
  }
  return null
})

async function loadEdit() {
  if (!props.dataSubId) return
  editLoading.value = true
  editError.value = null
  validationErrors.value = []
  try {
    const res = await fetchSubscriptionEdit(props.dataSubId)
    if (res.code === 200) {
      applyEcho(res.data)
      echoSource.value = res.data.source
      echoTargets.value = res.data.targets
      // 有限编辑仅适用：源库引用本身正常 + 源库暂时不可连接（R1 §3.2.6）
      limitedEdit.value =
        res.data.source.status === 'NORMAL' &&
        (res.data.sourceReachable === false || res.data.sourceTableCheck === 'UNREACHABLE')
      invalidTables.value = res.data.invalidTables ?? []
      rawUnparseableTables.value = res.data.rawUnparseableTables ?? []
      preloadSchemas.value = res.data.tablesBySchema.map((g) => g.schema)
    } else if (res.code === 40430) {
      ElMessage.warning(res.message)
      emit('saved', false)
      visible.value = false
    } else {
      editError.value = res.message
    }
  } catch (e) {
    editError.value =
      e && typeof e === 'object' && 'message' in e
        ? ((e as { message?: string }).message ?? '加载失败')
        : '加载失败'
  } finally {
    editLoading.value = false
  }
}

function validateLocal(): boolean {
  const errors: ValidationErrorVO[] = []
  if (!form.dataSubDesc.trim()) {
    errors.push({ errorCode: '40310', field: 'dataSubDesc', name: 'dataSubDesc', message: '订阅描述不能为空' })
  } else if (form.dataSubDesc.length > 255) {
    errors.push({ errorCode: '40311', field: 'dataSubDesc', name: 'dataSubDesc', message: '订阅描述超过 255 字符上限' })
  }
  if (!form.dataFromSourceId) {
    errors.push({ errorCode: '40312', field: 'dataFromSourceId', name: 'dataFromSourceId', message: '必须且只能选择一个源库' })
  }
  if (form.dataToSourceIds.length === 0) {
    errors.push({ errorCode: '40313', field: 'dataToSourceIds', name: 'dataToSourceIds', message: '必须至少选择一个目标库' })
  }
  if (form.selectedTables.length === 0) {
    errors.push({ errorCode: '40314', field: 'sourceTables', name: 'sourceTables', message: '必须至少选择一张源表' })
  }
  validationErrors.value = errors
  return errors.length === 0
}

function messageOf(e: unknown): string {
  return e && typeof e === 'object' && 'message' in e
    ? ((e as { message?: string }).message ?? '操作失败')
    : '操作失败'
}

async function save() {
  if (saving.value || editLoading.value || editError.value !== null) return
  if (blockingReason.value) {
    ElMessage.warning(blockingReason.value)
    return
  }
  if (!validateLocal()) return
  saving.value = true
  try {
    const res =
      props.mode === 'create'
        ? await createSubscription(buildCreatePayload())
        : await updateSubscription(props.dataSubId as string, buildUpdatePayload())
    if (res.code === 200) {
      emit('saved', true)
      visible.value = false
    } else if (res.code === 40300) {
      validationErrors.value = (res.data as unknown as ValidationErrorsVO)?.validationErrors ?? []
    } else if (res.code === 40430) {
      ElMessage.warning(res.message)
      emit('saved', false)
      visible.value = false
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error(messageOf(e))
  } finally {
    saving.value = false
  }
}

function onBeforeClose() {
  if (isDirty.value) {
    ElMessageBox.confirm('表单有未保存的修改，确定关闭吗？', '提示', { type: 'warning' })
      .then(() => {
        visible.value = false
      })
      .catch(() => undefined)
  } else {
    visible.value = false
  }
}

// ---- 标题栏拖动（仅标题栏可拖动、viewport 受限、重开居中）----
let dragController: DialogDragController | null = null

function onDialogOpened() {
  // 拖动绑定由 watch(visible) 统一处理
}

const dragStopWatch = watch(visible, async (value) => {
  if (value) {
    let el: HTMLElement | null = null
    for (let i = 0; i < 5 && !el; i++) {
      await nextTick()
      el = document.querySelector<HTMLElement>('.subscribe-form-dialog')
    }
    if (el) {
      dragController?.destroy()
      dragController = enableDialogDrag(el)
    }
  } else {
    dragController?.destroy()
    dragController = null
  }
})

onBeforeUnmount(() => {
  dragStopWatch()
  dragController?.destroy()
  dragController = null
})

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      if (props.mode === 'create') {
        reset('create')
      } else {
        reset('edit')
        loadEdit()
      }
      sourceKeyword.value = ''
      validationErrors.value = []
    }
  },
)
</script>

<style>
/* ---- 弹窗尺寸：桌面约 1280px，小屏退化，固定头尾、内容滚动（R1 §4.1）----
   非 scoped：class 通过 fallthrough 落在 el-dialog 内部节点，不含本组件 scoped id，
   scoped/:deep 选择器无法命中，故单独用全局样式块承载。.subscribe-form-dialog 为全局唯一类。 */
.subscribe-form-dialog {
  width: min(1280px, calc(100vw - 64px)) !important;
  height: min(82vh, calc(100vh - 48px)) !important;
  max-width: calc(100vw - 32px) !important;
  display: flex;
  flex-direction: column;
}
@media (max-width: 700px) {
  .subscribe-form-dialog {
    width: calc(100vw - 32px) !important;
  }
}
.subscribe-form-dialog .el-dialog__header {
  flex-shrink: 0;
  margin-right: 0;
  padding-bottom: 12px;
}
.subscribe-form-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px 20px 8px;
}
.subscribe-form-dialog .el-dialog__footer {
  flex-shrink: 0;
}
</style>

<style scoped>
.sf-loading {
  min-height: 300px;
}
.sf-error {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  min-height: 120px;
}
.sf-banner {
  flex-shrink: 0;
  margin-bottom: 8px;
}
.sf-list {
  font-size: 12px;
  margin-top: 4px;
  word-break: break-all;
}
.sf-fix-invalid {
  margin-top: 6px;
}
.sf-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.sf-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  flex: 1;
}
.sf-desc-item {
  flex-shrink: 0;
}
.sf-desc-input {
  width: 100%;
}
/* 源库 30%~35% + 目标库 65%~70% 同一行（R1 §4.3），放不下自动换行 */
.sf-top-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.sf-source-item {
  flex: 0 0 34%;
  min-width: 260px;
}
.sf-target-item {
  flex: 1 1 0;
  min-width: 0;
}
@media (max-width: 900px) {
  .sf-source-item,
  .sf-target-item {
    flex: 1 1 100%;
  }
}
.sf-source-select {
  width: 100%;
}
.sf-source-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.sf-source-option.selected {
  color: var(--el-color-primary);
}
.sf-source-org {
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sf-source-id {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sf-source-selected-icon,
.sf-source-selected-text {
  color: var(--el-color-primary);
  font-size: 12px;
  flex-shrink: 0;
}
.sf-source-status {
  color: var(--el-color-danger);
  font-size: 12px;
  flex-shrink: 0;
}
.sf-hl {
  font-style: normal;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.sf-reserved {
  color: var(--el-color-warning);
  font-size: 12px;
  flex-shrink: 0;
}
.sf-no-match {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
/* 目标库紧凑小卡片：高 44px、宽度自适应、间距 8px、唯一勾选控件为左侧复选框（R1 §4.4） */
.sf-target-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
.sf-target-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  box-sizing: border-box;
  min-width: 0;
  max-width: 220px;
  transition: border-color 0.2s, background 0.2s;
}
.sf-target-card.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.sf-target-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.sf-target-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.sf-target-org {
  font-size: 13px;
  font-weight: 600;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sf-target-id {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sf-target-status {
  color: var(--el-color-danger);
  font-size: 11px;
  flex-shrink: 0;
}
.sf-target-reserved {
  color: var(--el-color-warning);
  font-size: 11px;
  flex-shrink: 0;
}
.sf-target-remove {
  flex-shrink: 0;
  margin-left: auto;
}
.sf-summary {
  margin: 2px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.sf-tables-item {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.sf-tables-item :deep(.el-form-item__content) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.sf-tables-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.sf-source-table-selector {
  flex: 1;
  min-height: 0;
}
.sf-validation {
  border: 1px solid var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--el-color-danger);
  margin-bottom: 4px;
  flex-shrink: 0;
}
.sf-validation-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.sf-validation-item {
  line-height: 1.6;
  word-break: break-all;
}
</style>
