import { describe, it, expect } from 'vitest'
import {
  countNonEmptyTokens,
  describeRef,
  filterSourceOptions,
  formatSelectionSummary,
  groupSourceTablesBySchema,
  highlightParts,
  isReservedCommaOrDot,
  refStatusLabel,
  resolveUpdateTime,
  sameTableSet,
  splitTrimDropEmpty,
  summarizeSelection,
  tableKey,
} from './subscriptionFormat'
import type { SourceTableInput } from '@/types/subscription'

describe('splitTrimDropEmpty 空安全 CSV 拆分', () => {
  it('null/undefined/空白返回空数组', () => {
    expect(splitTrimDropEmpty(null)).toEqual([])
    expect(splitTrimDropEmpty(undefined)).toEqual([])
    expect(splitTrimDropEmpty('')).toEqual([])
    expect(splitTrimDropEmpty('  , , ')).toEqual([])
  })

  it('按英文逗号拆分并 trim、丢弃空 token', () => {
    expect(splitTrimDropEmpty(' A , B,  ')).toEqual(['A', 'B'])
    expect(splitTrimDropEmpty('A,B,C')).toEqual(['A', 'B', 'C'])
  })

  it('countNonEmptyTokens 与拆分一致（含无法解析历史 token 的口径）', () => {
    expect(countNonEmptyTokens(' A , , B')).toBe(2)
    expect(countNonEmptyTokens(null)).toBe(0)
  })
})

describe('isReservedCommaOrDot 协议保留字符', () => {
  it('英文逗号与英文句点均为保留字符', () => {
    expect(isReservedCommaOrDot('A,B')).toBe(true)
    expect(isReservedCommaOrDot('S.01')).toBe(true)
    expect(isReservedCommaOrDot('AB01')).toBe(false)
  })
})

describe('tableKey / groupSourceTablesBySchema / sameTableSet', () => {
  it('tableKey 稳定可去重', () => {
    expect(tableKey('SCHEMA_A', 'T1')).toBe('SCHEMA_A.T1')
  })

  it('按 Schema 分组保持首次出现顺序与组内顺序', () => {
    const tables: SourceTableInput[] = [
      { schemaName: 'B', tableName: 'T1' },
      { schemaName: 'A', tableName: 'T1' },
      { schemaName: 'B', tableName: 'T2' },
    ]
    expect(groupSourceTablesBySchema(tables)).toEqual([
      { schema: 'B', tables: ['T1', 'T2'] },
      { schema: 'A', tables: ['T1'] },
    ])
  })

  it('sameTableSet 顺序无关', () => {
    const a: SourceTableInput[] = [
      { schemaName: 'A', tableName: 'T1' },
      { schemaName: 'B', tableName: 'T2' },
    ]
    expect(sameTableSet(a, [{ schemaName: 'B', tableName: 'T2' }, { schemaName: 'A', tableName: 'T1' }])).toBe(true)
    expect(sameTableSet(a, [{ schemaName: 'A', tableName: 'T1' }])).toBe(false)
    expect(sameTableSet(a, [{ schemaName: 'A', tableName: 'T2' }, { schemaName: 'B', tableName: 'T2' }])).toBe(false)
  })
})

describe('resolveUpdateTime 更新时间回退', () => {
  it('有 updateTime 时不回退', () => {
    expect(resolveUpdateTime('2026-08-30T10:00:00', '2026-08-29T09:00:00')).toEqual({
      time: '2026-08-30T10:00:00',
      isCreateFallback: false,
    })
  })

  it('updateTime 为 null 时回退 insertTime 并标记创建时间', () => {
    expect(resolveUpdateTime(null, '2026-08-29T09:00:00')).toEqual({
      time: '2026-08-29T09:00:00',
      isCreateFallback: true,
    })
  })

  it('两者皆空返回 null', () => {
    expect(resolveUpdateTime(null, null)).toBeNull()
  })
})

