import { describe, it, expect } from 'vitest'
import {
  canonicalOrNull,
  getDisplayName,
  validateAndNormalize,
  editorMeta,
  CONFIG_KEY_NOT_SUPPORTED,
  VALUE_EMPTY,
  VALUE_LENGTH_EXCEEDED,
  VALUE_FORMAT_INVALID,
} from './configRules'

function valid(key: string, value: string, canonical: string) {
  const r = validateAndNormalize(key, value)
  expect(r.ok).toBe(true)
  expect(r.canonical).toBe(canonical)
}

function invalid(key: string, value: string, reason: string) {
  const r = validateAndNormalize(key, value)
  expect(r.ok).toBe(false)
  expect(r.reason).toBe(reason)
}

describe('boolean：auto-create-table / auto-expand-column-length', () => {
  it('合法值规范化', () => {
    valid('auto-create-table', 'true', 'true')
    valid('auto-create-table', 'false', 'false')
    valid('auto-expand-column-length', ' true ', 'true')
  })

  it('非法值拒绝为 VALUE_FORMAT_INVALID', () => {
    invalid('auto-create-table', 'TRUE', VALUE_FORMAT_INVALID)
    invalid('auto-create-table', 'False', VALUE_FORMAT_INVALID)
    invalid('auto-create-table', '1', VALUE_FORMAT_INVALID)
    invalid('auto-create-table', '0', VALUE_FORMAT_INVALID)
    invalid('auto-create-table', 'yes', VALUE_FORMAT_INVALID)
    invalid('auto-expand-column-length', 'TRue', VALUE_FORMAT_INVALID)
  })
})

describe('raw-message-storage-strategy', () => {
  it('合法值规范化', () => {
    valid('raw-message-storage-strategy', 'NONE', 'NONE')
    valid('raw-message-storage-strategy', 'PLAIN', 'PLAIN')
    valid('raw-message-storage-strategy', 'COMPRESS', 'COMPRESS')
  })

  it('非法值拒绝', () => {
    invalid('raw-message-storage-strategy', 'none', VALUE_FORMAT_INVALID)
    invalid('raw-message-storage-strategy', 'Plain', VALUE_FORMAT_INVALID)
    invalid('raw-message-storage-strategy', 'X', VALUE_FORMAT_INVALID)
  })
})

describe('realtime-insert-batch-enabled-database-types', () => {
  it('规范化为固定顺序并去重（SC-CFG-DBTYPE-01~06）', () => {
    valid('realtime-insert-batch-enabled-database-types', 'doris,mysql', 'doris,mysql')
    valid('realtime-insert-batch-enabled-database-types', 'mysql,doris', 'doris,mysql')
    valid('realtime-insert-batch-enabled-database-types', 'doris, MYSQL ,doris', 'doris,mysql')
    valid('realtime-insert-batch-enabled-database-types', ' ORACLE ', 'oracle')
    valid('realtime-insert-batch-enabled-database-types', 'doris,oracle,mysql', 'doris,oracle,mysql')
  })

  it('非法或尾部空 token 拒绝（SC-CFG-DBTYPE-07）', () => {
    invalid('realtime-insert-batch-enabled-database-types', 'postgres', VALUE_FORMAT_INVALID)
    invalid('realtime-insert-batch-enabled-database-types', 'doris,postgres', VALUE_FORMAT_INVALID)
    invalid('realtime-insert-batch-enabled-database-types', 'doris,,', VALUE_FORMAT_INVALID)
  })

  it('空值拒绝为 VALUE_EMPTY', () => {
    invalid('realtime-insert-batch-enabled-database-types', '', VALUE_EMPTY)
  })
})

