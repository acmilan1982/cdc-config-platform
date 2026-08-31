/**
 * 数据订阅前端展示/格式化工具（docs/features/data-subscription/API.md 与 UI.md 语义）。
 */
import type {
  DataSourceRefStatus,
  SchemaTableGroup,
  SourceOptionVO,
  SourceTableInput,
} from '@/types/subscription'

/** 源库/目标库引用展示（status 标记停用/不存在）。 */
export interface NamedRefLike {
  dataSourceId: string
  dataSourceOrg: string | null
  status: DataSourceRefStatus
}

/** 状态后缀：NORMAL 无、INACTIVE=“已停用”、NOT_FOUND=“不存在”（API.md §4.2/§4.3）。 */
export function refStatusLabel(status: DataSourceRefStatus): string {
  if (status === 'INACTIVE') return '已停用'
  if (status === 'NOT_FOUND') return '不存在'
  return ''
}

/** 引用主展示文字：停用显示机构、不存在显示原始 ID、正常显示机构（缺失时回退 ID）。 */
export function describeRef(ref: NamedRefLike): string {
  if (ref.status === 'NOT_FOUND') return ref.dataSourceId
  return ref.dataSourceOrg ?? ref.dataSourceId
}

/** 匹配片段（用于搜索命中高亮，避免 v-html 注入）。 */
export interface HighlightPart {
  text: string
  match: boolean
}

export function highlightParts(text: string, rawKeyword: string | undefined): HighlightPart[] {
  const keyword = (rawKeyword ?? '').trim().toLowerCase()
  if (!keyword) return [{ text, match: false }]
  const lower = text.toLowerCase()
  const parts: HighlightPart[] = []
  let cursor = 0
  while (cursor < text.length) {
    const idx = lower.indexOf(keyword, cursor)
    if (idx < 0) {
      parts.push({ text: text.slice(cursor), match: false })
      break
    }
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), match: false })
    parts.push({ text: text.slice(idx, idx + keyword.length), match: true })
    cursor = idx + keyword.length
  }
  if (parts.length === 0) parts.push({ text: '', match: false })
  return parts
}

/** 空安全 CSV 拆分：按英文逗号拆分、trim、丢弃空 token（与后端 splitTrimDropEmpty 契约一致）。 */
export function splitTrimDropEmpty(value: string | null | undefined): string[] {
  if (value === null || value === undefined) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** 统计非空 token 数（列表“共 N 张”口径，含无法解析的历史 token）。 */
export function countNonEmptyTokens(value: string | null | undefined): number {
  return splitTrimDropEmpty(value).length
}

/** 名称是否含协议保留字符（英文逗号或组件内部英文句点）。 */
export function isReservedCommaOrDot(name: string): boolean {
  return name.includes(',') || name.includes('.')
}

/** 选中表在集合/去重/脏比较中的稳定标识；有效表不含保留字符，句点分隔无歧义。 */
export function tableKey(schemaName: string, tableName: string): string {
  return `${schemaName}.${tableName}`
}

/** 将选中表按 Schema 分组，保持 Schema 首次出现顺序、组内保持原始顺序。 */
export function groupSourceTablesBySchema(tables: SourceTableInput[]): SchemaTableGroup[] {
  const groups: SchemaTableGroup[] = []
  const index = new Map<string, number>()
  for (const t of tables) {
    let idx = index.get(t.schemaName)
    if (idx === undefined) {
      idx = groups.length
      index.set(t.schemaName, idx)
      groups.push({ schema: t.schemaName, tables: [] })
    }
    groups[idx].tables.push(t.tableName)
  }
  return groups
}

/** 两个表集合是否相同（顺序无关，用于编辑脏比较）。 */
export function sameTableSet(a: SourceTableInput[], b: SourceTableInput[]): boolean {
  if (a.length !== b.length) return false
  const aKeys = new Set(a.map((t) => tableKey(t.schemaName, t.tableName)))
  return b.every((t) => aKeys.has(tableKey(t.schemaName, t.tableName)))
}

/** 更新时间展示：updateTime 为 null 时回退 insertTime 并标记“创建时间”。 */
export interface ResolvedTimeDisplay {
  time: string
  isCreateFallback: boolean
}

export function resolveUpdateTime(
  updateTime: string | null,
  insertTime: string | null,
): ResolvedTimeDisplay | null {
  if (updateTime) return { time: updateTime, isCreateFallback: false }
  if (insertTime) return { time: insertTime, isCreateFallback: true }
  return null
}

/**
 * 源库候选搜索（UI.md §5）：ID+机构搜索，四级排序
 * ①ID 精确（忽略大小写）②ID 前缀 ③ID 模糊 ④机构模糊；先 trim。
 * 空关键字返回全部候选（下拉未输入时展示全部）。
 */
export function filterSourceOptions(
  options: SourceOptionVO[],
  rawKeyword: string | undefined,
): SourceOptionVO[] {
  const keyword = (rawKeyword ?? '').trim().toLowerCase()
  if (!keyword) return options
  const exact: SourceOptionVO[] = []
  const prefix: SourceOptionVO[] = []
  const idFuzzy: SourceOptionVO[] = []
  const orgFuzzy: SourceOptionVO[] = []
  for (const opt of options) {
    const id = opt.dataSourceId.toLowerCase()
    const org = (opt.dataSourceOrg ?? '').toLowerCase()
    if (id === keyword) exact.push(opt)
    else if (id.startsWith(keyword)) prefix.push(opt)
    else if (id.includes(keyword)) idFuzzy.push(opt)
    else if (org.includes(keyword)) orgFuzzy.push(opt)
  }
  return [...exact, ...prefix, ...idFuzzy, ...orgFuzzy]
}

/** 弹窗固定摘要“已选择：X 个源库 · X 个 Schema · X 个表 · X 个目标库”的计数（Schema 只统计选中至少一张表的 Schema）。 */
export interface SelectionSummary {
  sourceCount: number
  schemaCount: number
  tableCount: number
  targetCount: number
}

export function summarizeSelection(
  sourceId: string | null,
  selectedTables: SourceTableInput[],
  targetIds: string[],
): SelectionSummary {
  const schemas = new Set<string>()
  for (const t of selectedTables) schemas.add(t.schemaName)
  return {
    sourceCount: sourceId ? 1 : 0,
    schemaCount: schemas.size,
    tableCount: selectedTables.length,
    targetCount: targetIds.length,
  }
}

export function formatSelectionSummary(summary: SelectionSummary): string {
  return `已选择：${summary.sourceCount} 个源库 · ${summary.schemaCount} 个 Schema · ${summary.tableCount} 个表 · ${summary.targetCount} 个目标库`
}
