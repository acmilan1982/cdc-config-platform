<template>
  <div class="job-chain">
    <template v-if="chain.length === 0">
      <span class="chain-empty">--</span>
    </template>
    <template v-else>
      <div v-for="(node, idx) in chain" :key="idx" class="chain-node-wrap">
        <div class="chain-arrow" v-if="idx > 0">→</div>
        <div class="chain-node" :class="nodeClass(node)">
          <div class="chain-node-type">{{ node.nodeTypeLabel || node.nodeType }}</div>
          <div class="chain-job-id">
            <code>{{ node.jobId }}</code>
            <el-button link size="small" @click="copyId(node.jobId)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
          <el-tag v-if="node.hasAnomaly" type="danger" size="small">异常</el-tag>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { JobChainVO } from '@/types/jobFailure'

defineProps<{ chain: JobChainVO[] }>()

function nodeClass(node: JobChainVO): string {
  switch (node.nodeType) {
    case 'INITIAL': return 'chain-node--initial'
    case 'CURRENT': return 'chain-node--current'
    case 'FINAL': return 'chain-node--final'
    case 'INTERMEDIATE': return 'chain-node--intermediate'
    default: return ''
  }
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
.job-chain {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
}
.chain-empty {
  color: #909399;
}
.chain-arrow {
  font-size: 20px;
  color: #c0c4cc;
  margin: 8px 4px 0;
  flex-shrink: 0;
}
.chain-node-wrap {
  display: flex;
  align-items: flex-start;
}
.chain-node {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: #fafafa;
  min-width: 200px;
}
.chain-node--initial { border-left: 3px solid #e6a23c; }
.chain-node--intermediate { border-left: 3px solid #409eff; }
.chain-node--current { border-left: 3px solid #67c23a; }
.chain-node--final { border-left: 3px solid #67c23a; }
.chain-node-type {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.chain-job-id {
  display: flex;
  align-items: center;
  gap: 4px;
}
.chain-job-id code {
  font-size: 12px;
  color: #303133;
  word-break: break-all;
}
</style>