describe('snapshotBatchSize', () => {
  it('合法值规范化（SC-CFG-SNAPSHOT-01~03）', () => {
    valid('snapshotBatchSize', '100', '100')
    valid('snapshotBatchSize', '10000', '10000')
    valid('snapshotBatchSize', '1000', '1000')
    valid('snapshotBatchSize', '0100', '100')
    valid('snapshotBatchSize', ' 1000 ', '1000')
  })

  it('非法值拒绝', () => {
    invalid('snapshotBatchSize', '99', VALUE_FORMAT_INVALID)
    invalid('snapshotBatchSize', '10001', VALUE_FORMAT_INVALID)
    invalid('snapshotBatchSize', '0', VALUE_FORMAT_INVALID)
    invalid('snapshotBatchSize', '-5', VALUE_FORMAT_INVALID)
    invalid('snapshotBatchSize', '1e3', VALUE_FORMAT_INVALID)
    invalid('snapshotBatchSize', '100.0', VALUE_FORMAT_INVALID)
    invalid('snapshotBatchSize', 'abc', VALUE_FORMAT_INVALID)
  })

  it('空值拒绝为 VALUE_EMPTY', () => {
    invalid('snapshotBatchSize', '', VALUE_EMPTY)
  })
})

describe('tableRowDeleteStrategy', () => {
  it('合法值规范化', () => {
    valid('tableRowDeleteStrategy', 'DELETE', 'DELETE')
    valid('tableRowDeleteStrategy', 'DELETE_FLAG', 'DELETE_FLAG')
  })

  it('非法值拒绝', () => {
    invalid('tableRowDeleteStrategy', 'delete', VALUE_FORMAT_INVALID)
    invalid('tableRowDeleteStrategy', 'Delete_Flag', VALUE_FORMAT_INVALID)
    invalid('tableRowDeleteStrategy', 'FLAG', VALUE_FORMAT_INVALID)
  })
})

describe('未知 Key / 通用规则', () => {
  it('未知 Key 拒绝为 CONFIG_KEY_NOT_SUPPORTED', () => {
    invalid('monitor-metric-topic-name', 'cdc-metric', CONFIG_KEY_NOT_SUPPORTED)
  })

  it('空白值拒绝为 VALUE_EMPTY', () => {
    invalid('auto-create-table', '   ', VALUE_EMPTY)
  })

  it('超过 64 字符拒绝为 VALUE_LENGTH_EXCEEDED', () => {
    invalid('auto-create-table', 't'.repeat(65), VALUE_LENGTH_EXCEEDED)
  })
})

describe('getDisplayName 回退（SC-UI-DESIGN-040~044）', () => {
  it('configDesc 非空原样展示', () => {
    expect(getDisplayName('自动建表', 'auto-create-table')).toBe('自动建表')
  })

  it('configDesc 空白回退到 configKey', () => {
    expect(getDisplayName('   ', 'auto-create-table')).toBe('auto-create-table')
  })

  it('两者皆空回退到占位', () => {
    expect(getDisplayName(null, null)).toBe('未定义配置项')
  })
})

describe('editorMeta', () => {
  it('六类已支持 Key 返回对应编辑器', () => {
    expect(editorMeta('auto-create-table')?.type).toBe('boolean')
    expect(editorMeta('auto-expand-column-length')?.type).toBe('boolean')
    expect(editorMeta('raw-message-storage-strategy')?.type).toBe('enum')
    expect(editorMeta('realtime-insert-batch-enabled-database-types')?.type).toBe('dbtypes')
    expect(editorMeta('snapshotBatchSize')?.type).toBe('integer')
    expect(editorMeta('tableRowDeleteStrategy')?.type).toBe('enum')
  })

  it('未知 Key 返回 null', () => {
    expect(editorMeta('monitor-metric-topic-name')).toBeNull()
    expect(editorMeta(null)).toBeNull()
  })
})

describe('canonicalOrNull 脏值判定（SC-DESIGN-070~076）', () => {
  it('可编辑合法值返回规范化结果', () => {
    expect(canonicalOrNull('auto-create-table', 'true')).toBe('true')
    expect(canonicalOrNull('realtime-insert-batch-enabled-database-types', 'mysql,doris')).toBe(
      'doris,mysql',
    )
  })

  it('非法或未知 Key 返回 null', () => {
    expect(canonicalOrNull('auto-create-table', 'TRUE')).toBeNull()
    expect(canonicalOrNull('monitor-metric-topic-name', 'x')).toBeNull()
    expect(canonicalOrNull('snapshotBatchSize', '99')).toBeNull()
  })
})
