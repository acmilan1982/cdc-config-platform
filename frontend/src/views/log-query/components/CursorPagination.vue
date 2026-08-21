<template>
  <div class="pagination-bar">
    <el-button size="small" :disabled="loading || !hasPrev" @click="$emit('prev')">
      <el-icon><ArrowLeft /></el-icon>
      <span>上一页</span>
    </el-button>
    <el-button size="small" :disabled="loading || !hasNext" @click="$emit('next')">
      <span>下一页</span>
      <el-icon><ArrowRight /></el-icon>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'CursorPagination' })

defineProps<{
  loading: boolean
  hasPrev: boolean
  hasNext: boolean
}>()

defineEmits<{
  prev: []
  next: []
}>()
</script>

<style scoped>
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  flex-shrink: 0;
}
</style>
