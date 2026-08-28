<template>
  <div class="config-value-editor">
    <!-- 不可编辑：原样展示，空值占位 -->
    <template v-if="!item.editable">
      <span class="raw-value">{{ displayRaw }}</span>
    </template>

    <!-- 可编辑：按 Key 类型渲染专门控件 -->
    <template v-else>
      <el-select
        v-if="meta?.type === 'boolean'"
        class="editor-control"
        :model-value="value"
        :disabled="disabled"
        placeholder="请选择"
        @update:model-value="emitValue($event)"
      >
        <el-option label="true" value="true" />
        <el-option label="false" value="false" />
      </el-select>

      <el-select
        v-else-if="meta?.type === 'enum'"
        class="editor-control"
        :model-value="value"
        :disabled="disabled"
        placeholder="请选择"
        @update:model-value="emitValue($event)"
      >
        <el-option v-for="opt in meta?.options ?? []" :key="opt" :label="opt" :value="opt" />
      </el-select>

      <el-select
        v-else-if="meta?.type === 'dbtypes'"
        class="editor-control"
        multiple
        :model-value="arrayValue"
        :disabled="disabled"
        placeholder="请选择数据库类型"
        @update:model-value="emitArray($event)"
      >
        <el-option v-for="db in DB_TYPE_ORDER" :key="db" :label="db" :value="db" />
      </el-select>

      <el-input
        v-else
        class="editor-control"
        :model-value="value"
        :disabled="disabled"
        placeholder="请输入整数（100~10000）"
        @input="emitInput($event)"
      />
    </template>

    <!-- 可编辑且当前值校验失败：内联错误提示（SC-UI-DESIGN-059） -->
    <div v-if="item.editable && invalidReason" class="invalid-hint">
      当前值无效：{{ invalidReason }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerConfigItemVO } from '@/types/serverConfig'
import { editorMeta, validateAndNormalize } from './configRules'

defineOptions({ name: 'ConfigValueEditor' })

const DB_TYPE_ORDER = ['doris', 'oracle', 'mysql']

const props = defineProps<{
  item: ServerConfigItemVO
  /** 当前展示值（编辑值优先，否则原始值）。 */
  value: string
  /** 保存中/阻断态等禁编辑场景：禁用全部可编辑控件（SC-UI-DESIGN-080/084）。 */
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const meta = computed(() => editorMeta(props.item.configKey))

const rawDisplay = props.item.configValue ?? ''

/** 不可编辑行原样展示值：空值占位 */
const displayRaw = rawDisplay === '' ? '（空值）' : rawDisplay

/** 当前展示值校验失败原因（空串表示合法） */
const invalidReason = computed(() => {
  const result = validateAndNormalize(props.item.configKey, props.value)
  return result.ok ? '' : (result.reason ?? '')
})

/** dbtypes 多选控件的数组形态（逗号字符串 ↔ 数组桥接） */
const arrayValue = computed(() => (props.value === '' ? [] : props.value.split(',')))

function emitValue(next: string) {
  emit('update:value', next)
}

function emitArray(next: string[]) {
  emit('update:value', next.join(','))
}

/** 整数输入：仅保留数字字符（SC-UI-DESIGN-055） */
function emitInput(next: string) {
  emit('update:value', next.replace(/[^0-9]/g, ''))
}
</script>

<style scoped>
.config-value-editor {
  width: 100%;
}

.editor-control {
  width: 100%;
}

.raw-value {
  color: var(--el-text-color-regular);
}

.invalid-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-color-danger);
}
</style>
