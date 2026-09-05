<template>
  <div class="cc-page">
    <!-- 页面标题与说明（CCFG-UI-001/002：统一“探针端管理”） -->
    <header class="cc-header">
      <h2 class="cc-title">探针端管理</h2>
      <p class="cc-subtitle">维护 sync-client 探针及其采集数据源配置</p>
    </header>

    <!-- 首次查询失败且从未成功：整区错误态 + 重试（CCFG-UI-012） -->
    <div v-if="firstLoadFailed" class="cc-page-state cc-page-state--error" role="alert">
      <p class="cc-page-state-title">列表加载失败</p>
      <p class="cc-page-state-desc">暂时无法获取探针列表，请重新加载或稍后重试。</p>
      <el-button type="primary" plain :loading="listLoading" @click="loadList">重新加载</el-button>
    </div>

    <template v-else>
      <!-- 独立查询区（CCFG-UI-002/003：外部标签 + 控件，无搜索图标） -->
      <div class="cc-query">
        <div class="cc-query-item">
          <span class="cc-query-label">探针信息</span>
          <el-input
            v-model="queryKeyword"
            class="cc-query-keyword"
            placeholder="请输入探针 ID 或探针描述"
            clearable
            @keyup.enter="onQuery"
          />
        </div>
        <div class="cc-query-item">
          <span class="cc-query-label">探针状态</span>
          <el-select v-model="queryStatus" class="cc-query-status">
            <el-option label="全部" value="ALL" />
            <el-option label="启用" value="ENABLED" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </div>
        <div class="cc-query-actions">
          <el-button type="primary" class="cc-query-btn" @click="onQuery">查询</el-button>
          <el-button class="cc-query-btn" @click="onReset">重置</el-button>
        </div>
      </div>

      <!-- 独立表格卡片：工具栏 + 数据表格（CCFG-UI-002/004/005） -->
      <div class="cc-table-card">
        <div class="cc-toolbar">
          <div class="cc-toolbar-left">
            <el-button type="primary" class="cc-btn-add" @click="openCreate">
              <el-icon class="cc-btn-icon"><Plus /></el-icon>新增探针
            </el-button>
            <el-button
              class="cc-btn-delete"
              :class="{ 'cc-btn-delete--armed': selectedClientId !== null }"
              :disabled="selectedClientId === null"
              :loading="deleteBusy"
              @click="onDelete"
            >
              <el-icon class="cc-btn-icon"><Delete /></el-icon>删除所选
            </el-button>
            <span v-if="selectedClientId !== null" class="cc-selected">已选择：{{ selectedClientId }}</span>
          </div>
        </div>

        <!-- 已有成功结果后的刷新失败：非遮挡提示 + 按已生效条件重试（R1-05） -->
        <div v-if="refreshFailed" class="cc-refresh-warn" role="status">
          <span class="cc-refresh-text">刷新失败：当前仍展示上一次成功结果，请点击“重试”重新加载。</span>
          <el-button size="small" :loading="listLoading" @click="loadList">重试</el-button>
        </div>


      <!-- 数据表格（CCFG-UI-005/022，无操作列/无分页/无自动刷新） -->
      <el-table
        v-loading="listLoading"
        class="cc-table"
        :data="listRows"
        :row-class-name="rowClassName"
        empty-text="暂无符合条件的探针"
        @row-click="onRowClick"
        @row-dblclick="onRowDblClick"
      >
        <el-table-column label="探针 ID" width="176" class-name="cc-col-id">
          <template #default="{ row }">
            <span
              class="cc-id"
              tabindex="0"
              role="button"
              :aria-label="`编辑探针 ${row.clientId}`"
              @keydown="onRowKeyEdit($event, row)"
              @mouseenter="onIdEnter($event, row)"
              @mouseleave="onTipLeave"
            >{{ row.clientId }}</span>
          </template>
        </el-table-column>

        <el-table-column label="探针描述" width="300">
          <template #default="{ row }">
            <span
              class="cc-desc"
              :class="{ 'cc-desc--empty': isBlankDesc(row) }"
              @mouseenter="onDescEnter($event, row)"
              @mouseleave="onTipLeave"
            >{{ isBlankDesc(row) ? '—' : row.clientDesc }}</span>
          </template>
        </el-table-column>

        <el-table-column label="采集数据源" min-width="260">
          <template #default="{ row }">
            <div
              class="cc-src"
              :data-client-id="row.clientId"
              :ref="(el) => setSrcEl(el as HTMLElement | null, row.clientId)"
            >
              <span
                v-if="isRowAmbiguous(row)"
                class="cc-rowbad"
                @mouseenter="onTipEnter($event, tipForRowbad(row))"
                @mouseleave="onTipLeave"
              ><span class="cc-txt">含逗号歧义</span></span>

              <span
                v-for="(ds, idx) in orderedSources(row)"
                :key="`${row.clientId}-${ds.dataSourceId}-${idx}`"
                v-show="idx < shownCount(row)"
                class="cc-dstag"
                :class="{ 'cc-dstag--bad': ds.anomalies.length }"
                @mouseenter="onTipEnter($event, tipForDs(ds))"
                @mouseleave="onTipLeave"
              ><span class="cc-txt">{{ dsBodyText(ds) }}</span></span>

              <el-popover
                v-if="hiddenCount(row) > 0"
                placement="top"
                :width="380"
                trigger="click"
                @show="clearTip"
              >
                <template #reference>
                  <span class="cc-more"><span class="cc-txt">+{{ hiddenCount(row) }}</span></span>
                </template>
                <div class="cc-full-list">
                  <p v-if="isRowAmbiguous(row)" class="cc-full-note">
                    以下为普通 CSV 解析的展示结果（行级含逗号歧义），非已确定分配。
                  </p>
                  <ul>
                    <li
                      v-for="ds in row.dataSources"
                      :key="`${row.clientId}-full-${ds.dataSourceId}`"
                      class="cc-full-item"
                    >
                      <span v-if="hasOrg(ds)" class="cc-full-org">{{ ds.org }}</span>
                      <span v-if="hasOrg(ds)" class="cc-full-id">{{ ds.dataSourceId }}</span>
                      <span v-if="ds.anomalies.length" class="cc-full-bad">
                        {{ anomalyText(ds.anomalies, ds.conflictClientIds) }}
                      </span>
                      <span v-if="!hasOrg(ds)" class="cc-full-org">{{ ds.dataSourceId }}</span>
                    </li>
                  </ul>
                </div>
              </el-popover>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="数据源数量" width="110" align="center">
          <template #default="{ row }">
            <span class="cc-count">{{ row.dataSourceCount }}</span>
            <span
              v-if="isRowAmbiguous(row)"
              class="cc-count-note"
              @mouseenter="onTipEnter($event, { lines: [{ text: '普通 CSV 解析的展示结果（行级含逗号歧义，非已确定分配）', tone: 'muted' }] })"
              @mouseleave="onTipLeave"
            >（展示）</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="160">
          <template #default="{ row }">
            <span class="cc-status-cell">
              <el-tag size="small" :type="statusType(row)" class="cc-state-tag" :disable-transitions="true">
                {{ statusText(row) }}
              </el-tag>
              <el-button
                v-if="canToggle(row, 'disable')"
                link
                type="danger"
                class="cc-op"
                :disabled="opBusy === `disable:${row.clientId}`"
                @click="onDisable(row)"
              >
                {{ opBusy === `disable:${row.clientId}` ? '停用中…' : '停用' }}
              </el-button>
              <el-button
                v-else-if="canToggle(row, 'enable')"
                link
                type="primary"
                class="cc-op"
                :disabled="opBusy === `enable:${row.clientId}`"
                @click="onEnable(row)"
              >
                {{ opBusy === `enable:${row.clientId}` ? '启用中…' : '启用' }}
              </el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </template>

    <!-- 新增/编辑弹窗（CCFG-UI-013/014/015/016/017） -->
    <el-dialog
      v-model="dialogOpen"
      class="cc-dialog"
      :title="mode === 'edit' ? '编辑探针' : '新增探针'"
      width="680px"
      :close-on-click-modal="false"
      @closed="onDialogClosed"
    >
      <div class="cc-form">
        <div class="cc-form-item">
          <span class="cc-form-label">探针 ID</span>
          <div class="cc-form-control">
            <div class="cc-id-control">
              <el-input
                v-if="!clientIdLocked"
                v-model="clientIdDraft"
                placeholder="1~32 位字母、数字、点、下划线或连字符"
                :disabled="submitting"
              />
              <el-input v-else :model-value="clientIdDraft" disabled data-locked="true" />
              <span v-if="mode === 'edit' && clientIdLocked" class="cc-lock-hint">（已锁定）</span>
            </div>
            <el-button
              v-if="mode === 'edit'"
              link
              type="primary"
              class="cc-id-toggle"
              :disabled="submitting"
              @click="toggleClientIdLock"
            >
              {{ clientIdLocked ? '修改探针 ID' : '取消修改' }}
            </el-button>
          </div>
        </div>

        <div class="cc-form-item">
          <span class="cc-form-label">探针描述</span>
          <div class="cc-form-control cc-desc-row">
            <el-input
              v-model="clientDescDraft"
              type="textarea"
              :rows="2"
              placeholder="探针用途描述（UTF-8 原文不超过 1024 字节）"
              :disabled="submitting"
            />
            <el-button class="cc-autogen" @click="onAutoGenerate">
              自动生成
            </el-button>
          </div>
        </div>

        <div class="cc-form-item">
          <span class="cc-form-label">采集数据源</span>
          <div class="cc-form-control cc-source-field">
            <div class="cc-split">
              <!-- 候选池（CCFG-UI-016） -->
              <div class="cc-pane cc-pane--options">
                <p class="cc-pane-title">可选数据源</p>
                <el-input
                  v-model="optionSearch"
                  class="cc-search"
                  placeholder="按机构 / 名称 / ID 搜索"
                  clearable
                />
                <div class="cc-opt-list">
                  <p v-if="optionsLoadFailed" class="cc-state-mini cc-state-mini--err">
                    数据源候选加载失败，请稍后重试
                  </p>
                  <p v-else-if="optionsLoading" class="cc-state-mini">候选加载中…</p>
                  <p v-else-if="options.length === 0" class="cc-state-mini">无可选数据源</p>
                  <p v-else-if="filteredOptions.length === 0" class="cc-state-mini">未找到匹配数据源</p>
                  <template v-else>
                    <button
                      v-for="opt in filteredOptions"
                      :key="opt.dataSourceId"
                      type="button"
                      class="cc-opt"
                      :class="{
                        'cc-opt--disabled': !opt.selectable,
                        'cc-opt--chosen': isChosen(opt.dataSourceId),
                      }"
                      :disabled="!opt.selectable || isChosen(opt.dataSourceId)"
                      :title="optTitle(opt)"
                      @click="addOption(opt)"
                    >
                      <span class="cc-opt-main">{{ opt.org || opt.dataSourceId }}</span>
                      <span class="cc-opt-sub">
                        {{ opt.dataSourceName }}{{ opt.dataSourceName ? ' · ' : '' }}{{ opt.dataSourceId }}
                      </span>
                      <span v-if="!opt.selectable && opt.notSelectableReason === 'COMMA_IN_ID'" class="cc-opt-reason">
                        ID 含英文逗号，不可选择
                      </span>
                      <span v-else-if="!opt.selectable && opt.notSelectableReason === 'OCCUPIED'" class="cc-opt-reason">
                        已分配给：{{ opt.occupiedByClientIds.join('、') }}
                      </span>
                    </button>
                  </template>
                </div>
              </div>

              <!-- 已选区域（CCFG-UI-014/016：异常项红色回显，可移除） -->
              <div class="cc-pane cc-pane--chosen">
                <p class="cc-pane-title">已选（{{ chosen.length }}）</p>
                <div class="cc-chosen-list">
                  <el-tag
                    v-for="(chip, idx) in chosen"
                    :key="`${chip.dataSourceId}-${idx}`"
                    closable
                    size="small"
                    :type="chip.anomalies.length ? 'danger' : 'info'"
                    :class="['cc-chip', { 'cc-chip--bad': chip.anomalies.length }]"
                    :disable-transitions="true"
                    @close="removeChip(idx)"
                  >
                    {{ chipText(chip) }}
                  </el-tag>
                  <p v-if="chosen.length === 0" class="cc-state-mini">尚未选择数据源</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="saveBlockReason" class="cc-save-hint" role="note">{{ saveBlockReason }}</p>

      <template #footer>
        <el-button :disabled="submitting" @click="dialogOpen = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="saveBlockReason !== null || submitting"
          :loading="submitting"
          @click="submitDialog"
        >
          {{ mode === 'edit' ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 页面级单实例悬停 Tooltip（CCFG-UI-005/008）：Teleport 到 body，任意时刻最多一个 -->
    <Teleport to="body">
      <div
        v-show="tipVisible"
        ref="tipHostRef"
        class="cc-single-tip"
        :class="{ 'cc-single-tip--below': tipBelow }"
        :style="{ left: `${tipPos.x}px`, top: `${tipPos.y}px` }"
        role="tooltip"
        aria-live="polite"
      >
        <p
          v-for="(ln, i) in tipLines"
          :key="i"
          :class="`cc-single-line cc-single-line--${ln.tone ?? 'normal'}`"
        >{{ ln.text }}</p>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import { descNeedsTip, measureChipWidth, packChips } from './listLayout'
import {
  createClient,
  deleteClient,
  disableClient,
  enableClient,
  fetchClientList,
  fetchDataSourceOptions,
  updateClient,
} from '@/api/clientConfig'
import type { ClientListItemVO, ClientStatusFilter, DataSourceOptionVO } from '@/types/clientConfig'

type DataSourceViewItem = ClientListItemVO['dataSources'][number]

const DS_GAP = 8
const DS_MAX_VISIBLE = 6
const MORE_SLOT_TEXT = '+88'
const TIP_DELAY_MS = 240

/** 空白点击取消选择的保护集：命中其中任一（含祖先）的点击不取消当前选择（R1 §5.3）。
 * 覆盖 Element Plus Teleport 浮层（对话框/确认框/下拉/浮层）、原生与 EP 控件、
 * 整张表格（行点击语义自行切换选择）与数据源标签/`+N`/行级歧义所在的行区域。 */
const BLANK_CLEAR_PROTECTED =
  '.el-overlay,.el-dialog,.el-message-box,.el-message,.el-popper,.el-popover,' +
  '.el-select-dropdown,.el-dropdown-menu,.el-notification,' +
  'button,input,select,textarea,a,[contenteditable="true"],' +
  '.el-button,.el-input,.el-textarea,.el-select,.el-radio,.el-checkbox,.el-switch,' +
  '.el-radio-button,.el-checkbox-button,' +
  '.cc-table,.cc-single-tip'

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/

const ANOMALY_TEXT: Record<string, string> = {
  INACTIVE: '已停用',
  NOT_FOUND: '不存在',
  CATEGORY_MISMATCH: '类别非 SOURCE',
  TYPE_MISMATCH: '类型非 ORACLE',
  COMMA_IN_ID: 'ID 含英文逗号',
  DUPLICATE_IN_ROW: '行内重复',
  ASSIGNED_TO_MULTIPLE_CLIENTS: '已分配给其他探针',
}

/** 与后端 String.trim() 一致的空白判定（移除两端 charCode <= 0x20 字符）。 */
function javaTrim(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && value.charCodeAt(start) <= 0x20) start += 1
  while (end > start && value.charCodeAt(end - 1) <= 0x20) end -= 1
  return value.slice(start, end)
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length
}

function anomalyText(anomalies: string[], conflictClientIds: string[]): string {
  return anomalies
    .map((a) => {
      if (a === 'ASSIGNED_TO_MULTIPLE_CLIENTS') {
        const owners = conflictClientIds.length ? `：${conflictClientIds.join('、')}` : ''
        return `${ANOMALY_TEXT[a]}${owners}`
      }
      return ANOMALY_TEXT[a] ?? a
    })
    .join('；')
}

function isBlankDesc(row: ClientListItemVO): boolean {
  // 后端 JSON 序列化省略 null 字段时 clientDesc 为 undefined，须与 null 一视同仁。
  const desc = row.clientDesc
  return desc == null || javaTrim(desc).length === 0
}

function isRowAmbiguous(row: ClientListItemVO): boolean {
  return row.rowAnomalies.includes('COMMA_PROTOCOL_AMBIGUOUS')
}

/** 采集数据源展示顺序：异常优先、组内保持接口原顺序（CCFG-UI-010，不改原数组）。 */
function orderedSources(row: ClientListItemVO): DataSourceViewItem[] {
  const abnormal = row.dataSources.filter((d) => d.anomalies.length > 0)
  const normal = row.dataSources.filter((d) => d.anomalies.length === 0)
  return [...abnormal, ...normal]
}

/** 标签正文：优先机构名称；数据源不存在且无法取得机构名称时才显示原始 ID（CCFG-UI-009）。 */
function dsBodyText(ds: DataSourceViewItem): string {
  const org = (ds.org ?? '').trim()
  return org.length ? org : ds.dataSourceId
}

function hasOrg(ds: DataSourceViewItem): boolean {
  return (ds.org ?? '').trim().length > 0
}

function statusText(row: ClientListItemVO): string {
  if (row.fgActive === '1') return '启用'
  if (row.fgActive === '0') return '停用'
  return `异常（原始值=${row.fgActive}）`
}

function statusType(row: ClientListItemVO): 'success' | 'info' | 'danger' {
  if (row.fgActive === '1') return 'success'
  if (row.fgActive === '0') return 'info'
  return 'danger'
}

function canToggle(row: ClientListItemVO, action: 'enable' | 'disable'): boolean {
  if (action === 'disable') return row.fgActive === '1' || row.fgActive !== '0'
  return row.fgActive === '0'
}

// ------------------------------------------------------------------ 列表状态

const listRows = ref<ClientListItemVO[]>([])
const listLoading = ref(false)
const listLoadedOnce = ref(false)
const listFailed = ref(false)
let listSeq = 0
const selectedClientId = ref<string | null>(null)

const queryKeyword = ref('')
const queryStatus = ref<ClientStatusFilter>('ALL')
const appliedKeyword = ref<string | undefined>(undefined)
const appliedStatus = ref<ClientStatusFilter>('ALL')

const firstLoadFailed = computed(
  () => listFailed.value && !listLoadedOnce.value && listRows.value.length === 0,
)

/** 已有成功结果后再次查询/刷新失败：保留旧列表，在表格上方给出非遮挡提示（R1-05）。 */
const refreshFailed = computed(() => listFailed.value && listLoadedOnce.value)

const rowClassName = ({ row }: { row: ClientListItemVO }) =>
  selectedClientId.value === row.clientId ? 'cc-row--selected' : ''

function clearSelection(): void {
  selectedClientId.value = null
}

function onRowClick(row: ClientListItemVO): void {
  // 单击行：选中该行（另一行直接切换）。同一样在“空白点击”语义下由 clearSelection 显式清除，
  // 点击行内空白也按“切换/保持选中”处理，不在行点击里做二次清除（R1 §5.3）。
  selectedClientId.value = row.clientId
}

/** 点击页面非交互空白区域（不在保护集内）时取消当前选择（R1 §5.3）。 */
function onPageBlankClick(event: MouseEvent): void {
  if (selectedClientId.value === null) return
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest(BLANK_CLEAR_PROTECTED)) return
  clearSelection()
}

