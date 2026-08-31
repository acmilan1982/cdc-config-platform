<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '新增订阅' : '编辑订阅'"
    width="94vw"
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
        v-if="limitedEdit"
        type="warning"
        :closable="false"
        show-icon
        title="当前使用已保存源表配置，未完成源库实时校验"
        class="sf-banner"
      />
      <el-alert
        v-if="invalidTables.length > 0"
        type="warning"
        :closable="false"
        show-icon
        class="sf-banner"
      >
        <template #title>以下已选源表在当前源库中已不存在或不可访问：</template>
        <div class="sf-list">{{ invalidTables.join('、') }}</div>
      </el-alert>
      <el-alert
        v-if="rawUnparseableTables.length > 0"
        type="warning"
        :closable="false"
        show-icon
        class="sf-banner"
      >
        <template #title>以下源表片段无法解析，可能存在历史格式异常：</template>
        <div class="sf-list">{{ rawUnparseableTables.join('、') }}</div>
      </el-alert>
      <el-alert
        v-if="anomalyRefs.length > 0"
        type="warning"
        :closable="false"
        show-icon
        class="sf-banner"
      >
        <template #title>以下数据源已停用或不存在，保存前请更换：</template>
        <div class="sf-list">{{ anomalyRefs.join('、') }}</div>
      </el-alert>

      <el-form label-position="top" class="sf-form">
        <el-form-item label="订阅描述" required>
          <el-input
            v-model="form.dataSubDesc"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            placeholder="请输入订阅描述"
          />
        </el-form-item>

        <el-form-item label="源库" required>
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
              :disabled="isReservedCommaOrDot(s.dataSourceId)"
              :label="s.dataSourceId"
            >
              <div class="sf-source-option">
                <span class="sf-source-id">
                  <template v-for="(part, i) in highlightParts(s.dataSourceId, sourceKeyword)" :key="i">
                    <em v-if="part.match" class="sf-hl">{{ part.text }}</em>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </span>
                <span class="sf-source-org">{{ s.dataSourceOrg }}</span>
                <span v-if="isReservedCommaOrDot(s.dataSourceId)" class="sf-reserved">
                  名称含协议保留字符，不能用于订阅配置
                </span>
              </div>
            </el-option>
          </el-select>
          <div v-if="filteredSources.length === 0" class="sf-no-match">未找到匹配的源库</div>
        </el-form-item>

        <el-form-item label="目标库" required>
          <div class="sf-target-grid">
            <label
              v-for="target in options.targets"
              :key="target.dataSourceId"
              class="sf-target-card"
              :class="{
                selected: form.dataToSourceIds.includes(target.dataSourceId),
                disabled: isReservedCommaOrDot(target.dataSourceId),
              }"
              :title="isReservedCommaOrDot(target.dataSourceId)
                ? '名称含协议保留字符，不能用于订阅配置'
                : ''"
            >
              <el-checkbox
                :model-value="form.dataToSourceIds.includes(target.dataSourceId)"
                :disabled="isReservedCommaOrDot(target.dataSourceId)"
                @change="toggleTarget(target.dataSourceId)"
              />
              <div class="sf-target-info">
                <div class="sf-target-org">{{ target.dataSourceOrg }}</div>
                <div class="sf-target-id">{{ target.dataSourceId }}</div>
              </div>
              <el-icon v-if="form.dataToSourceIds.includes(target.dataSourceId)" class="sf-target-check">
                <Check />
              </el-icon>
            </label>
          </div>
        </el-form-item>

        <div class="sf-summary">{{ summaryText }}</div>

        <el-form-item label="源表" required>
          <SourceTableSelector
            :source-id="form.dataFromSourceId"
            v-model="form.selectedTables"
            :disabled="limitedEdit"
            :preload-schemas="preloadSchemas"
          />
        </el-form-item>

        <div v-if="validationErrors.length > 0" class="sf-validation">
          <div class="sf-validation-title">存在 {{ validationErrors.length }} 个校验失败项，请修正后重试：</div>
          <div v-for="(item, i) in validationErrors" :key="i" class="sf-validation-item">
            [{{ item.field }}] {{ item.name }}：{{ item.message }}
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <el-button :disabled="saving || editLoading" @click="onBeforeClose">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        :disabled="editLoading || editError !== null"
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
  SourceOptionVO,
  SubscriptionOptionsVO,
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