describe('filterSourceOptions 四级排序搜索（UI.md §5）', () => {
  const options = [
    { dataSourceId: 'SRC-01', dataSourceOrg: '机构A' },
    { dataSourceId: 'src2', dataSourceOrg: '机构A' },
    { dataSourceId: 'TGT-X', dataSourceOrg: '源库中心' },
    { dataSourceId: 'S-ABC', dataSourceOrg: '机构B' },
  ]

  it('空关键字返回全部候选', () => {
    expect(filterSourceOptions(options, '')).toEqual(options)
    expect(filterSourceOptions(options, '  ')).toEqual(options)
    expect(filterSourceOptions(options, undefined)).toEqual(options)
  })

  it('同等级命中保持原始顺序；不命中机构的不被误选', () => {
    const result = filterSourceOptions(options, 'src')
    // 'SRC-01' 与 'src2' 均为 ID 前缀命中（忽略大小写），保持原始顺序；
    // 'TGT-X'（机构“源库中心”）、'S-ABC'（机构“机构B”）不命中。
    const ids = result.map((o) => o.dataSourceId)
    expect(ids).toEqual(['SRC-01', 'src2'])
  })

  it('四级全命中时按 ①ID精确 ②ID前缀 ③ID模糊 ④机构模糊 排序', () => {
    const o = [
      { dataSourceId: 'AB', dataSourceOrg: 'x' },
      { dataSourceId: 'ABC', dataSourceOrg: 'x' },
      { dataSourceId: 'ZAB', dataSourceOrg: 'x' },
      { dataSourceId: 'Z1', dataSourceOrg: 'ab 中心' },
    ]
    const result = filterSourceOptions(o, 'AB')
    expect(result.map((r) => r.dataSourceId)).toEqual(['AB', 'ABC', 'ZAB', 'Z1'])
  })

  it('ID 匹配忽略大小写，关键字先 trim', () => {
    const result = filterSourceOptions(options, ' SRC-01 ')
    expect(result.map((r) => r.dataSourceId)).toEqual(['SRC-01'])
  })
})

describe('summarizeSelection / formatSelectionSummary 固定摘要', () => {
  it('统计源库/去重 Schema/表/目标库', () => {
    const summary = summarizeSelection(
      'S01',
      [
        { schemaName: 'A', tableName: 'T1' },
        { schemaName: 'A', tableName: 'T2' },
        { schemaName: 'B', tableName: 'T1' },
      ],
      ['T1', 'T2'],
    )
    expect(summary).toEqual({ sourceCount: 1, schemaCount: 2, tableCount: 3, targetCount: 2 })
    expect(formatSelectionSummary(summary)).toBe('已选择：1 个源库 · 2 个 Schema · 3 个表 · 2 个目标库')
  })

  it('空表单统计为 0', () => {
    expect(formatSelectionSummary(summarizeSelection(null, [], []))).toBe(
      '已选择：0 个源库 · 0 个 Schema · 0 个表 · 0 个目标库',
    )
  })
})

describe('describeRef / refStatusLabel 数据源引用展示', () => {
  it('NORMAL 显示机构（缺失回退 ID）、INACTIVE 显示机构、NOT_FOUND 显示原始 ID', () => {
    expect(refStatusLabel('NORMAL')).toBe('')
    expect(refStatusLabel('INACTIVE')).toBe('已停用')
    expect(refStatusLabel('NOT_FOUND')).toBe('不存在')

    expect(describeRef({ dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' })).toBe('机构A')
    expect(describeRef({ dataSourceId: 'S01', dataSourceOrg: null, status: 'NORMAL' })).toBe('S01')
    expect(describeRef({ dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'INACTIVE' })).toBe('机构A')
    expect(describeRef({ dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NOT_FOUND' })).toBe('S01')
  })
})

describe('highlightParts 搜索命中高亮（无注入）', () => {
  it('空关键字返回单段非命中', () => {
    expect(highlightParts('SRC-01', '')).toEqual([{ text: 'SRC-01', match: false }])
  })

  it('命中部分被标记，关键字忽略大小写', () => {
    const parts = highlightParts('SRC-01', 'src')
    expect(parts).toEqual([
      { text: 'SRC', match: true },
      { text: '-01', match: false },
    ])
  })

  it('多次命中均标记', () => {
    expect(highlightParts('ABAB', 'ab')).toEqual([
      { text: 'AB', match: true },
      { text: 'AB', match: true },
    ])
  })
})
