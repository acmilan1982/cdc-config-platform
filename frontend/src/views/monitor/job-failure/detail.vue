<template>
  <div class="detail-page">
    <!-- Page header -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">故障过程详情</h2>
        <el-tooltip v-if="detail" :content="rootEventIdText" placement="top" :show-after="300">
          <el-tag size="small" type="info" class="root-event-tag">
            根事件 {{ rootEventIdShort }}
            <el-button
              link
              size="small"
              class="root-event-copy"
              aria-label="复制根事件 ID"
              @click.stop="copyRootEventId"
            >
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </el-tag>
        </el-tooltip>
      </div>
      <div class="toolbar-right">
        <el-button size="small" @click="loadDetail" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !detail" class="state-box">
      <el-icon class="is-loading" :size="28"><Loading /></el-icon>
      <p>正在加载...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="state-box">
      <el-empty :description="errorMsg">
        <el-button type="primary" @click="loadDetail">重试</el-button>
      </el-empty>
    </div>

    <template v-else-if="detail">
      <!-- Anomaly alerts -->
      <el-alert
        v-for="(a, idx) in detail.anomalies"
        :key="idx"
        :title="a.typeLabel || a.type"
        :description="a.description"
        type="warning"
        :closable="false"
        show-icon
        class="detail-alert"
      />

      <!-- Section: Overview -->
      <el-card shadow="never" class="detail-section">
        <template #header><span class="section-title">概览</span></template>
        <FaultProcessOverview :detail="detail" />
      </el-card>

      <!-- Section: Physical Job Chain -->
      <el-card shadow="never" class="detail-section">
        <template #header><span class="section-title">物理 Job 链</span></template>
        <PhysicalJobChain :chain="detail.jobChain" :recovered="detail.recordStatus === 'RECOVERY_RECORDED'" />
      </el-card>

      <!-- Section: Main Chain Events -->
      <el-card shadow="never" class="detail-section">
        <template #header><span class="section-title">主链事件</span></template>
        <FailureEventList
          :events="detail.mainChainEvents"
          @view-detail="(eventId: number) => openClob('FAILURE_EVENT_FAILURE_DETAIL', eventId)"
        />
      </el-card>

      <!-- Section: Excluded Events (if any) -->
      <el-card v-if="detail.excludedEvents.length > 0" shadow="never" class="detail-section">
        <template #header><span class="section-title">排除事件</span></template>
        <FailureEventList
          :events="detail.excludedEvents"
          @view-detail="(eventId: number) => openClob('FAILURE_EVENT_FAILURE_DETAIL', eventId)"
        />
      </el-card>

      <!-- Section: Processing (Restart Cards) -->
      <el-card shadow="never" class="detail-section">
        <template #header><span class="section-title">处理过程</span></template>
        <RestartCards
          :timeline="detail.handleTimeline"
          :job-chain="detail.jobChain"
          @view-error="(logId: number) => openClob('FAILURE_HANDLE_LOG_ERROR_DETAIL', logId)"
        />
      </el-card>

      <!-- Section: Fault History -->
      <el-card shadow="never" class="detail-section">
        <template #header><span class="section-title">历史故障过程</span></template>
        <FaultHistory
          :client-id="detail.clientId"
          :data-source-id="detail.dataSourceId"
          :current-fault-root-id="detail.faultRootId"
          @select="switchProcess"
        />
      </el-card>
    </template>

    <!-- CLOB Dialog -->
    <ClobDetailDialog
      v-model:visible="clobVisible"
      :fault-root-id="currentFaultRootId"
      :clob-field="clobField"
      :record-id="clobRecordId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, CopyDocument } from '@element-plus/icons-vue'
import { fetchLatestFault, fetchProcessDetail } from '@/api/jobFailure'
import type { FaultProcessDetailVO } from '@/types/jobFailure'

import FaultProcessOverview from './components/FaultProcessOverview.vue'
import PhysicalJobChain from './components/PhysicalJobChain.vue'
import FailureEventList from './components/FailureEventList.vue'
import RestartCards from './components/RestartCards.vue'
import FaultHistory from './components/FaultHistory.vue'
import ClobDetailDialog from './components/ClobDetailDialog.vue'

const route = useRoute()

const detail = ref<FaultProcessDetailVO | null>(null)
const loading = ref(true)
const errorMsg = ref('')

const clobVisible = ref(false)
const clobField = ref('FAILURE_EVENT_FAILURE_DETAIL')
const clobRecordId = ref<number | null>(null)
const currentFaultRootId = ref<number | null>(null)

const rootEventIdText = computed(() => {
  const d = detail.value
  if (!d) return ''
  if (d.faultRootIdText) return d.faultRootIdText
  return d.faultRootId != null ? String(d.faultRootId) : ''
})

const rootEventIdShort = computed(() => ellipsisId(rootEventIdText.value))

function ellipsisId(text: string): string {
  if (text.length <= 10) return text
  return text.slice(0, 6) + '…' + text.slice(-4)
}

async function copyRootEventId() {
  try {
    await navigator.clipboard.writeText(rootEventIdText.value)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败')
  }
}

function openClob(field: string, recordId: number) {
  clobField.value = field
  clobRecordId.value = recordId
  currentFaultRootId.value = detail.value?.faultRootId ?? null
  clobVisible.value = true
}

async function loadDetail() {
  const clientId = route.query.clientId as string
  const dataSourceId = route.query.dataSourceId as string
  if (!clientId || !dataSourceId) {
    errorMsg.value = '缺少 clientId 或 dataSourceId 参数'
    loading.value = false
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetchLatestFault(clientId, dataSourceId)
    if (res.code === 200) {
      detail.value = res.data
      currentFaultRootId.value = res.data.faultRootId
    } else {
      errorMsg.value = res.message || '加载失败'
    }
  } catch {
    errorMsg.value = '网络请求失败'
  } finally {
    loading.value = false
  }
}

async function switchProcess(faultRootId: number) {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetchProcessDetail(faultRootId)
    if (res.code === 200) {
      detail.value = res.data
      currentFaultRootId.value = res.data.faultRootId
    } else {
      ElMessage.warning(res.message || '加载失败')
    }
  } catch {
    ElMessage.warning('网络请求失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => loadDetail())
</script>

<style scoped>
.detail-page {
  min-height: 100%;
  padding: 16px;
  max-width: 1200px;
}
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar-left { display: flex; align-items: baseline; gap: 12px; }
.page-title { margin: 0; font-size: 18px; font-weight: 600; color: #303133; }
.root-event-tag { display: inline-flex; align-items: center; gap: 2px; }
.root-event-copy { padding: 0; margin-left: 2px; font-size: 12px; }
.toolbar-right { display: flex; align-items: center; }
.detail-section { margin-bottom: 16px; }
.detail-alert { margin-bottom: 12px; }
.section-title { font-size: 15px; font-weight: 600; color: #303133; }
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #909399;
}
</style>
