<template>
  <div class="server-config-page">
    <!-- 首次加载 -->
    <div v-if="loading && !page" class="page-state">
      <el-icon class="is-loading" :size="22"><Loading /></el-icon>
      <p>正在加载中心端配置…</p>
    </div>

    <!-- 中心端未注册（40210） -->
    <div v-else-if="loadError && loadError.code === 40210" class="page-state">
      <el-icon class="state-icon"><WarningFilled /></el-icon>
      <p class="state-text">中心端尚未注册</p>
      <p class="state-desc">请先启动 sync-server，使唯一中心端完成注册后再查看配置。</p>
    </div>

    <!-- 检测到多个中心端（40211） -->
    <div v-else-if="loadError && loadError.code === 40211" class="page-state">
      <el-icon class="state-icon"><WarningFilled /></el-icon>
      <p class="state-text">检测到多个中心端</p>
      <p class="state-desc">当前功能仅支持唯一中心端，请联系管理员确认中心端部署情况。</p>
    </div>

    <!-- 加载失败（网络/其他业务错误） -->
    <div v-else-if="loadError && !page" class="page-state">
      <el-icon class="state-icon"><WarningFilled /></el-icon>
      <p class="state-text">配置加载失败</p>
      <p class="state-desc">{{ loadError.message }}</p>
      <el-button size="small" type="primary" @click="loadPage">重试</el-button>
    </div>

    <!-- 成功：卡片 + 两列表格 -->
    <el-card v-else-if="page" class="config-card" v-loading="loading">
      <div class="card-header">
        <div class="header-left">
          <span class="header-item">中心端 ID：{{ page.serverId }}</span>
          <span class="header-item">配置项总数：{{ page.configCount }}</span>
          <span v-if="hasDirty" class="dirty-hint">存在未保存的修改</span>
        </div>
      </div>

      <!-- 保存成功但重载失败（SAVE_SUCCEEDED_RELOAD_FAILED：禁用编辑与保存，仅可重试加载，SC-DESIGN-067） -->
      <div v-if="reloadFailedAfterSave" class="save-reload-error">
        保存成功，但最新配置加载失败，请重试加载{{ reloadFailedMessage ? `：${reloadFailedMessage}` : '' }}
        <el-button size="small" class="retry-load-btn" @click="reloadAfterSave">重试加载</el-button>
      </div>

      <!-- 保存失败：保留修改 -->
      <div v-if="saveError" class="save-error">
        保存失败：{{ saveError }}
      </div>

      <el-table :data="page.items" class="config-table" empty-text="暂无配置项">
        <el-table-column label="配置项说明" min-width="240">
          <template #default="{ row }">
            <span class="item-name">{{ getDisplayName(row.configDesc, row.configKey) }}</span>
            <el-tooltip v-if="row.configKey" :content="row.configKey" placement="top">
              <el-icon class="key-icon" :size="14"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="配置值" width="360" min-width="300">
          <template #default="{ row }">
            <ConfigValueEditor
              :item="row"
              :value="editValue(row)"
              :disabled="controlsDisabled"
              @update:value="onEdit(row.idServerConfig, $event)"
            />
          </template>
        </el-table-column>
      </el-table>

      <div class="card-actions">
        <el-button :disabled="!canRevert" @click="revert">撤销修改</el-button>
        <el-button type="primary" :disabled="!canSave" @click="openConfirm">
          {{ saving ? '保存中…' : '保存全部' }}
        </el-button>
      </div>
    </el-card>

    <SaveConfirmDialog
      :visible="confirmVisible"
      :changes="changes"
      @update:visible="confirmVisible = $event"
      @confirm="doSave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { InfoFilled, Loading, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fetchServerConfigPage, saveServerConfig } from '@/api/serverConfig'
import type { ServerConfigItemVO, ServerConfigPageVO } from '@/types/serverConfig'
import ConfigValueEditor from './ConfigValueEditor.vue'
import SaveConfirmDialog from './SaveConfirmDialog.vue'
import { canonicalOrNull, getDisplayName, validateAndNormalize } from './configRules'
import type { SaveChange } from './types'

const page = ref<ServerConfigPageVO | null>(null)
const loading = ref(false)
const loadError = ref<{ code: number; message: string } | null>(null)

/** 当前编辑值（仅含未保存的修改），key 为 idServerConfig，value 为用户输入原样值。 */
const edits = ref<Record<string, string>>({})

const saving = ref(false)
const saveError = ref('')
const reloadFailedAfterSave = ref(false)
const reloadFailedMessage = ref('')
const confirmVisible = ref(false)

const itemById = (id: string): ServerConfigItemVO | undefined =>
  page.value?.items.find((i) => i.idServerConfig === id)

const editValue = (item: ServerConfigItemVO): string =>
  edits.value[item.idServerConfig] ?? item.configValue ?? ''

function sameValue(item: ServerConfigItemVO, edit: string): boolean {
  const cEdit = canonicalOrNull(item.configKey, edit)
  const cRaw = canonicalOrNull(item.configKey, item.configValue)
  if (cEdit !== null && cRaw !== null) {
    return cEdit === cRaw
  }
  return edit === (item.configValue ?? '')
}

