<template>
  <!-- 页面外壳、查询区容器、查询/重置动作与结果卡片来自查询列表页模板的四个公共组件
       （CCFG-REQ-091/CCFG-DESIGN-038）：本页只持有 Feature 文案、查询草稿与生效条件、
       请求与错误语义、表格与行操作、三个业务弹窗。默认槽内容逐一成为 .ql-page 直接子节点。 -->
  <QueryListPageShell
    title="探针端管理"
    description="维护 sync-client 探针及其采集数据源配置"
  >
    <!-- 查询区：探针信息 + 探针状态，操作组由公共查询/重置动作组件提供；本页无刷新能力（CCFG-UI-033） -->
    <QueryListQueryPanel>
      <div class="cc-q-group">
        <span class="cc-q-label">探针信息</span>
        <el-input
          v-model="queryKeyword"
          class="cc-q-keyword"
          placeholder="请输入探针 ID 或探针描述"
          clearable
          @keyup.enter="onQuery"
        />
      </div>
      <div class="cc-q-group">
        <span class="cc-q-label">探针状态</span>
        <el-select v-model="queryStatus" class="cc-q-status">
          <el-option label="全部" value="ALL" />
          <el-option label="启用" value="ENABLED" />
          <el-option label="停用" value="DISABLED" />
        </el-select>
      </div>
      <template #actions>
        <QueryListActions :query-loading="listLoading" @query="onQuery" @reset="onReset" />
      </template>
    </QueryListQueryPanel>

    <!-- 结果区：头部（左摘要 / 最右“新增探针”）→ 固定错误槽 → 固定分隔线 → 表格 body -->
    <QueryListResultPanel v-loading="listLoading">
      <template #summary>
        <span class="cc-result-count">共 {{ listRows.length }} 条</span>
      </template>
      <template #toolbar>
        <el-button class="cc-btn-add" @click="openCreate">
          <el-icon class="cc-btn-icon"><Plus /></el-icon>新增探针
        </el-button>
      </template>
      <template #error>
        <div v-if="listFailed" class="cc-load-error" role="alert">
          <span class="cc-load-error-text">列表加载失败，请重试。</span>
          <el-button size="small" :loading="listLoading" @click="loadList">重试</el-button>
        </div>
      </template>
      <template #body>
        <!-- 主列表显式接入列表表格视觉模板（根类 + scoped 预设），弹窗内表格不接入（CCFG-REQ-099） -->
        <el-table
          class="cc-table"
          :class="[LT_MAIN_TABLE_CLASS]"
          :data="listRows"
          empty-text="暂无符合条件的探针"
          @row-dblclick="onRowDblClick"
        >
          <el-table-column label="序号" width="70" align="center" class-name="cc-col-seq">
            <template #default="{ $index }">
              <span class="cc-seq">{{ $index + 1 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="探针 ID" width="176" class-name="cc-col-id">
            <template #default="{ row }">
              <div class="cc-id-cell">
                <span
                  class="cc-id"
                  tabindex="0"
                  role="button"
                  :aria-label="`编辑探针 ${row.clientId}`"
                  @keydown="onRowKeyEdit($event, row)"
                  @mouseenter="onIdEnter($event, row)"
                  @mouseleave="onTipLeave"
                >{{ row.clientId }}</span>
                <!-- FG_ACTIVE 三态：'1' 不显示；'0' 显示与数据源管理“数据源 ID”同款“停用”标识；
                     其余历史异常值显示红色 `异常：{原始值}`（CCFG-UI-031/CCFG-UI-035） -->
                <span v-if="idState(row) === 'off'" class="cc-inactive-mark">停用</span>
                <span
                  v-else-if="idState(row) === 'abnormal'"
                  class="cc-abnormal-mark"
                  @mouseenter="onAbnormalEnter($event, row)"
                  @mouseleave="onTipLeave"
                >{{ abnormalBadgeText(row) }}</span>
              </div>
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
                  :class="`cc-dstag--${dsTagState(row, ds)}`"
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

          <!-- 最右固定“操作”列：唯一入口为水平三点图标（CCFG-UI-040）；入口与菜单的 click/dblclick
               均不冒泡到行双击，菜单靠右对齐以避免贴近右边缘时被裁切（CCFG-UI-041） -->
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                popper-class="cc-more-popper"
                @command="(command: string) => onRowCommand(command, row)"
                @click.stop
                @dblclick.stop
              >
                <span
                  class="cc-more-link"
                  role="button"
                  tabindex="0"
                  :aria-label="`更多操作：${row.clientId}`"
                  @click.stop
                  @dblclick.stop
                >
                  <el-icon class="cc-more-icon"><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 条目顺序固定为先“停用/启用”、后“删除”；历史异常行只提供“停用”与“删除”；
                         “删除”以分隔线单独隔开（CCFG-UI-041） -->
                    <el-dropdown-item
                      v-if="idState(row) !== 'off'"
                      command="disable"
                      class="cc-more-warning"
                      :disabled="rowBusy(row)"
                    >停用</el-dropdown-item>
                    <el-dropdown-item
                      v-else
                      command="enable"
                      :disabled="rowBusy(row)"
                    >启用</el-dropdown-item>
                    <el-dropdown-item
                      command="delete"
                      divided
                      class="cc-more-danger"
                      :disabled="rowBusy(row)"
                    >删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </QueryListResultPanel>

    <!-- 新增/编辑弹窗（CCFG-UI-013/014/015/016/017）：不接入列表表格视觉模板 -->
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
  </QueryListPageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Plus } from '@element-plus/icons-vue'
import {
  QueryListActions,
  QueryListPageShell,
  QueryListQueryPanel,
  QueryListResultPanel,
} from '@/components/query-list'
import { LT_MAIN_TABLE_CLASS } from '@/styles/list-table'
import { CHIP_BOX, descNeedsTip, measureChipWidth, packChips } from './listLayout'
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

/** 采集数据源标签三态：'ok' 绿 / 'neutral' 中性 / 'bad' 红（CCFG-REQ-108/CCFG-UI-039）。 */
type DsTagState = 'ok' | 'neutral' | 'bad'

/**
 * 标签取色优先级自高至低：① 该数据源存在项级 `anomalies` → 红；② 否则整行存在
 * `COMMA_PROTOCOL_AMBIGUOUS` → 中性（不得暗示已确认为正常）；③ 否则 → 绿（仅表示
 * 当前未检测到异常）。红色不因整行歧义降级为中性色。
 */
function dsTagState(row: ClientListItemVO, ds: DataSourceViewItem): DsTagState {
  if (ds.anomalies.length > 0) return 'bad'
  if (isRowAmbiguous(row)) return 'neutral'
  return 'ok'
}

// ------------------------------------------------- 探针 ID 三态标识（不归一化原始值）

/** `FG_ACTIVE` 原始字符串三态：'1' 无标识、'0' 停用标识、其余为历史异常（CCFG-REQ-101）。 */
function idState(row: ClientListItemVO): 'on' | 'off' | 'abnormal' {
  if (row.fgActive === '1') return 'on'
  if (row.fgActive === '0') return 'off'
  return 'abnormal'
}

/** 单个不可见空白字符（含零宽字符）需以可见定界呈现，保证可辨认、可核对（CCFG-UI-035）。 */
function isInvisibleOnly(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && /^[\s​‌‍﻿]+$/.test(value)
}

/** 历史异常固定文案 `异常：{原始值}`；原始值原样展示，不静默转换、不隐藏值（CCFG-REQ-102）。 */
function abnormalBadgeText(row: ClientListItemVO): string {
  const raw: unknown = row.fgActive
  const shown = isInvisibleOnly(raw) ? `"${String(raw)}"` : String(raw)
  return `异常：${shown}`
}

// ------------------------------------------------------------------ 列表状态

const listRows = ref<ClientListItemVO[]>([])
const listLoading = ref(false)
const listFailed = ref(false)
let listSeq = 0

const queryKeyword = ref('')
const queryStatus = ref<ClientStatusFilter>('ALL')
const appliedKeyword = ref<string | undefined>(undefined)
const appliedStatus = ref<ClientStatusFilter>('ALL')

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

/** 重置只清空查询控件：不发请求、不动当前已生效条件与已展示结果（CCFG-UI-003）。 */
function onReset(): void {
  clearTip()
  queryKeyword.value = ''
  queryStatus.value = 'ALL'
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
      // 数据渲染并完成真实布局后，按各容器实际宽度重新打包单行布局；
      // 不依赖 ResizeObserver 是否恰好再触发（行元素复用且宽度不变时 RO 不再回调，
      // 否则会退回“全部直接展示”，窄列下既无 +N 又溢出被裁切）。
      if (seq === listSeq) {
        await settleListLayout()
        if (seq === listSeq) recomputeAllRows()
      }
    } else {
      // 失败保留上一次成功结果（不清空 listRows），仅提示失败并提供重试（CCFG-UI-012/034）
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
  // 弹窗关闭无额外副作用
}

// ------------------------------------------------------------------ 行操作（“更多”下拉）

/** 行级忙碌：按探针 ID 记录在途行，只锁对应行，其他行的独立操作不被阻塞（CCFG-DESIGN-042）。 */
const busyClientIds = reactive(new Set<string>())

function rowBusy(row: ClientListItemVO): boolean {
  return busyClientIds.has(row.clientId)
}

function markBusy(clientId: string, busy: boolean): void {
  if (busy) busyClientIds.add(clientId)
  else busyClientIds.delete(clientId)
}

function onRowCommand(command: string, row: ClientListItemVO): void {
  if (command === 'enable') {
    void onEnable(row)
  } else if (command === 'disable') {
    void onDisable(row)
  } else if (command === 'delete') {
    void onDelete(row)
  }
}

/** 启用：维持既有免二次确认语义，直接调 E6（CCFG-UI-018）。 */
async function onEnable(row: ClientListItemVO): Promise<void> {
  if (rowBusy(row)) return
  markBusy(row.clientId, true)
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
    markBusy(row.clientId, false)
  }
}

