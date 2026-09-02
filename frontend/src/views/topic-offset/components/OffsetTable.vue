<template>
  <el-table
    :data="records"
    v-loading="loading"
    size="small"
    border
    class="toff-table"
    :empty-text="props.emptyText"
    :row-key="rowKey"
  >
    <el-table-column label="序号" width="70" align="center" fixed="left">
      <template #default="{ $index }">
        <span class="toff-seq">{{ startIndex + $index }}</span>
      </template>
    </el-table-column>
    <el-table-column label="同步对象" min-width="380" fixed="left">
      <template #default="{ row }">
        <el-tooltip placement="top">
          <template #content>
            <div>{{ row.rawTopic }}</div>
            <div v-if="!row.parseable" class="toff-tip-unparse">
              该 Topic 无法按“客户端.源库.Schema.表名.目标库”拆分，请人工核对 Topic 命名。
            </div>
          </template>
          <div class="toff-sync-cell">
            <template v-if="row.parseable && row.mapping && row.parsed">
              <div class="toff-sync-line">
                <template v-for="(seg, i) in firstLine(row)" :key="i">
                  <span class="toff-seg-text">{{ seg.text }}</span>
                  <el-tag v-if="seg.tag" size="small" :type="seg.tagType" class="toff-seg-tag">{{ seg.tag }}</el-tag>
                  <span v-if="i < firstLine(row).length - 1" class="toff-arrow">→</span>
                </template>
              </div>
              <div class="toff-sync-line toff-schema">{{ row.parsed.schema }}.{{ row.parsed.table }}</div>
            </template>
            <div v-else class="toff-sync-line toff-unparse">Topic 格式无法解析</div>
          </div>
        </el-tooltip>
      </template>
    </el-table-column>
    <el-table-column label="已保存消费位置" width="160" align="right">
      <template #default="{ row }">
        <span class="toff-offset">{{ textOrDash(row.nextOffset) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Kafka 末端位置" width="160" align="right">
      <template #default="{ row }">
        <span class="toff-offset">{{ textOrDash(row.kafkaEndOffset) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="待消费数量" width="140" align="right">
      <template #default="{ row }">
        <span class="toff-offset">{{ textOrDash(row.pendingCount) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="消费延迟" width="140" align="right">
      <template #default="{ row }">
        <span class="toff-offset">{{ textOrDash(row.consumeLag) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="断点更新时间" width="170" align="center">
      <template #default="{ row }">
        <span class="toff-time">{{ row.updatedAt ?? '—' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="中心端" width="150" show-overflow-tooltip>
      <template #default="{ row }">
        <span>{{ row.serverId }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import type { TopicMappingRef, TopicOffsetItem } from '@/types/topicOffset'
import { rowKey } from '@/views/topic-offset/utils/rowKey'

interface Seg {
  text: string
  tag?: string
  tagType?: 'warning' | 'info'
}

const props = withDefaults(
  defineProps<{
    records: TopicOffsetItem[]
    loading: boolean
    startIndex: number
    /** 空结果文案（TOFF-REQ-116）。 */
    emptyText?: string
  }>(),
  { emptyText: '暂无符合条件的数据' },
)

const DASH = '—'

function textOrDash(value: string | null | undefined): string {
  return value === null || value === undefined ? DASH : value
}

function refLabel(ref: TopicMappingRef): Seg {
  if (ref.state === 'NOT_FOUND') {
    return { text: ref.id, tag: '配置不存在', tagType: 'info' }
  }
  if (ref.state === 'INACTIVE') {
    return { text: ref.id, tag: '已停用', tagType: 'warning' }
  }
  return { text: ref.id }
}

function sourceTargetLabel(ref: TopicMappingRef): Seg {
  if (ref.state === 'NOT_FOUND') {
    return { text: ref.id, tag: '配置不存在', tagType: 'info' }
  }
  const org = ref.org && ref.org.trim().length > 0 ? ref.org : '未定义名称'
  if (ref.state === 'INACTIVE') {
    return { text: org, tag: '已停用', tagType: 'warning' }
  }
  return { text: org }
}

function firstLine(row: TopicOffsetItem): Seg[] {
  const m = row.mapping
  if (!m) return []
  return [
    refLabel(m.client),
    sourceTargetLabel(m.source),
    sourceTargetLabel(m.target),
  ]
}
</script>

<style scoped>
.toff-table {
  width: 100%;
}
.toff-seq {
  font-variant-numeric: tabular-nums;
}
.toff-sync-cell {
  line-height: 1.5;
  cursor: pointer;
}
.toff-sync-line {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow: hidden;
}
.toff-seg-text {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.toff-seg-tag {
  margin: 0 2px;
}
.toff-arrow {
  margin: 0 4px;
  color: #98a2b3;
}
.toff-schema {
  color: #475467;
  font-size: 12px;
}
.toff-unparse {
  color: #d92d20;
}
.toff-tip-unparse {
  color: #98a2b3;
  max-width: 420px;
}
.toff-offset {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.toff-time {
  white-space: nowrap;
}
</style>