const isDirtyItem = (item: ServerConfigItemVO): boolean => {
  const edit = edits.value[item.idServerConfig]
  if (edit === undefined) {
    return false
  }
  return !sameValue(item, edit)
}

const dirtyItems = computed<ServerConfigItemVO[]>(
  () => page.value?.items.filter(isDirtyItem) ?? [],
)

const hasDirty = computed(() => dirtyItems.value.length > 0)

const hasInvalid = computed(() => {
  for (const item of page.value?.items ?? []) {
    if (!item.editable) {
      continue
    }
    if (!validateAndNormalize(item.configKey, editValue(item)).ok) {
      return true
    }
  }
  return false
})

const canSave = computed(
  () => hasDirty.value && !hasInvalid.value && !saving.value && !reloadFailedAfterSave.value,
)

const canRevert = computed(
  () => hasDirty.value && !saving.value && !reloadFailedAfterSave.value,
)

/** 保存中或保存成功但重载失败阻断态：禁用全部编辑控件（SC-UI-DESIGN-080/084）。 */
const controlsDisabled = computed(() => saving.value || reloadFailedAfterSave.value)

const changes = computed<SaveChange[]>(() =>
  dirtyItems.value.map((item) => {
    const edit = editValue(item)
    return {
      idServerConfig: item.idServerConfig,
      displayName: getDisplayName(item.configDesc, item.configKey),
      configKey: item.configKey ?? null,
      fromRaw: item.configValue ?? '',
      toValue: canonicalOrNull(item.configKey, edit) ?? edit,
    }
  }),
)

function onEdit(id: string, value: string) {
  // 保存中或重载失败阻断态不得改变编辑状态（不依赖 DOM disabled 的防御性守卫）。
  if (saving.value || reloadFailedAfterSave.value) {
    return
  }
  const item = itemById(id)
  if (!item) {
    return
  }
  if (sameValue(item, value)) {
    delete edits.value[id]
  } else {
    edits.value[id] = value
  }
}

function revert() {
  if (saving.value || reloadFailedAfterSave.value) {
    return
  }
  edits.value = {}
}

function openConfirm() {
  if (!canSave.value) {
    return
  }
  confirmVisible.value = true
}

async function loadPage() {
  loading.value = true
  loadError.value = null
  reloadFailedAfterSave.value = false
  reloadFailedMessage.value = ''
  try {
    const res = await fetchServerConfigPage()
    if (res.code === 200) {
      page.value = res.data
      edits.value = {}
    } else {
      loadError.value = { code: res.code, message: res.message || '加载失败' }
    }
  } catch (e) {
    loadError.value = { code: 0, message: resolveHttpMessage(e) }
  } finally {
    loading.value = false
  }
}

/**
 * 保存成功后的重载/重试（SC-DESIGN-067 / SC-UI-DESIGN-084，仅 GET）。
 * 与首次/普通 loadPage 分离：开始与失败期间不提前清除 SAVE_SUCCEEDED_RELOAD_FAILED 阻断态，
 * 仅 GET 成功且 code=200 才清除并重建原始值；任何 HTTP/网络/业务失败均保持该状态并更新消息，
 * 从不设置 loadError（避免切到普通加载失败页），从不触发 POST。
 */
async function reloadAfterSave() {
  loading.value = true
  try {
    const res = await fetchServerConfigPage()
    if (res.code === 200) {
      page.value = res.data
      edits.value = {}
      reloadFailedAfterSave.value = false
      reloadFailedMessage.value = ''
    } else {
      reloadFailedAfterSave.value = true
      reloadFailedMessage.value = res.message || '加载失败'
    }
  } catch (e) {
    reloadFailedAfterSave.value = true
    reloadFailedMessage.value = resolveHttpMessage(e)
  } finally {
    loading.value = false
  }
}

async function doSave() {
  if (!canSave.value) {
    return
  }
  const items = dirtyItems.value.map((item) => {
    const edit = editValue(item)
    return {
      idServerConfig: item.idServerConfig,
      configValue: canonicalOrNull(item.configKey, edit) ?? edit,
    }
  })
  saving.value = true
  saveError.value = ''
  confirmVisible.value = false
  try {
    const res = await saveServerConfig({ items })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      edits.value = {}
      await reloadAfterSave()
    } else {
      saveError.value = res.message || '保存失败，请稍后重试'
    }
  } catch (e) {
    saveError.value = resolveHttpMessage(e)
  } finally {
    saving.value = false
  }
}

function resolveHttpMessage(e: unknown): string {
  return e instanceof Error && e.message ? e.message : '网络请求失败'
}

onMounted(() => {
  loadPage()
})
</script>

<style scoped>
.server-config-page {
  padding: 4px;
}

.page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 8px;
  color: #909399;
}

.state-icon {
  font-size: 26px;
  color: #f56c6c;
}

.state-text {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.state-desc {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.config-card {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-item {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.dirty-hint {
  font-size: 13px;
  color: var(--el-color-warning);
}

.save-reload-error,
.save-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  border-radius: 4px;
  font-size: 13px;
}

.save-reload-error {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
}

.retry-load-btn {
  margin-left: 4px;
}

.save-error {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
}

.config-table {
  width: 100%;
}

.item-name {
  color: var(--el-text-color-primary);
  white-space: pre-line;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.key-icon {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
  cursor: help;
  vertical-align: middle;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
