import { describe, it, expect } from 'vitest'
import { ALL_DATA_SOURCE } from '../composables/useLogQueryTab'
import { normalizeSelection } from './selection'

describe('“全部”与具体数据源双向即时互斥（LQ-DESIGN-170）', () => {
  it('点击“全部”取消全部已选具体值', () => {
    expect(normalizeSelection(['A', 'B'], [ALL_DATA_SOURCE, 'A', 'B'])).toEqual([ALL_DATA_SOURCE])
  })

  it('选择任一具体值取消“全部”', () => {
    expect(normalizeSelection([ALL_DATA_SOURCE], ['A'])).toEqual(['A'])
  })

  it('原值含“全部”时新增具体值去掉“全部”', () => {
    expect(normalizeSelection([ALL_DATA_SOURCE], [ALL_DATA_SOURCE, 'A'])).toEqual(['A'])
  })

  it('清空全部具体值恢复“全部”', () => {
    expect(normalizeSelection(['A'], [])).toEqual([ALL_DATA_SOURCE])
  })
})
