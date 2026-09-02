import type { AppliedCriteria } from '@/types/topicOffset'

/** “全部”哨兵，仅在表单草稿层存在，绝不作为真实值请求（DESIGN §6.4）。 */
export const ALL_OPTION = '__ALL__'

/**
 * 多选互斥：“全部”与具体值互斥（语义同 log-query selection.ts）。
 * 原值含“全部”时新增具体值 → 去掉“全部”；原值无“全部”时选了“全部” → 只保留“全部”。
 * 清空后恢复“全部”，避免出现无任何选择的空白态。
 */
export function normalizeDimension(prev: string[], next: string[]): string[] {
  if (next.length === 0) return [ALL_OPTION]
  if (next.includes(ALL_OPTION)) {
    if (prev.includes(ALL_OPTION)) {
      return Array.from(new Set(next.filter((v) => v !== ALL_OPTION)))
    }
    return [ALL_OPTION]
  }
  return Array.from(new Set(next))
}

/** 移除“全部”哨兵，仅保留具体选中 ID。 */
export function concreteIds(selection: string[]): string[] {
  return selection.filter((v) => v !== ALL_OPTION)
}

/** 是否为缺省条件（三个维度全“全部”、表名为空）。 */
export function isDefaultCriteria(criteria: AppliedCriteria): boolean {
  return (
    criteria.clientIds.length === 0 &&
    criteria.sourceIds.length === 0 &&
    criteria.targetIds.length === 0 &&
    criteria.tableName.length === 0
  )
}

/** 从草稿（含 __ALL__ 的三维 + 原始表名）生成不可变待提交条件；表名提交前去首尾空格（TOFF-REQ-030）。 */
export function buildCriteriaFromDraft(
  clients: string[],
  sources: string[],
  targets: string[],
  tableName: string,
): AppliedCriteria {
  return {
    clientIds: concreteIds(clients),
    sourceIds: concreteIds(sources),
    targetIds: concreteIds(targets),
    tableName: tableName == null ? '' : tableName.trim(),
  }
}

/** 将已生效条件还原为查询区草稿（具体 ID 为空即表示“全部”）。 */
export function draftFromCriteria(criteria: AppliedCriteria | null): {
  clients: string[]
  sources: string[]
  targets: string[]
  tableName: string
} {
  if (!criteria) {
    return { clients: [ALL_OPTION], sources: [ALL_OPTION], targets: [ALL_OPTION], tableName: '' }
  }
  return {
    clients: criteria.clientIds.length > 0 ? [...criteria.clientIds] : [ALL_OPTION],
    sources: criteria.sourceIds.length > 0 ? [...criteria.sourceIds] : [ALL_OPTION],
    targets: criteria.targetIds.length > 0 ? [...criteria.targetIds] : [ALL_OPTION],
    tableName: criteria.tableName,
  }
}

/** 两个已生效条件是否等价（用于判定候选刷新差集等）。 */
export function criteriaEqual(a: AppliedCriteria, b: AppliedCriteria): boolean {
  return (
    sameList(a.clientIds, b.clientIds) &&
    sameList(a.sourceIds, b.sourceIds) &&
    sameList(a.targetIds, b.targetIds) &&
    a.tableName === b.tableName
  )
}

function sameList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((v) => set.has(v))
}
