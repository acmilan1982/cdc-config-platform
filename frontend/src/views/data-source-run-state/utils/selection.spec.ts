import { describe, it, expect } from 'vitest'
import type { AppliedCriteria } from '@/types/dataSourceSnapshot'
import {
  ALL_OPTION,
  buildCriteriaFromDraft,
  concreteIds,
  criteriaEqual,
  defaultCriteria,
  draftFromCriteria,
  normalizeDimension,
} from './selection'

describe('selection 哨兵草稿互斥与两阶段换算（DESIGN §7.2/§7.3）', () => {
  it('默认草稿为三维“全部”，已应用缺省为三维空（等价“全部”）', () => {
    expect(draftFromCriteria(null)).toEqual({
      clients: [ALL_OPTION],
      sources: [ALL_OPTION],
      statuses: [ALL_OPTION],
    })
    expect(defaultCriteria()).toEqual({ clientIds: [], sourceIds: [], statuses: [] })
  })

  it('“全部”与具体值互斥：选“全部”清空具体、选具体去“全部”、清空回“全部”', () => {
    expect(normalizeDimension([ALL_OPTION], ['c1'])).toEqual(['c1'])
    expect(normalizeDimension(['c1', 'c2'], [ALL_OPTION])).toEqual([ALL_OPTION])
    expect(normalizeDimension(['c1'], ['c1', 'c2'])).toEqual(['c1', 'c2'])
    expect(normalizeDimension(['c1'], [])).toEqual([ALL_OPTION])
    expect(normalizeDimension(['c1'], ['c1'])).toEqual(['c1'])
  })

  it('去重发生在 normalizeDimension；buildCriteriaFromDraft 透传已去重数组、只去哨兵', () => {
    expect(normalizeDimension([], ['a', 'b', 'a'])).toEqual(['a', 'b'])
    const a = buildCriteriaFromDraft(['x', 'y'], ['s'], ['RUNNING', 'COMPLETED'])
    expect(a.clientIds).toEqual(['x', 'y'])
    expect(a.statuses).toEqual(['RUNNING', 'COMPLETED'])
  })

  it('buildCriteriaFromDraft 移除全部哨兵、statuses 只留 token 具体值', () => {
    const c = buildCriteriaFromDraft([ALL_OPTION, 'hosp-012'], [ALL_OPTION], [ALL_OPTION])
    expect(c).toEqual({ clientIds: ['hosp-012'], sourceIds: [], statuses: [] })

    const c2 = buildCriteriaFromDraft(['hosp-012'], ['ds-01'], ['RUNNING', 'UNKNOWN'])
    expect(c2.statuses).toEqual(['RUNNING', 'UNKNOWN'])
  })

  it('draftFromCriteria 把已应用具体值还原为草稿（空维 → 全部）', () => {
    const applied: AppliedCriteria = { clientIds: ['hosp-012'], sourceIds: [], statuses: ['COMPLETED'] }
    expect(draftFromCriteria(applied)).toEqual({
      clients: ['hosp-012'],
      sources: [ALL_OPTION],
      statuses: ['COMPLETED'],
    })
  })

  it('criteriaEqual 对无序数组等价、不同则不等', () => {
    const a: AppliedCriteria = { clientIds: ['a', 'b'], sourceIds: [], statuses: ['RUNNING'] }
    const b: AppliedCriteria = { clientIds: ['b', 'a'], sourceIds: [], statuses: ['RUNNING'] }
    const c: AppliedCriteria = { clientIds: ['a', 'b'], sourceIds: [], statuses: ['COMPLETED'] }
    expect(criteriaEqual(a, b)).toBe(true)
    expect(criteriaEqual(a, c)).toBe(false)
    expect(criteriaEqual(defaultCriteria(), defaultCriteria())).toBe(true)
  })

  it('concreteIds 只保留具体值、过滤哨兵', () => {
    expect(concreteIds([ALL_OPTION, 'x', ALL_OPTION, 'y'])).toEqual(['x', 'y'])
  })
})
