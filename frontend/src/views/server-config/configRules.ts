/**
 * 中心端配置项规则（与后端 ServerConfigValueValidator 完全一致，SC-EDIT-04）。
 * 校验顺序固定：trim 非空 → 原样提交长度 ≤64 → Key 专门规则 → 规范化后非空且 ≤64。
 * 新增可编辑 Key 必须前后端同步扩展（ServerConfigEditableKey / configRules.ts）。
 */

export type EditorType = 'boolean' | 'enum' | 'dbtypes' | 'integer'

export interface EditorMeta {
  type: EditorType
  options?: string[]
}

export interface ValidateResult {
  ok: boolean
  canonical?: string
  reason?: string
}

export const CONFIG_KEY_NOT_SUPPORTED = '配置Key不受支持'
export const VALUE_EMPTY = '配置值为空'
export const VALUE_LENGTH_EXCEEDED = '配置值超过 64 字符上限'
export const VALUE_FORMAT_INVALID = '配置值不符合该配置项的专门规则'

const MAX_VALUE_LENGTH = 64
const DB_TYPE_ORDER = ['doris', 'oracle', 'mysql']
const RAW_MESSAGE_STRATEGIES = ['NONE', 'PLAIN', 'COMPRESS']
const TABLE_DELETE_STRATEGIES = ['DELETE', 'DELETE_FLAG']
const BOOL_KEYS = new Set(['auto-create-table', 'auto-expand-column-length'])

/** 已支持可编辑 Key 白名单（SC-EDIT-03）。 */
export const SUPPORTED_KEYS: ReadonlySet<string> = new Set([
  'auto-create-table',
  'auto-expand-column-length',
  'raw-message-storage-strategy',
  'realtime-insert-batch-enabled-database-types',
  'snapshotBatchSize',
  'tableRowDeleteStrategy',
])

/** 编辑器元数据：boolean / 单选 enum / 多选 dbtypes / 整数输入。 */
export function editorMeta(configKey: string | null): EditorMeta | null {
  if (configKey === null || !SUPPORTED_KEYS.has(configKey)) {
    return null
  }
  if (BOOL_KEYS.has(configKey)) {
    return { type: 'boolean' }
  }
  switch (configKey) {
    case 'raw-message-storage-strategy':
      return { type: 'enum', options: RAW_MESSAGE_STRATEGIES }
    case 'tableRowDeleteStrategy':
      return { type: 'enum', options: TABLE_DELETE_STRATEGIES }
    case 'realtime-insert-batch-enabled-database-types':
      return { type: 'dbtypes' }
    default:
      return { type: 'integer' }
  }
}

/** 配置项显示名回退（SC-UI-DESIGN-040~044）：configDesc 原样，否则 configKey，否则占位。 */
export function getDisplayName(configDesc: string | null, configKey: string | null): string {
  if (configDesc !== null && configDesc.trim() !== '') {
    return configDesc
  }
  if (configKey !== null && configKey.trim() !== '') {
    return configKey
  }
  return '未定义配置项'
}

/** 对 configValue 执行通用校验 + Key 专门规则校验并返回规范化值（与后端顺序一致）。 */
export function validateAndNormalize(configKey: string | null, submittedValue: string | null): ValidateResult {
  if (configKey === null || !SUPPORTED_KEYS.has(configKey)) {
    return { ok: false, reason: CONFIG_KEY_NOT_SUPPORTED }
  }
  if (submittedValue === null || submittedValue.trim() === '') {
    return { ok: false, reason: VALUE_EMPTY }
  }
  if (submittedValue.length > MAX_VALUE_LENGTH) {
    return { ok: false, reason: VALUE_LENGTH_EXCEEDED }
  }
  const canonical = normalizeForKey(configKey, submittedValue)
  if (canonical === null || canonical === '' || canonical.length > MAX_VALUE_LENGTH) {
    return { ok: false, reason: VALUE_FORMAT_INVALID }
  }
  return { ok: true, canonical }
}

/**
 * 规范化后的值（用于脏值判定，SC-DESIGN-070~076）。
 * 不可编辑或规范化失败返回 null；可编辑且成功返回 canonical 字符串。
 */
export function canonicalOrNull(configKey: string | null, value: string | null): string | null {
  if (configKey === null || !SUPPORTED_KEYS.has(configKey)) {
    return null
  }
  const result = validateAndNormalize(configKey, value)
  return result.ok ? (result.canonical as string) : null
}

function normalizeForKey(configKey: string, value: string): string | null {
  if (BOOL_KEYS.has(configKey)) {
    return normalizeBool(value)
  }
  switch (configKey) {
    case 'raw-message-storage-strategy':
      return normalizeEnum(value, RAW_MESSAGE_STRATEGIES)
    case 'realtime-insert-batch-enabled-database-types':
      return normalizeDbTypes(value)
    case 'snapshotBatchSize':
      return normalizeInteger(value)
    case 'tableRowDeleteStrategy':
      return normalizeEnum(value, TABLE_DELETE_STRATEGIES)
    default:
      return null
  }
}

function normalizeBool(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed === 'true' || trimmed === 'false') {
    return trimmed
  }
  return null
}

function normalizeEnum(value: string, allowed: readonly string[]): string | null {
  const trimmed = value.trim()
  return allowed.includes(trimmed) ? trimmed : null
}

function normalizeDbTypes(value: string): string | null {
  // split 保留尾部空 token，保证 "doris,," 与后端 split(",", -1) 语义一致被拒（SC-CFG-DBTYPE-07）
  const tokens = value.split(',')
  const selected = new Set<string>()
  for (const token of tokens) {
    const t = token.trim().toLowerCase()
    if (!DB_TYPE_ORDER.includes(t)) {
      return null
    }
    selected.add(t)
  }
  if (selected.size === 0) {
    return null
  }
  return DB_TYPE_ORDER.filter((db) => selected.has(db)).join(',')
}

function normalizeInteger(value: string): string | null {
  const trimmed = value.trim()
  if (!/^[0-9]+$/.test(trimmed)) {
    return null
  }
  let canonical = trimmed.replace(/^0+(?=\d)/, '')
  if (canonical === '') {
    canonical = '0'
  }
  const num = Number(canonical)
  if (!Number.isSafeInteger(num) || num < 100 || num > 10000) {
    return null
  }
  return String(num)
}
