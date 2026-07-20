<template>
  <div class="cdc-node-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">CDC 节点状态</h2>
        <template v-if="!loading && data">
          <el-tag size="small" class="stat-tag summary-tag--total">客户端 {{ data.clients.length }}</el-tag>
          <el-tag size="small" class="stat-tag summary-tag--online">在线 {{ onlineCount }}</el-tag>
          <el-tag size="small" class="stat-tag summary-tag--offline">离线 {{ offlineCount }}</el-tag>
        </template>
      </div>
      <div class="toolbar-right">
        <span class="refresh-label">自动刷新:</span>
        <el-select v-model="refreshInterval" size="small" style="width: 100px" @change="resetTimer">
          <el-option :value="10" label="10 秒" />
          <el-option :value="30" label="30 秒" />
          <el-option :value="60" label="60 秒" />
        </el-select>
        <span v-if="lastRefreshedAt" class="last-refresh">最后刷新: {{ lastRefreshedAt }}</span>
        <el-button size="small" type="primary" :loading="refreshing" :disabled="refreshing" @click="manualRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- ZK Health alert -->
    <el-alert
      v-if="zkDisconnected"
      title="ZooKeeper 连接失败，数据可能不是最新"
      type="error"
      :closable="false"
      show-icon
      class="global-alert"
    />

    <!-- Partial failure alert -->
    <el-alert
      v-if="data?.partialFailure"
      :title="'部分节点读取失败: ' + (data.warnings?.join('; ') || '未知错误')"
      type="warning"
      :closable="false"
      show-icon
      class="global-alert"
    />

    <!-- Loading -->
    <div v-if="loading && !data" class="state-box">
      <el-icon class="is-loading" :size="28"><Loading /></el-icon>
      <p>正在加载...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="data && data.clients.length === 0 && !loading" class="state-box">
      <el-empty description="暂无客户端数据" />
    </div>

    <!-- Error (no data) -->
    <div v-else-if="error && !data" class="state-box">
      <el-empty description="数据加载失败">
        <el-button type="primary" @click="manualRefresh">重试</el-button>
      </el-empty>
    </div>

    <!-- Client cards grid -->
    <div class="client-grid">
      <ClientCard
        v-for="client in sortedClients"
        :key="client.clientName"
        :client="client"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Loading } from '@element-plus/icons-vue'
import ClientCard from '@/components/monitor/ClientCard.vue'
import { fetchClients, fetchZkHealth } from '@/api/monitor'
import type { ZooKeeperClientMonitorResponse, ZooKeeperClientVO } from '@/types/monitor'

const data = ref<ZooKeeperClientMonitorResponse | null>(null)
const loading = ref(true)
const refreshing = ref(false)
const error = ref(false)
const zkDisconnected = ref(false)
const lastRefreshedAt = ref('')
const refreshInterval = ref(10)
let timer: ReturnType<typeof setInterval> | null = null
let requestId = 0

const onlineCount = computed(() => data.value?.clients.filter((c: ZooKeeperClientVO) => c.online).length ?? 0)
const offlineCount = computed(() => data.value ? data.value.clients.length - onlineCount.value : 0)

const sortedClients = computed<ZooKeeperClientVO[]>(() => {
  if (!data.value) return []
  return [...data.value.clients].sort((a, b) => a.clientName.localeCompare(b.clientName))
})

async function loadData() {
  const id = ++requestId
  try {
    const res = await fetchClients()
    if (id !== requestId) return
    if (res.code === 200) {
      data.value = res.data
      error.value = false
      lastRefreshedAt.value = res.data.refreshedAt || formatNow()
    } else {
      if (!data.value) error.value = true
      ElMessage.warning(res.message || '请求失败')
    }
  } catch {
    if (id !== requestId) return
    if (!data.value) error.value = true
    ElMessage.warning('数据加载失败，保留上次数据')
  }
}

async function manualRefresh() {
  refreshing.value = true
  await loadData()
  refreshing.value = false
}

function resetTimer() {
  stopTimer()
  startTimer()
}

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (!refreshing.value) {
      loadData()
    }
  }, refreshInterval.value * 1000)
}

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

async function checkHealth() {
  try {
    const res = await fetchZkHealth()
    if (res.code === 200) {
      zkDisconnected.value = !res.data.connected
    }
  } catch {
    zkDisconnected.value = true
  }
}

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(async () => {
  await checkHealth()
  await loadData()
  loading.value = false
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.cdc-node-page {
  --zk-text: #0F172A;
  --zk-muted: #64748B;

  font-family:
    Inter,
    Roboto,
    "PingFang SC",
    "Microsoft YaHei",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  min-height: 100%;
  padding: 16px;

  background:
    radial-gradient(circle at 12% 18%, rgba(99, 102, 241, 0.08), transparent 28%),
    radial-gradient(circle at 88% 12%, rgba(56, 189, 248, 0.10), transparent 30%),
    linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 55%, #EEF2FF 100%);

  /* Page-level glass wrapper */
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.94); /* fallback */
}

@supports (backdrop-filter: blur(10px)) {
  .cdc-node-page {
    background-color: transparent;
  }
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
}

@supports not (backdrop-filter: blur(10px)) {
  .page-toolbar {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(226, 232, 240, 0.65);
  }
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--zk-text);
}

/* Stat tags: glass pill/capsule style */
.stat-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.summary-tag--total {
  background: rgba(243, 244, 246, 0.72);
  border: 1px solid rgba(209, 213, 219, 0.45);
  color: #4B5563;
}
.summary-tag--online {
  background: rgba(236, 253, 245, 0.72);
  border: 1px solid rgba(167, 243, 208, 0.45);
  color: #059669;
}
.summary-tag--offline {
  background: rgba(254, 242, 242, 0.72);
  border: 1px solid rgba(254, 202, 202, 0.45);
  color: #DC2626;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.refresh-label {
  font-size: 13px;
  color: var(--zk-muted);
}

.last-refresh {
  font-size: 12px;
  color: #94A3B8;
}

.global-alert {
  margin-bottom: 12px;
}

/* Refresh button: sky blue glass */
.cdc-node-page :deep(.el-button--primary) {
  --el-button-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-hover-bg-color: transparent;
  --el-button-hover-border-color: transparent;

  background: linear-gradient(135deg, rgba(56, 189, 248, 0.95), rgba(37, 99, 235, 0.92));
  border: none;
  border-radius: 11px;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18);
  color: #fff;
  font-weight: 500;
  transition: all 0.2s ease;
}
.cdc-node-page :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, rgba(14, 165, 233, 1), rgba(29, 78, 216, 1));
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.26);
}
.cdc-node-page :deep(.el-button--primary:active) {
  transform: scale(0.97);
}
.cdc-node-page :deep(.el-button--primary.is-loading),
.cdc-node-page :deep(.el-button--primary.is-disabled) {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.60), rgba(37, 99, 235, 0.55));
  box-shadow: none;
}

/* Select dropdown */
.cdc-node-page :deep(.el-select .el-input__wrapper) {
  border-color: rgba(226, 232, 240, 0.65);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}
.cdc-node-page :deep(.el-select .el-input.is-focus .el-input__wrapper) {
  border-color: #38BDF8;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.35) inset;
}

.client-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1500px) {
  .client-grid {
    grid-template-columns: 1fr;
  }
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--zk-muted);
}
</style>