function onRowDblClick(row: ClientListItemVO): void {
  openEdit(row)
}

/** 探针 ID 单元格键盘编辑入口：Enter / Space 打开编辑，阻止 Space 页面滚动（R1-06）。 */
function onRowKeyEdit(event: KeyboardEvent, row: ClientListItemVO): void {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  if (dialogOpen.value) return
  openEdit(row)
}

function onQuery(): void {
  const keyword = javaTrim(queryKeyword.value)
  appliedKeyword.value = keyword.length ? keyword : undefined
  appliedStatus.value = queryStatus.value
  void loadList()
}

function onReset(): void {
  clearTip()
  queryKeyword.value = ''
  queryStatus.value = 'ALL'
  clearSelection()
  // 恢复默认条件；不自动触发查询、不覆盖当前已生效列表（CCFG-UI-003）
}

async function loadList(): Promise<void> {
  clearTip()
  const seq = ++listSeq
  listLoading.value = true
  listFailed.value = false
  try {
    const res = await fetchClientList({ keyword: appliedKeyword.value, status: appliedStatus.value })
    if (seq !== listSeq) return
    if (res.code === 200) {
      listRows.value = res.data?.items ?? []
      shownMap.clear()
      listLoadedOnce.value = true
      // 查询、列表重新加载或数据集替换后清除选择（R1 §5.3/§5.6；删除与新增/编辑保存
      // 后经 loadList 复用同一入口清除，避免残留指向已变化数据的选中行）。
      clearSelection()
      // 数据渲染并完成真实布局后，按各容器实际宽度重新打包单行布局；
      // 不依赖 ResizeObserver 是否恰好再触发（行元素复用且宽度不变时 RO 不再回调，
      // 否则会退回“全部直接展示”，窄列下既无 +N 又溢出被裁切）。
      if (seq === listSeq) {
        await settleListLayout()
        if (seq === listSeq) recomputeAllRows()
      }
    } else {
      listFailed.value = true
    }
  } catch (e) {
    if (seq !== listSeq) return
    listFailed.value = true
  } finally {
    if (seq === listSeq) listLoading.value = false
  }
}