const { form, isDirty, reset, applyEcho, buildCreatePayload, buildUpdatePayload } =
  useSubscribeForm()

const editLoading = ref(false)
const editError = ref<string | null>(null)
const saving = ref(false)
const validationErrors = ref<ValidationErrorVO[]>([])
const sourceKeyword = ref('')
const preloadSchemas = ref<string[]>([])
const limitedEdit = ref(false)
const invalidTables = ref<string[]>([])
const rawUnparseableTables = ref<string[]>([])
const anomalyRefs = ref<string[]>([])

const filteredSources = computed<SourceOptionVO[]>(() =>
  filterSourceOptions(props.options.sources, sourceKeyword.value),
)

const summaryText = computed(() =>
  formatSelectionSummary(
    summarizeSelection(form.dataFromSourceId, form.selectedTables, form.dataToSourceIds),
  ),
)

function onSourceFilter(query: string) {
  sourceKeyword.value = query
}

function toggleTarget(targetId: string) {
  if (isReservedCommaOrDot(targetId)) return
  const idx = form.dataToSourceIds.indexOf(targetId)
  if (idx >= 0) {
    form.dataToSourceIds.splice(idx, 1)
  } else {
    form.dataToSourceIds.push(targetId)
  }
  validationErrors.value = []
}

function onSourceSelect(id: string) {
  if (limitedEdit.value || id === form.dataFromSourceId) return
  if (form.selectedTables.length > 0) {
    ElMessageBox.confirm('切换源库将清空当前已选择的源表，是否继续？', '提示', { type: 'warning' })
      .then(() => {
        form.dataFromSourceId = id
        form.selectedTables = []
        validationErrors.value = []
      })
      .catch(() => undefined)
  } else {
    form.dataFromSourceId = id
    validationErrors.value = []
  }
}

async function loadEdit() {
  if (!props.dataSubId) return
  editLoading.value = true
  editError.value = null
  validationErrors.value = []
  try {
    const res = await fetchSubscriptionEdit(props.dataSubId)
    if (res.code === 200) {
      applyEcho(res.data)
      limitedEdit.value =
        res.data.sourceReachable === false || res.data.sourceTableCheck === 'UNREACHABLE'
      invalidTables.value = res.data.invalidTables ?? []
      rawUnparseableTables.value = res.data.rawUnparseableTables ?? []
      const refs: string[] = []
      if (res.data.source.status !== 'NORMAL') {
        refs.push(`源库 ${describeRef(res.data.source)}（${refStatusLabel(res.data.source.status)}）`)
      }
      for (const t of res.data.targets) {
        if (t.status !== 'NORMAL') {
          refs.push(`目标库 ${describeRef(t)}（${refStatusLabel(t.status)}）`)
        }
      }
      anomalyRefs.value = refs
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
  margin-bottom: 12px;
}
.sf-list {
  font-size: 12px;
  margin-top: 4px;
  word-break: break-all;
}
.sf-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sf-source-select {
  width: 100%;
}
.sf-source-option {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sf-source-id {
  font-weight: 600;
}
.sf-source-org {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.sf-hl {
  font-style: normal;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.sf-reserved {
  color: var(--el-color-warning);
  font-size: 12px;
}
.sf-no-match {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.sf-target-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}
.sf-target-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 10px 12px;
  min-width: 200px;
  cursor: pointer;
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
}
.sf-target-org {
  font-size: 13px;
  font-weight: 600;
}
.sf-target-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.sf-target-check {
  margin-left: auto;
  color: var(--el-color-primary);
}
.sf-summary {
  margin: 2px 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
}
.sf-validation {
  border: 1px solid var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--el-color-danger);
  margin-bottom: 4px;
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
