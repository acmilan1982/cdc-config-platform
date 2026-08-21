<template>
  <div class="filter-area">
    <el-form :inline="true" size="small" class="filter-form" @submit.prevent>
      <el-form-item label="源库" class="field-item">
        <el-select
          v-model="form.sourceDataSourceIds"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          :disabled="dsDisabled"
          :placeholder="optionsError ? '数据源候选加载失败' : '请选择源库'"
          class="ds-select"
          @change="onSourceChange"
        >
          <el-option
            v-for="opt in sourceSelectOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="源表名" class="field-item">
        <el-input
          v-model="form.sourceTableName"
          placeholder="请输入完整表名，区分大小写"
          clearable
          :disabled="controlsDisabled"
          class="table-input"
        />
        <div v-if="sourceTableError" class="control-error">{{ sourceTableError }}</div>
      </el-form-item>

      <el-form-item label="目标库" class="field-item">
        <el-select
          v-model="form.targetDataSourceIds"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          :disabled="dsDisabled"
          :placeholder="optionsError ? '数据源候选加载失败' : '请选择目标库'"
          class="ds-select"
          @change="onTargetChange"
        >
          <el-option
            v-for="opt in targetSelectOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="目标表名" class="field-item">
        <el-input
          v-model="form.targetTableName"
          placeholder="请输入完整表名，区分大小写"
          clearable
          :disabled="controlsDisabled"
          class="table-input"
        />
        <div v-if="targetTableError" class="control-error">{{ targetTableError }}</div>
      </el-form-item>

      <el-form-item label="同步到目标库时间范围" class="field-item field-item--time">
        <el-date-picker
          v-model="timeRangeModel"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          :disabled="controlsDisabled"
          :clearable="!controlsDisabled"
          class="time-picker"
        />
        <div v-if="timeRangeError" class="control-error">{{ timeRangeError }}</div>
      </el-form-item>

      <el-form-item class="field-item field-item--actions">
        <template #label>
          <span class="action-label">&nbsp;</span>
        </template>
        <el-button type="primary" :loading="loading" :disabled="loading" @click="$emit('query')">
          <el-icon v-if="!loading"><Search /></el-icon>
          <span>查询</span>
        </el-button>
        <el-button :disabled="loading" @click="$emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>

    <div v-if="optionsError" class="options-error" role="alert">
      <el-icon><WarningFilled /></el-icon>
      <span>数据源候选加载失败：{{ optionsError }}</span>
      <el-button link type="primary" :disabled="optionsLoading" @click="$emit('retry-options')">
        {{ optionsLoading ? '正在重新加载…' : '重新加载' }}
      </el-button>
    </div>
    <div v-if="generalError" class="form-error" role="alert">{{ generalError }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search, WarningFilled } from '@element-plus/icons-vue'
import { ALL_DATA_SOURCE, parseDateTime } from '../composables/useLogQueryTab'
import type { LogQueryForm } from '../composables/useLogQueryTab'
import type { DataSourceOptionVO } from '@/types/logQuery'
import { normalizeSelection } from './selection'

defineOptions({ name: 'LogQueryFilter' })

const props = defineProps<{
  form: LogQueryForm
  validationError: string
  loading: boolean
  sourceOptions: DataSourceOptionVO[]
  targetOptions: DataSourceOptionVO[]
  optionsError: string
  optionsLoading: boolean
}>()

defineEmits<{
  query: []
  reset: []
  'retry-options': []
}>()

const DAY_SPAN_MS = 7 * 24 * 60 * 60 * 1000

interface SelectOption {
  value: string
  label: string
}

function buildOptions(list: DataSourceOptionVO[]): SelectOption[] {
  const nameCount = new Map<string, number>()
  for (const item of list) {
    const name = item.org?.trim() || ''
    nameCount.set(name, (nameCount.get(name) || 0) + 1)
  }
  return list.map((item) => {
    const name = item.org?.trim() || ''
    const display = name || '未定义名称'
    const showId = !name || (nameCount.get(name) || 0) > 1
    return { value: item.id, label: showId ? `${display}（${item.id}）` : display }
  })
}