function onDialogClosed(): void {
  // 弹窗关闭仅保留当前选中行，不做其他副作用
}

// ------------------------------------------------------------------ 删除

const deleteBusy = ref(false)

async function onDelete(): Promise<void> {
  const clientId = selectedClientId.value
  if (clientId === null || deleteBusy.value) return
  try {
    await ElMessageBox.confirm(`确定删除探针 ${clientId} 吗？该操作不可恢复。`, '删除探针', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (e) {
    return
  }
  deleteBusy.value = true
  try {
    const res = await deleteClient(clientId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      clearSelection()
      await loadList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败，请检查网络后重试。')
  } finally {
    deleteBusy.value = false
  }
}

// ------------------------------------------------------------------ 启停

const opBusy = ref<string | null>(null)

async function onEnable(row: ClientListItemVO): Promise<void> {
  const key = `enable:${row.clientId}`
  if (opBusy.value) return
  opBusy.value = key
  try {
    const res = await enableClient(row.clientId)
    if (res.code === 200) {
      ElMessage.success('启用成功')
      await loadList()
    } else {
      ElMessage.error(res.message || '启用失败')
    }
  } catch (e) {
    ElMessage.error('启用失败，请检查网络后重试。')
  } finally {
    opBusy.value = null
  }
}

async function onDisable(row: ClientListItemVO): Promise<void> {
  const key = `disable:${row.clientId}`
  if (opBusy.value) return
  try {
    await ElMessageBox.confirm(
      `确定停用探针 ${row.clientId} 吗？停用后该探针不再按启用状态命中。`,
      '停用探针',
      {
        confirmButtonText: '停用',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch (e) {
    return
  }
  opBusy.value = key
  try {
    const res = await disableClient(row.clientId)
    if (res.code === 200) {
      ElMessage.success('停用成功')
      await loadList()
    } else {
      ElMessage.error(res.message || '停用失败')
    }
  } catch (e) {
    ElMessage.error('停用失败，请检查网络后重试。')
  } finally {
    opBusy.value = null
  }
}

// ------------------------------------------------------------------ 弹窗表单

interface ChosenItem {
  dataSourceId: string
  org: string | null
  dataSourceName: string | null
  anomalies: string[]
  conflictClientIds: string[]
}

const dialogOpen = ref(false)
const mode = ref<'create' | 'edit' | null>(null)
const editRow = ref<ClientListItemVO | null>(null)
const clientIdLocked = ref(true)
const clientIdDraft = ref('')
const clientDescDraft = ref('')
const chosen = ref<ChosenItem[]>([])
const optionSearch = ref('')
const submitting = ref(false)

const options = ref<DataSourceOptionVO[]>([])
const optionsLoading = ref(false)
const optionsLoadFailed = ref(false)
let optionSeq = 0

function optTitle(opt: DataSourceOptionVO): string {
  return `${opt.org || opt.dataSourceId}（${opt.dataSourceName ?? ''}）${opt.dataSourceId}`
}

function isChosen(id: string): boolean {
  return chosen.value.some((c) => c.dataSourceId === id)
}

function addOption(opt: DataSourceOptionVO): void {
  if (!opt.selectable || isChosen(opt.dataSourceId)) return
  chosen.value.push({
    dataSourceId: opt.dataSourceId,
    org: opt.org,
    dataSourceName: opt.dataSourceName,
    anomalies: [],
    conflictClientIds: [],
  })
}

function removeChip(index: number): void {
  chosen.value.splice(index, 1)
}

function chipText(chip: ChosenItem): string {
  if (chip.anomalies.length) {
    return `${chip.dataSourceId}（${anomalyText(chip.anomalies, chip.conflictClientIds)}）`
  }
  const org = (chip.org ?? '').trim()
  return org.length ? org : chip.dataSourceId
}

const filteredOptions = computed(() => {
  const term = javaTrim(optionSearch.value).toLowerCase()
  if (!term) return options.value
  return options.value.filter((o) =>
    `${o.org ?? ''} ${o.dataSourceName ?? ''} ${o.dataSourceId}`.toLowerCase().includes(term),
  )
})

function openCreate(): void {
  clearTip()
  resetDialog()
  mode.value = 'create'
  clientIdLocked.value = false
  dialogOpen.value = true
  void loadOptions()
}

function openEdit(row: ClientListItemVO): void {
  clearTip()
  resetDialog()
  mode.value = 'edit'
  editRow.value = row
  clientIdLocked.value = true
  clientIdDraft.value = row.clientId
  clientDescDraft.value = row.clientDesc ?? ''
  chosen.value = row.dataSources.map((d) => ({
    dataSourceId: d.dataSourceId,
    org: d.org,
    dataSourceName: d.dataSourceName,
    anomalies: d.anomalies ?? [],
    conflictClientIds: d.conflictClientIds ?? [],
  }))
  dialogOpen.value = true
  void loadOptions(row.clientId)
}

function resetDialog(): void {
  mode.value = null
  editRow.value = null
  clientIdLocked.value = true
  clientIdDraft.value = ''
  clientDescDraft.value = ''
  chosen.value = []
  optionSearch.value = ''
  submitting.value = false
  options.value = []
  optionsLoading.value = false
  optionsLoadFailed.value = false
  optionSeq += 1
}

async function loadOptions(excludeClientId?: string): Promise<void> {
  const seq = ++optionSeq
  optionsLoading.value = true
  optionsLoadFailed.value = false
  try {
    const res = await fetchDataSourceOptions(excludeClientId)
    if (seq !== optionSeq) return
    if (res.code === 200) {
      options.value = res.data ?? []
    } else {
      optionsLoadFailed.value = true
    }
  } catch (e) {
    if (seq !== optionSeq) return
    optionsLoadFailed.value = true
  } finally {
    if (seq === optionSeq) optionsLoading.value = false
  }
}

function toggleClientIdLock(): void {
  if (clientIdLocked.value) {
    // 解锁编辑探针 ID：不弹修改前警告（CCFG-UI-014）
    clientIdLocked.value = false
  } else {
    // 取消修改：恢复原探针 ID 并回到只读
    if (editRow.value) clientIdDraft.value = editRow.value.clientId
    clientIdLocked.value = true
  }
}

/** 编辑歧义行：选择集与原始 CSV 解析结果完全一致时视为“尚未清除歧义”。 */
const ambiguityNotCleared = computed(() => {
  if (mode.value !== 'edit' || editRow.value === null) return false
  if (!isRowAmbiguous(editRow.value)) return false
  const originalIds = editRow.value.dataSources.map((d) => d.dataSourceId)
  const currentIds = chosen.value.map((c) => c.dataSourceId)
  return originalIds.length === currentIds.length && originalIds.every((id, i) => id === currentIds[i])
})

const hasAnomalousChosen = computed(() => chosen.value.some((c) => c.anomalies.length > 0))

const saveBlockReason = computed<string | null>(() => {
  if (chosen.value.length === 0) return '至少选择 1 个数据源'
  // 行级含逗号歧义优先于项级异常提示：歧义是根因，项级异常多为歧义解析的派生结果
  if (mode.value === 'edit' && ambiguityNotCleared.value) {
    return '原配置含英文逗号歧义：请移除歧义展示项并重新选择合法候选后再保存'
  }
  if (mode.value === 'edit' && hasAnomalousChosen.value) {
    return '存在异常数据源（见红色标记），请先移除异常项后再保存'
  }
  return null
})

function onAutoGenerate(): void {
  if (chosen.value.length === 0) {
    // 无已选数据源 → 严格无动作：不清空、不改写、不提示（CCFG-UI-015）
    return
  }
  const missing = chosen.value.find((c) => (c.org ?? '').trim().length === 0)
  if (missing) {
    ElMessage.warning(`数据源（${missing.dataSourceId}）无机构名称，自动生成失败。`)
    return
  }
  const generated = chosen.value.map((c) => (c.org ?? '').trim()).join(',')
  if (javaTrim(generated).length === 0) {
    ElMessage.warning('自动生成失败：结果为空白。')
    return
  }
  if (utf8Bytes(generated) > 1024) {
    ElMessage.warning('自动生成失败：生成描述超过 1024 字节（UTF-8）。')
    return
  }
  clientDescDraft.value = generated
}

async function submitDialog(): Promise<void> {
  if (mode.value === null || submitting.value || saveBlockReason.value !== null) return
  const finalClientId = javaTrim(clientIdDraft.value)
  if (finalClientId.length === 0) {
    ElMessage.warning('探针 ID 不能为空。')
    return
  }
  if (!ID_PATTERN.test(finalClientId)) {
    ElMessage.warning('探针 ID 格式不正确：须为 1~32 位字母、数字、点、下划线或连字符，且以字母或数字开头。')
    return
  }
  const desc = clientDescDraft.value
  if (javaTrim(desc).length === 0) {
    ElMessage.warning('探针描述不能为空。')
    return
  }
  if (utf8Bytes(desc) > 1024) {
    ElMessage.warning('探针描述去除首尾空白后非空，但原文超过 1024 字节（UTF-8），请缩短后再保存。')
    return
  }
  const request = {
    clientId: finalClientId,
    clientDesc: desc,
    dataSourceIds: chosen.value.map((c) => c.dataSourceId),
  }
  const originalClientId = editRow.value?.clientId
  const isEdit = mode.value === 'edit'
  submitting.value = true
  try {
    const res =
      isEdit && originalClientId
        ? await updateClient(originalClientId, request)
        : await createClient(request)
    if (res.code === 200) {
      ElMessage.success(isEdit ? '编辑成功' : '新增成功')
      dialogOpen.value = false
      // 保存即数据集替换：loadList 成功入口统一清除选择（R1 §5.3）。
      await loadList()
    } else {
      ElMessage.error(res.message || (isEdit ? '编辑失败' : '新增失败'))
    }
  } catch (e) {
    ElMessage.error(isEdit ? '编辑失败，请检查网络后重试。' : '新增失败，请检查网络后重试。')
  } finally {
    submitting.value = false
  }
}

// ------------------------------------------------- 单行动态 +N 布局
// 决策依赖真实元素尺寸：用 ResizeObserver 观察每个采集数据源单元格，取到容器宽度后
// 用与标签一致的盒模型离屏测量各标签宽度，再交给纯函数 packChips 决定直接展示数与 +N
// （可见数量 = min(单行实际可容纳数, 6)，见 R1 §5.4/§5.6）。
// jsdom 无布局：不安装/触发 ResizeObserver 时按“单行前 6 项”兜底（配合真机目测）。

const shownMap = reactive(new Map<string, number>())
const srcEls = reactive(new Map<string, HTMLElement>())
let rowObserver: ResizeObserver | null = null
let resizeHandler: (() => void) | null = null

function shownCount(row: ClientListItemVO): number {
  return shownMap.get(row.clientId) ?? Math.min(orderedSources(row).length, DS_MAX_VISIBLE)
}

function hiddenCount(row: ClientListItemVO): number {
  return Math.max(0, orderedSources(row).length - shownCount(row))
}

function setSrcEl(el: HTMLElement | null, clientId: string): void {
  const prev = srcEls.get(clientId)
  if (prev && prev !== el) rowObserver?.unobserve(prev)
  if (el === null) {
    srcEls.delete(clientId)
    return
  }
  srcEls.set(clientId, el)
  rowObserver?.observe(el)
}

function recomputeRow(clientId: string, containerWidth: number, srcEl?: HTMLElement | null): void {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return
  const row = listRows.value.find((r) => r.clientId === clientId)
  if (!row) return
  const dss = orderedSources(row)
  const total = dss.length
  if (total === 0) {
    shownMap.set(clientId, 0)
    return
  }
  // 行级歧义标签与标签同行流动，先扣除其宽度 + 间距，避免把可展示标签挤进 +N。
  let avail = containerWidth
  const el = srcEl || srcEls.get(clientId)
  if (el) {
    const rb = el.querySelector<HTMLElement>('.cc-rowbad')
    if (rb && rb.offsetWidth > 0) avail = Math.max(0, avail - rb.offsetWidth - DS_GAP)
  }
  const widths = dss.map((ds) => measureChipWidth(dsBodyText(ds)))
  const moreWidth = measureChipWidth(MORE_SLOT_TEXT) || 40
  const { shown } = packChips({
    widths,
    containerWidth: avail,
    gap: DS_GAP,
    moreWidth,
    maxVisible: DS_MAX_VISIBLE,
  })
  shownMap.set(clientId, shown)
}

/** 依当前 DOM（data-client-id）逐行打包。el-table 数据变化时会复用行 DOM 节点且不重建 ref，
 * 按渲染期捕获的 clientId 维护的 srcEls 会过期，故直接读当前渲染结果，而非信任 ref 映射。 */
function recomputeAllRows(): void {
  if (typeof document === 'undefined') return
  document.querySelectorAll<HTMLElement>('.cc-src[data-client-id]').forEach((el) => {
    const clientId = el.getAttribute('data-client-id')
    if (!clientId || !listRows.value.some((r) => r.clientId === clientId)) return
    const width = el.clientWidth || el.getBoundingClientRect().width
    recomputeRow(clientId, width, el)
  })
}

/** 等 el-table 完成真实布局（nextTick 之后再过两帧）再按真实容器宽度打包，供 loadList 成功后调用。 */
function settleListLayout(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'undefined') {
      resolve()
      return
    }
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))
  })
}

// ------------------------------------------------- 单实例悬停 Tooltip
// 整个列表任意时刻最多一个悬停 Tooltip（CCFG-UI-005/007/008）：进入新目标立即关闭上一个，
// 稳定悬停约 240ms 后显示，鼠标离开立即隐藏；查询/重置/重载/弹窗/卸载时清除。

type TipTone = 'main' | 'bad' | 'muted'
interface TipLine {
  text: string
  tone?: TipTone
}
interface TipContent {
  lines: TipLine[]
}

const tipVisible = ref(false)
const tipBelow = ref(false)
const tipPos = reactive({ x: 0, y: 0 })
const tipLines = ref<TipLine[]>([])
const tipHostRef = ref<HTMLElement | null>(null)
let tipTimer: ReturnType<typeof setTimeout> | undefined
let tipTarget: HTMLElement | null = null

function clearTip(): void {
  if (tipTimer !== undefined) {
    clearTimeout(tipTimer)
    tipTimer = undefined
  }
  tipTarget = null
  tipVisible.value = false
  tipLines.value = []
}

function positionTip(): void {
  const host = tipHostRef.value
  if (!host) return
  const hw = host.offsetWidth || 0
  const hh = host.offsetHeight || 0
  const vw = window.innerWidth || 0
  const vh = window.innerHeight || 0
  const half = hw / 2
  let x = tipPos.x
  if (vw > 0) x = Math.min(Math.max(x, half + 8), Math.max(half + 8, vw - half - 8))
  let y = tipPos.y
  if (!tipBelow.value && tipTarget && y - hh < 8) {
    const r = tipTarget.getBoundingClientRect()
    y = r.bottom + 8
    tipBelow.value = true
  }
  if (vh > 0 && y + hh > vh - 8) y = vh - hh - 8
  y = Math.max(y, 8)
  tipPos.x = Math.round(Math.max(x, 8))
  tipPos.y = Math.round(y)
}

function showTip(target: HTMLElement, lines: TipLine[]): void {
  clearTip()
  tipTarget = target
  tipLines.value = lines
  tipBelow.value = false
  const rect = target.getBoundingClientRect()
  tipPos.x = rect.left + rect.width / 2
  tipPos.y = rect.top - 8
  tipVisible.value = true
  void nextTick(() => positionTip())
}

function scheduleTip(target: HTMLElement, lines: TipLine[]): void {
  clearTip()
  tipTimer = setTimeout(() => {
    tipTimer = undefined
    showTip(target, lines)
  }, TIP_DELAY_MS)
}

function onTipEnter(event: MouseEvent, content: TipContent): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  scheduleTip(el, content.lines)
}

