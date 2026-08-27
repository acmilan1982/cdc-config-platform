<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="确认保存"
    width="640px"
    top="8vh"
    destroy-on-close
  >
    <p class="confirm-tip">即将保存以下配置项修改：</p>
    <el-table :data="changes" size="small" border class="confirm-table">
      <el-table-column label="配置项" min-width="180">
        <template #default="{ row }">
          <span class="change-name">{{ row.displayName }}</span>
          <el-tooltip v-if="row.configKey" :content="row.configKey" placement="top">
            <el-icon class="key-icon" :size="14"><InfoFilled /></el-icon>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="原值" min-width="140">
        <template #default="{ row }">
          <span class="change-from">{{ row.fromRaw === '' ? '（空值）' : row.fromRaw }}</span>
        </template>
      </el-table-column>
      <el-table-column label="新值" min-width="140">
        <template #default="{ row }">
          <span class="change-to">{{ row.toValue }}</span>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="$emit('confirm')">确认保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
import type { SaveChange } from './types'

defineOptions({ name: 'SaveConfirmDialog' })

defineProps<{
  visible: boolean
  changes: SaveChange[]
}>()

defineEmits<{
  'update:visible': [val: boolean]
  confirm: []
}>()
</script>

<style scoped>
.confirm-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.confirm-table {
  width: 100%;
}

.change-name {
  color: var(--el-text-color-primary);
}

.key-icon {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
  cursor: help;
  vertical-align: middle;
}

.change-from {
  color: var(--el-text-color-secondary);
}

.change-to {
  color: var(--el-color-primary);
}
</style>
