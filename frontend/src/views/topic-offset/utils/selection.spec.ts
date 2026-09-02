import { describe, it, expect } from 'vitest'
import {
  ALL_OPTION,
  buildCriteriaFromDraft,
  concreteIds,
  criteriaEqual,
  draftFromCriteria,
  isDefaultCriteria,
  normalizeDimension,
} from './selection'
import type { AppliedCriteria } from '@/types/topicOffset'

describe('normalizeDimension “全部/具体项”互斥（TOFF-REQ-023/024/025）', () => {
  it('选择具体项自动取消“全部”', () => {
    expect(normalizeDimension([ALL_OPTION], ['CLI-1'])).toEqual(['CLI-1'])
  })

  it('原值含“全部”时新增具体值去掉“全部”', () => {
    expect(normalizeDimension([ALL_OPTION], [ALL_OPTION, 'CLI-1'])).toEqual(['CLI-1'])
  })

  it('点击“全部”清空全部已选具体项', () => {
    expect(normalizeDimension(['A', 'B'], [ALL_OPTION, 'A', 'B'])).toEqual([ALL_OPTION])
  })

  it('清空全部具体项后恢复“全部”，不出现空白态', () => {
    expect(normalizeDimension(['A', 'B'], [])).toEqual([ALL_OPTION])
  })

  it('同维度内部去重', () => {
    expect(normalizeDimension([], ['A', 'A', 'B'])).toEqual(['A', 'B'])
  })
})

describe('buildCriteriaFromDraft：三“全部”→ 空数组、表名去首尾空格（TOFF-REQ-030）', () => {
  it('全部具体化后生成不可变待提交条件', () => {
    expect(buildCriteriaFromDraft([ALL_OPTION], [ALL_OPTION], [ALL_OPTION], '')).toEqual({
      clientIds: [],
      sourceIds: [],
      targetIds: [],
      tableName: '',
    })
  })

  it('具体 ID 原样透传、表名 trim、哨兵不进入条件', () => {
    expect(buildCriteriaFromDraft(['C1', ALL_OPTION], ['S1'], ['T1'], '  orders  ')).toEqual({
      clientIds: ['C1'],
      sourceIds: ['S1'],
      targetIds: ['T1'],
      tableName: 'orders',
    })
  })

  it('空表名/纯空格表名归一为空串', () => {
    expect(buildCriteriaFromDraft([], [], [], '   ').tableName).toBe('')
    expect(buildCriteriaFromDraft([], [], [], null as unknown as string).tableName).toBe('')
  })
})

describe('concreteIds / draftFromCriteria / isDefaultCriteria / criteriaEqual', () => {
  it('concreteIds 仅保留具体项', () => {
    expect(concreteIds([ALL_OPTION, 'A'])).toEqual(['A'])
  })

  it('draftFromCriteria(null) 三“全部”+空表名', () => {
    expect(draftFromCriteria(null)).toEqual({
      clients: [ALL_OPTION],
      sources: [ALL_OPTION],
      targets: [ALL_OPTION],
      tableName: '',
    })
  })

  it('draftFromCriteria 空维度还原为“全部”，非空维度还原为具体 ID', () => {
    const criteria: AppliedCriteria = { clientIds: ['C1'], sourceIds: [], targetIds: ['T1'], tableName: 't' }
    expect(draftFromCriteria(criteria)).toEqual({
      clients: ['C1'],
      sources: [ALL_OPTION],
      targets: ['T1'],
      tableName: 't',
    })
  })

  it('isDefaultCriteria：三全空+空表名为缺省', () => {
    expect(isDefaultCriteria({ clientIds: [], sourceIds: [], targetIds: [], tableName: '' })).toBe(true)
    expect(isDefaultCriteria({ clientIds: ['C1'], sourceIds: [], targetIds: [], tableName: '' })).toBe(false)
  })

  it('criteriaEqual：维度顺序无关、表名须一致', () => {
    const a: AppliedCriteria = { clientIds: ['A', 'B'], sourceIds: [], targetIds: [], tableName: 't' }
    const b: AppliedCriteria = { clientIds: ['B', 'A'], sourceIds: [], targetIds: [], tableName: 't' }
    const c: AppliedCriteria = { clientIds: ['A', 'B'], sourceIds: [], targetIds: [], tableName: 'T' }
    expect(criteriaEqual(a, b)).toBe(true)
    expect(criteriaEqual(a, c)).toBe(false)
  })
})