function onTipLeave(): void {
  clearTip()
}

function tipForDs(ds: DataSourceViewItem): TipContent {
  const lines: TipLine[] = []
  if (hasOrg(ds)) {
    lines.push({ text: (ds.org ?? '').trim(), tone: 'main' })
    lines.push({ text: `数据源 ID：${ds.dataSourceId}`, tone: 'muted' })
  } else {
    lines.push({ text: ds.dataSourceId, tone: 'main' })
  }
  ds.anomalies.forEach((a) => {
    lines.push({ text: `异常原因：${ANOMALY_TEXT[a] ?? a}`, tone: 'bad' })
  })
  if (ds.anomalies.includes('ASSIGNED_TO_MULTIPLE_CLIENTS') && ds.conflictClientIds.length) {
    lines.push({ text: `冲突探针：${ds.conflictClientIds.join('、')}`, tone: 'bad' })
  }
  return { lines }
}

function tipForRowbad(row: ClientListItemVO): TipContent {
  void row
  return {
    lines: [
      { text: '行级存在英文逗号歧义（历史 CSV），非已确定分配', tone: 'bad' },
      { text: '列表按普通 CSV 解析展示，请进入编辑确认实际分配', tone: 'muted' },
    ],
  }
}

function onDescEnter(event: MouseEvent, row: ClientListItemVO): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  if (isBlankDesc(row)) {
    scheduleTip(el, [{ text: '未填写探针描述', tone: 'muted' }])
    return
  }
  if (descNeedsTip(el.clientWidth, el.scrollWidth)) {
    scheduleTip(el, [{ text: row.clientDesc ?? '', tone: 'main' }])
  } else {
    clearTip()
  }
}

