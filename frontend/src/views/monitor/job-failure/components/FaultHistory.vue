<template>
  <div>
    <el-table :data="historyData?.records ?? []" size="small" border style="width: 100%"
      highlight-current-row @row-click="onRowClick">
      <el-table-column label="故障根事件" width="100">
        <template #default="{ row }">
          <code class="cell-code">{{ row.faultRootId }}</code>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" width="160">
        <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="最后记录" width="160">
        <template #default="{ row }">{{ formatTime(row.lastRecordTime) }}</template>
      </el-table-column>
      <el-table-column prop="mainChainEventCount" label="主链事件" width="80" />
      <el-table-column prop="restartCount" label="重启" width="60" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.recordStatus)" size="small">
            {{ row.recordStatusLabel || row.recordStatus || '--' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结果" width="100">
        <template #default="{ row }">
          <el-tag :type="resultTagType(row.faultProcessResult)" size="small">
            {{ row.faultProcessResultLabel || row.faultProcessResult || '--' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startFailedJobId" label="起始失败 Job" min-width="180">
        <template #default="{ row }">
          <code class="cell-code">{{ row.startFailedJobId || '--' }}</code>
        </template>
      </el-table-column>
    </el-table>

    <div class="history-pagination" v-if="historyData && historyData.total > 0">
      <el-pagination
        :current-page="historyData.pageNum"
        :page-size="historyData.pageSize"
        :total="historyData.total"
        :page-sizes="[10, 20, 50]"
        layout="total, prev, pager, next, sizes"
        small
        @current-change="page = $event; load()"
        @size-change="pageSize = $event; page = 1; load()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchHistory } from '@/api/jobFailure'
import type { FaultProcessSummaryVO, PageResult } from '@/types/jobFailure'

const props = defineProps<{ clientId: string; dataSourceId: string }>()
const emit = defineEmits<{ select: [faultRootId: number] }>()

const historyData = ref<PageResult<FaultProcessSummaryVO> | null>(null)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)

async function load() {
  loading.value = true
  try {
    const res = await fetchHistory(props.clientId, props.dataSourceId, {
      pageNum: page.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      historyData.value = res.data
    }
  } finally {
    loading.value = false
  }
}

function onRowClick(row: FaultProcessSummaryVO) {
  emit('select', row.faultRootId)
}

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}

function statusTagType(status?: string | null): string {
  if (!status) return 'info'
  switch (status) {
    case 'RECOVERY_RECORDED': return 'success'
    case 'NOT_CLOSED': return 'warning'
    case 'DATA_ANOMALY': return 'danger'
    default: return 'info'
  }
}

function resultTagType(result?: string | null): string {
  return statusTagType(result)
}

onMounted(() => load())
</script>

<style scoped>
.history-pagination { margin-top: 12px; display: flex; justify-content: center; }
.cell-code { font-size: 12px; word-break: break-all; }
</style>
