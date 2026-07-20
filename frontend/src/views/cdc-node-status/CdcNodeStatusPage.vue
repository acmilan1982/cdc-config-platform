<template>
  <div class="cdc-node-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">CDC 节点状态</h2>
        <template v-if="!loading && data">
          <el-tag size="small" type="info" class="stat-tag">客户端 {{ data.clients.length }}</el-tag>
          <el-tag size="small" :type="onlineCount > 0 ? 'success' : 'info'" class="stat-tag">在线 {{ onlineCount }}</el-tag>
          <el-tag size="small" :type="offlineCount > 0 ? 'danger' : 'info'" class="stat-tag">离线 {{ offlineCount }}</el-tag>
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
  /* fills content area width, no fixed max-width */
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-tag {
  font-size: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.refresh-label {
  font-size: 13px;
  color: #606266;
}

.last-refresh {
  font-size: 12px;
  color: #c0c4cc;
}

.global-alert {
  margin-bottom: 12px;
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
  color: #909399;
}
</style>
