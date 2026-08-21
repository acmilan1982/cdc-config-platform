import { describe, it, expect } from 'vitest'
import { dsCellText, dsTooltipText, dsDetailText } from './dsDisplay'

describe('数据源四态降级展示（LQ-DESIGN-180）', () => {
  it('名称等于 ID 时视为名称缺失，不出现 ID（ID）', () => {
    expect(dsCellText('DS_SRC_001', 'DS_SRC_001')).toBe('DS_SRC_001')
    expect(dsTooltipText('DS_SRC_001', 'DS_SRC_001')).toBe('数据源 ID：DS_SRC_001')
    expect(dsDetailText('DS_SRC_001', 'DS_SRC_001')).toBe('DS_SRC_001')
  })

  it('四态降级在单元格/Tooltip/详情三处展示一致', () => {
    // 1) 名称真实
    expect(dsCellText('业务库-订单', 'DS_SRC_001')).toBe('业务库-订单')
    expect(dsTooltipText('业务库-订单', 'DS_SRC_001')).toBe('业务库-订单  数据源 ID：DS_SRC_001')
    expect(dsDetailText('业务库-订单', 'DS_SRC_001')).toBe('业务库-订单（DS_SRC_001）')

    // 2) 名称为空白 → 未定义名称
    expect(dsCellText('   ', 'DS_SRC_001')).toBe('未定义名称')
    expect(dsTooltipText('', 'DS_SRC_001')).toBe('数据源 ID：DS_SRC_001')
    expect(dsDetailText('', 'DS_SRC_001')).toBe('未定义名称（DS_SRC_001）')

    // 3) 名称缺失但 ID 存在 → 显示原始 ID 一次
    expect(dsCellText(undefined, 'DS_SRC_001')).toBe('DS_SRC_001')
    expect(dsTooltipText(null, 'DS_SRC_001')).toBe('数据源 ID：DS_SRC_001')
    expect(dsDetailText(undefined, 'DS_SRC_001')).toBe('DS_SRC_001')

    // 4) 名称与 ID 皆缺失 → --
    expect(dsCellText(undefined, undefined)).toBe('--')
    expect(dsTooltipText(undefined, undefined)).toBe('未定义名称')
    expect(dsDetailText(null, null)).toBe('--')
  })
})
