<template>
  <div class="job-chain-wrapper">
    <el-scrollbar class="chain-scrollbar">
      <div class="job-chain" v-if="chain.length > 0">
        <div v-for="(node, idx) in chain" :key="idx" class="chain-node-wrap">
          <span v-if="idx > 0" class="chain-arrow">
            <el-icon><ArrowRight /></el-icon>
          </span>
          <el-tooltip :content="node.jobId" placement="top" :hide-after="0">
            <div class="chain-node" :class="nodeColorClass(idx)">
              <span class="chain-node-type">{{ node.nodeTypeLabel || node.nodeType }}</span>
              <span class="chain-job-id">{{ node.jobId }}</span>
              <el-button link size="small" class="chain-copy" @click.stop="copyId(node.jobId)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
          </el-tooltip>
        </div>
      </div>
      <span v-else class="chain-empty">--</span>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ArrowRight, CopyDocument } from '@element-plus/icons-vue'
import type { JobChainVO } from '@/types/jobFailure'

const props = defineProps<{
  chain: JobChainVO[]
  recovered: boolean
}>()

function nodeColorClass(idx: number): string {
  const isLast = idx === props.chain.length - 1
  if (isLast && props.recovered) return 'chain-node--success'
  return 'chain-node--failed'
}

async function copyId(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败')
  }
}
</script>

<style scoped>
.job-chain-wrapper {
  width: 100%;
}
.chain-scrollbar {
  white-space: nowrap;
}
.job-chain {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 4px 0 20px 0;
}
.chain-empty {
  color: #909399;
  font-size: 14px;
}
.chain-node-wrap {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
.chain-arrow {
  display: flex;
  align-items: center;
  color: #c0c4cc;
  font-size: 18px;
  margin: 0 6px;
  flex-shrink: 0;
}
.chain-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 2px solid #e4e7ed;
  background: #fafafa;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: default;
}
.chain-node--failed {
  border-color: #f56c6c;
  background: #fef0f0;
}
.chain-node--success {
  border-color: #67c23a;
  background: #f0f9eb;
}
.chain-node-type {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}
.chain-job-id {
  font-size: 13px;
  font-family: monospace;
  color: #303133;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chain-copy {
  flex-shrink: 0;
  padding: 0;
}
</style>