function onIdEnter(event: MouseEvent, row: ClientListItemVO): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  if (descNeedsTip(el.clientWidth, el.scrollWidth)) {
    scheduleTip(el, [{ text: row.clientId, tone: 'main' }])
  } else {
    clearTip()
  }
}

onMounted(() => {
  // 空白点击取消选择：单个窗口级 click 监听（冒泡阶段），仅对保护集之外的非交互空白生效，
  // 卸载时移除（R1 §5.3）。
  window.addEventListener('click', onPageBlankClick)
  if (typeof ResizeObserver !== 'undefined') {
    rowObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target
        if (!(el instanceof HTMLElement)) continue
        const clientId = el.getAttribute('data-client-id')
        if (!clientId) continue
        const width = entry.contentRect ? entry.contentRect.width : el.clientWidth
        recomputeRow(clientId, width, el)
      }
    })
    srcEls.forEach((el) => rowObserver?.observe(el))
    resizeHandler = recomputeAllRows
    window.addEventListener('resize', resizeHandler)
  }
  void loadList()
})

onBeforeUnmount(() => {
  clearTip()
  window.removeEventListener('click', onPageBlankClick)
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  rowObserver?.disconnect()
  rowObserver = null
  srcEls.clear()
  shownMap.clear()
})
</script>