const sourceSelectOptions = computed<SelectOption[]>(() => [
  { value: ALL_DATA_SOURCE, label: '全部' },
  ...buildOptions(props.sourceOptions),
])

const targetSelectOptions = computed<SelectOption[]>(() => [
  { value: ALL_DATA_SOURCE, label: '全部' },
  ...buildOptions(props.targetOptions),
])

const dsDisabled = computed(() => props.loading || props.optionsLoading || !!props.optionsError)
const controlsDisabled = computed(() => props.loading)

function onSourceChange(val: string[]) {
  props.form.sourceDataSourceIds = normalizeSelection(props.form.sourceDataSourceIds, val)
}

function onTargetChange(val: string[]) {
  props.form.targetDataSourceIds = normalizeSelection(props.form.targetDataSourceIds, val)
}

/**
 * 时间范围 v-model 代理：`value-format` 返回字符串数组；清空时返回 null。
 * 这里显式归一化，避免与 Element Plus 的 DateModelType 联合类型产生 strict 模板类型冲突。
 */
const timeRangeModel = computed({
  get: () => (props.form.timeRange ? [...props.form.timeRange] : null),
  set: (val: unknown) => {
    if (Array.isArray(val) && val.length === 2 && typeof val[0] === 'string' && typeof val[1] === 'string') {
      props.form.timeRange = [val[0], val[1]]
    } else {
      props.form.timeRange = null
    }
  },
})

const sourceTableError = computed(() =>
  props.form.sourceTableName.trim().length > 64 ? '源表名不能超过 64 个字符' : '',
)

const targetTableError = computed(() =>
  props.form.targetTableName.trim().length > 64 ? '目标表名不能超过 64 个字符' : '',
)

const timeRangeError = computed(() => {
  const range = props.form.timeRange
  if (!range || !range[0] || !range[1]) {
    return '同步到目标库时间范围必须填写开始与结束时间'
  }
  const start = parseDateTime(range[0])
  const end = parseDateTime(range[1])
  if (!start || !end) {
    return '同步到目标库时间范围必须填写开始与结束时间'
  }
  if (start.getTime() > end.getTime()) {
    return '开始时间不能晚于结束时间'
  }
  if (end.getTime() + 1000 - start.getTime() > DAY_SPAN_MS) {
    return '时间跨度超过 7 天，请缩小查询范围'
  }
  return ''
})

/** 兜底展示组合式状态机的校验结果（通常已被上方逐字段提示覆盖）。 */
const generalError = computed(() => {
  if (sourceTableError.value || targetTableError.value || timeRangeError.value) return ''
  return props.validationError
})
</script>

<style scoped>
.filter-area {
  background: var(--app-card-bg, #fafafa);
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 16px 4px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0 16px;
}

.filter-form :deep(.field-item) {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  margin-right: 0;
  margin-bottom: 10px;
  min-width: 0;
}

.filter-form :deep(.el-form-item__label) {
  justify-content: flex-start;
  line-height: 20px;
  padding-bottom: 4px;
  width: auto;
  text-align: left;
  color: #606266;
}

.filter-form :deep(.el-form-item__content) {
  line-height: normal;
  flex-wrap: wrap;
}

.field-item--actions {
  align-self: flex-end;
  margin-bottom: 10px;
}

.ds-select {
  width: 220px;
}

.table-input {
  width: 200px;
}

.time-picker {
  width: 380px;
}

.control-error {
  margin-top: 4px;
  font-size: 12px;
  line-height: 16px;
  color: #f56c6c;
}

.action-label {
  display: inline-block;
}

.options-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #e6a23c;
  padding-bottom: 10px;
}

.form-error {
  font-size: 12px;
  line-height: 16px;
  color: #f56c6c;
  padding-bottom: 10px;
}
</style>