/** 停用：二次确认后调 E7；确认阶段即置忙，防止同一行重复提交（CCFG-REQ-098）。 */
async function onDisable(row: ClientListItemVO): Promise<void> {
  if (rowBusy(row)) return
  markBusy(row.clientId, true)
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
    markBusy(row.clientId, false)
    return
  }
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
    markBusy(row.clientId, false)
  }
}

/** 删除：二次确认后调 E5，成功按已生效条件重载（CCFG-DESIGN-043）。 */
async function onDelete(row: ClientListItemVO): Promise<void> {
  if (rowBusy(row)) return
  markBusy(row.clientId, true)
  try {
    await ElMessageBox.confirm(`确定删除探针 ${row.clientId} 吗？该操作不可恢复。`, '删除探针', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (e) {
    markBusy(row.clientId, false)
    return
  }
  try {
    const res = await deleteClient(row.clientId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败，请检查网络后重试。')
  } finally {
    markBusy(row.clientId, false)
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
  // 标签与 `+N` 槽位都按当前紧凑盒模型（CHIP_BOX）测量，与实际渲染宽度一致（CCFG-REQ-107）。
  const widths = dss.map((ds) => measureChipWidth(dsBodyText(ds), CHIP_BOX))
  const moreWidth = measureChipWidth(MORE_SLOT_TEXT, CHIP_BOX) || 40
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

/** 异常标识完整文案经 Tooltip 可见：列宽不足被截断时仍可核对原始值（CCFG-UI-035）。 */
function onAbnormalEnter(event: MouseEvent, row: ClientListItemVO): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  scheduleTip(el, [{ text: abnormalBadgeText(row), tone: 'bad' }])
}

onMounted(() => {
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
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  rowObserver?.disconnect()
  rowObserver = null
  srcEls.clear()
  shownMap.clear()
})
</script>

<!-- 主列表表格视觉模板：显式引用公共预设源（显式启用，非全局），
     并由 el-table 根元素上的并列类 `lt-main-table` 启用（CCFG-REQ-099）。 -->
<style scoped src="@/styles/list-table/list-table-visual.css"></style>

<style scoped>
/* 页面外壳、查询区容器、查询/重置动作与结果卡片盒模型全部由公共层提供
   （.ql-page / .ql-q-panel / .ql-actions / .ql-result-panel）；本文件只保留 Feature 专属
   字段组、结果区摘要、错误槽内容与表格样式，不复制公共层等价 CSS。 */
.cc-q-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.cc-q-label {
  flex: 0 0 auto;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.cc-q-keyword {
  width: 300px;
}

.cc-q-status {
  width: 150px;
}

/* 结果区左上角摘要：共 n 条 */
.cc-result-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* “新增探针”：黑色实心主按钮，与参考页“新增数据源”同款（CCFG-REQ-104/CCFG-UI-036）。
   `:not(.is-disabled)` 限定仅正常态换色，禁用态沿用 Element Plus 既有禁用视觉。 */
.cc-btn-add:not(.is-disabled) {
  background: #09090b;
  border-color: #09090b;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 500;
}

.cc-btn-add:not(.is-disabled):hover,
.cc-btn-add:not(.is-disabled):focus {
  background: #27272a;
  border-color: #27272a;
  color: #ffffff;
}

.cc-btn-add:not(.is-disabled):active {
  background: #18181b;
  border-color: #18181b;
  color: #ffffff;
}

.cc-btn-icon {
  margin-right: 2px;
  font-size: 14px;
}

/* 错误槽内容：失败提示 + 重试，不出现“刷新/重新加载”等本页已取消的刷新语义控件 */
.cc-load-error {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--el-color-danger);
}

.cc-load-error-text {
  flex: 0 1 auto;
  min-width: 0;
}

/* 本页不再为行声明固定像素行高：行高由公共表格视觉预设的单元格上下内边距
   （`var(--lt-body-cell-padding, 12px 0)`）与行内容共同决定，与参考页“数据源管理”实际规则一致
   （CCFG-REQ-106/CCFG-DESIGN-049/CCFG-UI-038）。普通行悬停与双击编辑由 Element Plus 与
   @row-dblclick 承担；本页已无行选中态，故不保留任何选中/hover 覆盖规则 */

/* 序号列：展示派生值，按当前展示数组 $index + 1 连续编号（CCFG-REQ-100） */
.cc-seq {
  font-size: 13px;
  color: #71717a;
  font-variant-numeric: tabular-nums;
}

/* 探针 ID 单元格：ID 文本 + 三态标识同行；标识不得挤压/覆盖最右固定“操作”列 */
.cc-id-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

/* 探针 ID 正文：字重与颜色对齐参考页“数据源 ID”（CCFG-REQ-105/CCFG-UI-037）；
   其后的“停用”与历史异常标识保持各自现行视觉，不随本规则加粗改色。 */
.cc-id {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: #09090b;
  cursor: pointer;
}

.cc-id:focus-visible {
  outline: 1px solid var(--el-color-primary);
  outline-offset: 1px;
}

/* 停用标识：与数据源管理主列表“数据源 ID”后的“停用”标识同一视觉语言（CCFG-UI-031） */
.cc-inactive-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  box-sizing: border-box;
  padding: 0 6px;
  height: 20px;
  border-radius: 4px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

/* 历史异常标识：红色、固定文案 `异常：{原始值}`；文字本身承载语义，不只靠颜色（CCFG-REQ-102）。
   列宽不足时随本列省略号截断，完整值经单实例 Tooltip 可见（CCFG-UI-035）。 */
.cc-abnormal-mark {
  display: inline-block;
  flex: 0 1 auto;
  min-width: 0;
  box-sizing: border-box;
  max-width: 100%;
  padding: 0 6px;
  height: 20px;
  border-radius: 4px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 采集数据源：单行展示，永不折行/换第二行，超出单行实际可容纳数与数量上限（6）的以
   动态 `+N` 表示（CCFG-UI-004/007，R1 §5.4/§5.6）。不声明固定高度：行高交由单元格内边距
   与内容决定（CCFG-UI-038），故本容器高度随标签/行级歧义标识的实际内容自适应。 */
.cc-src {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
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

/* 采集数据源标签：借用参考页“角色”标签视觉语言（高 20px、12px/600、圆角 4px、无边框、
   柔和底色，CCFG-REQ-107/CCFG-UI-039）。底色/文字色按三态由 `cc-dstag--ok|neutral|bad` 决定；
   基础块即绿色态，其语义为“当前未检测到异常”。 */
.cc-dstag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 20px;
  max-width: 10em;
  padding: 0 9px;
  border: none;
  border-radius: 4px;
  background: #ecfdf5;
  font-size: 12px;
  font-weight: 600;
  color: #047857;
  overflow: hidden;
  flex-shrink: 0;
}

/* ① 该项存在既有 anomalies → 红色（优先于整行歧义，不因歧义降级为中性色） */
.cc-dstag--bad {
  background: #fef0f0;
  color: #d54949;
}

/* ② 无项级异常但整行含 COMMA_PROTOCOL_AMBIGUOUS → 中性色，不暗示该关联已确认为正常 */
.cc-dstag--neutral {
  background: #f4f4f5;
  color: #606266;
}

/* 动态 `+N` 槽位：与本列标签同一紧凑盒模型，保持单行观感与行高一致；
   仍是点击交互入口（CCFG-REQ-109）。 */
.cc-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 20px;
  padding: 0 9px;
  border: none;
  border-radius: 4px;
  background: #f4f4f5;
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

.cc-more:hover {
  background: #e9e9eb;
}

/* 最右固定“操作”列唯一入口：水平三点图标（CCFG-REQ-110/CCFG-UI-040）。
   命中区域按 28×28 提供，键盘焦点可见；可访问名称由触发器上的 aria-label 提供。 */
.cc-more-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--el-color-primary);
  cursor: pointer;
}

.cc-more-link:hover {
  background: #ecf5ff;
}

.cc-more-link:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.cc-more-icon {
  font-size: 18px;
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

<!-- “更多”下拉菜单（Teleport 到 body，故必须为全局作用域并只限定在本页 popper-class 命名空间内）：
     条目顺序为先“停用/启用”、后“删除”；“停用”为警告语义、“删除”为危险语义并以分隔线单独隔开
     （CCFG-UI-041）。柔和圆角、弥散阴影、适当内边距与清晰 Hover／焦点反馈；下拉内不出现状态标签、
     不出现批量操作。 -->
<style>
.cc-more-popper.el-popper {
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.cc-more-popper .el-dropdown-menu {
  border-radius: 8px;
  padding: 4px;
}

.cc-more-popper .el-dropdown-menu__item {
  border-radius: 6px;
  padding: 6px 12px;
}

.cc-more-popper .el-dropdown-menu__item--divided {
  margin: 4px 0;
}

.cc-more-popper .el-dropdown-menu__item.cc-more-danger {
  color: var(--el-color-danger);
}

/* Hover／焦点反馈沿用 Element Plus 既有高亮，但危险/警告语义色在任何交互态下都不被覆盖 */
.cc-more-popper .el-dropdown-menu__item.cc-more-danger:not(.is-disabled):hover,
.cc-more-popper .el-dropdown-menu__item.cc-more-danger:not(.is-disabled):focus {
  color: var(--el-color-danger);
}

.cc-more-popper .el-dropdown-menu__item.cc-more-warning:not(.is-disabled):hover,
.cc-more-popper .el-dropdown-menu__item.cc-more-warning:not(.is-disabled):focus {
  color: #b45309;
}

.cc-more-popper .el-dropdown-menu__item.cc-more-danger.is-disabled,
.cc-more-popper .el-dropdown-menu__item.cc-more-danger.is-disabled:hover {
  color: var(--el-color-danger-light-5);
}

.cc-more-popper .el-dropdown-menu__item.cc-more-warning {
  color: #b45309;
}

.cc-more-popper .el-dropdown-menu__item.cc-more-warning.is-disabled,
.cc-more-popper .el-dropdown-menu__item.cc-more-warning.is-disabled:hover {
  color: #f0b775;
}
</style>