<style scoped>
.cc-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cc-header {
  flex-shrink: 0;
}

.cc-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.cc-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
}

.cc-page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 0;
}

.cc-page-state--error {
  color: #909399;
}

.cc-page-state-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.cc-page-state-desc {
  margin: 0 0 6px;
  font-size: 13px;
  color: #909399;
}

/* 查询区：独立卡片，外部标签 + 控件（CCFG-UI-002/003，无搜索图标） */
.cc-query {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 16px;
  padding: 14px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.cc-query-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cc-query-label {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.cc-query-keyword {
  width: 300px;
}

.cc-query-keyword :deep(.el-input__wrapper) {
  height: 36px;
}

.cc-query-status {
  width: 150px;
}

.cc-query-status :deep(.el-select__wrapper) {
  min-height: 36px;
}

.cc-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: 4px;
}

.cc-query-btn {
  height: 36px;
}

/* 独立表格卡片：工具栏 + 表格（CCFG-UI-002/004/005） */
.cc-table-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.cc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.cc-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cc-btn-icon {
  margin-right: 2px;
  font-size: 14px;
}

.cc-btn-delete--armed {
  color: #f56c6c;
  border-color: #f56c6c;
  background: #fff;
}

.cc-btn-delete--armed:hover,
.cc-btn-delete--armed:focus {
  color: #fff;
  background: #f56c6c;
  border-color: #f56c6c;
}

.cc-selected {
  margin-left: 4px;
  font-size: 13px;
  color: #606266;
}

.cc-refresh-warn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border: 1px solid #e6a23c;
  border-radius: 6px;
  background: #fdf6ec;
  font-size: 13px;
  color: #b88230;
}

.cc-refresh-text {
  flex: 1;
  min-width: 0;
}

/* 选中行视觉：明显但克制的浅蓝背景 + 首单元格左侧约 3px 蓝色强调线（inset box-shadow，
   不改布局）；选中态不被普通悬停覆盖，普通悬停比选中更淡；键盘聚焦不吞（R1 §5.2） */
.cc-table :deep(.el-table__row) {
  height: 60px;
}

.cc-table :deep(.el-table__body tr.el-table__row.cc-row--selected > td.el-table__cell) {
  background-color: #ecf5ff;
}

.cc-table :deep(.el-table__body tr.el-table__row.cc-row--selected:hover > td.el-table__cell) {
  background-color: #ecf5ff;
}

.cc-table :deep(
  .el-table__body tr.el-table__row.cc-row--selected > td.el-table__cell:first-child
) {
  box-shadow: inset 3px 0 0 #409eff;
}

.cc-table :deep(
  .el-table__body tr.el-table__row:not(.cc-row--selected):hover > td.el-table__cell
) {
  background-color: #f2f6ff;
}

.cc-id {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  cursor: pointer;
}

.cc-id:focus-visible {
  outline: 1px solid var(--el-color-primary);
  outline-offset: 1px;
}

.cc-desc {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.cc-desc--empty {
  color: #909399;
}

/* 采集数据源：单行展示，行高约 60px、标签高约 27px；永不折行/换第二行，
   超出单行实际可容纳数与数量上限（6）的以动态 `+N` 表示（CCFG-UI-004/007，R1 §5.4/§5.6） */
.cc-src {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
  height: 30px;
  overflow: hidden;
}

.cc-rowbad {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  height: 27px;
  padding: 0 10px;
  border: 1px solid #f1a7a7;
  border-radius: 4px;
  background: #fef0f0;
  font-size: 14px;
  color: #d54949;
}

/* 标签文字统一承载元素：block 容器使 nowrap/省略号稳定生效（对 flex 容器的匿名文本节点
   text-overflow 不可靠），水平居中由外层 justify-content、垂直居中由 align-items 承担；
   不依赖字体基线，不使用 translate/负 margin/padding-top 等脆弱偏移（R2 §3） */
.cc-txt {
  display: block;
  min-width: 0;
  line-height: 1;
  white-space: nowrap;
}

.cc-dstag > .cc-txt {
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc-dstag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 27px;
  max-width: 10em;
  padding: 0 10px;
  border: 1px solid #d9dee7;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  flex-shrink: 0;
}

.cc-dstag--bad {
  border-color: #f1a7a7;
  background: #fef0f0;
  color: #d54949;
}

.cc-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 27px;
  padding: 0 10px;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  background: #ecf5ff;
  font-size: 14px;
  color: #409eff;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

.cc-more:hover {
  background: #d9ecff;
}

/* 页面级单实例悬停 Tooltip：Teleport 到 body，pointer-events:none（CCFG-UI-005/008） */
.cc-single-tip {
  position: fixed;
  z-index: 3000;
  max-width: 380px;
  padding: 6px 10px;
  border-radius: 6px;
  background: #303133;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  font-size: 12px;
  line-height: 1.5;
  color: #fff;
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.cc-single-tip--below {
  transform: translate(-50%, 0);
}

.cc-single-line {
  margin: 0;
  word-break: break-word;
}

.cc-single-line--main {
  font-weight: 600;
}

.cc-single-line--bad {
  color: #ffb8b8;
}

.cc-single-line--muted {
  color: #d4d7dd;
}

.cc-full-list {
  max-height: 320px;
  overflow-y: auto;
}

.cc-full-list ul {
  margin: 4px 0;
  padding-left: 16px;
}

.cc-full-item {
  line-height: 1.6;
}

.cc-full-note {
  margin: 0 0 4px;
  font-size: 12px;
  color: #e6a23c;
}

.cc-full-org {
  font-weight: 600;
}

.cc-full-bad {
  color: #f56c6c;
  margin: 0 6px;
}

.cc-full-id {
  color: #909399;
  font-size: 12px;
}

.cc-count-note {
  margin-left: 2px;
  font-size: 12px;
  color: #e6a23c;
}

.cc-status-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cc-state-tag {
  cursor: default;
}

.cc-op {
  padding: 0;
}

.cc-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.cc-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* CCFG-UI-024：内容区相对视口安全高度，超出内部纵向滚动 */
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}

.cc-form-item {
  display: flex;
  align-items: flex-start;
}

.cc-form-label {
  flex: 0 0 84px;
  padding-top: 6px;
  font-size: 14px;
  color: #606266;
}

.cc-form-label::before {
  content: '*';
  color: #f56c6c;
  margin-right: 2px;
}

.cc-form-control {
  flex: 1;
  min-width: 0;
}

.cc-id-control {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.cc-lock-hint {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.cc-id-toggle {
  margin-left: 4px;
  white-space: nowrap;
}

.cc-desc-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.cc-desc-row :deep(.el-textarea) {
  flex: 1;
}

.cc-autogen {
  flex-shrink: 0;
}

.cc-source-field {
  width: 100%;
}

.cc-split {
  display: flex;
  gap: 10px;
  width: 100%;
}

.cc-pane {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  padding: 8px;
  flex: 1;
  min-width: 0;
}

.cc-pane-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.cc-search {
  margin-bottom: 6px;
}

.cc-opt-list {
  max-height: 200px;
  overflow-y: auto;
}

.cc-opt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 4px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  line-height: 1.4;
}

.cc-opt:hover:not(:disabled) {
  border-color: #409eff;
}

.cc-opt:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  background: #f4f4f5;
  color: #a8abb2;
}

.cc-opt--chosen {
  opacity: 0.5;
}

.cc-opt-main {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
}

.cc-opt-sub {
  font-size: 12px;
  color: #909399;
}

.cc-opt-reason {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 2px;
}

.cc-state-mini {
  margin: 8px 0;
  font-size: 13px;
  color: #909399;
}

.cc-state-mini--err {
  color: #f56c6c;
}

.cc-pane--chosen .cc-chosen-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.cc-chip {
  max-width: 100%;
}

.cc-chip--bad {
  border-color: var(--el-color-danger);
}

.cc-save-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: #f56c6c;
}
</style>
