<template>
  <div class="lsr-container">
    <!-- 近7天同步量趋势 -->
    <div class="lsr-panel lsr-chart-panel">
      <div class="lsr-panel-header">近 7 天同步量趋势</div>
      <div class="lsr-panel-body">
        <div ref="trendChartRef" class="lsr-chart"></div>
      </div>
    </div>

    <!-- 同步表 Top10 -->
    <div class="lsr-panel lsr-rank-panel">
      <div class="lsr-panel-header">同步表 Top10</div>
      <div class="lsr-panel-body lsr-rank-body">
        <div v-if="tableList.length === 0" class="lsr-empty">暂无统计数据</div>
        <div class="lsr-rank-item" v-for="(item, idx) in tableList" :key="item.key || idx">
          <span class="lsr-rank-num" :class="'lsr-rank-' + (idx + 1)">{{ idx + 1 }}</span>
          <div class="lsr-rank-info">
            <span class="lsr-rank-name" :title="item.name">{{ shortTableName(item.name) }}</span>
            <div class="lsr-rank-detail">
              <span class="lsr-detail-success">成功 {{ fmtVol(item.successCount) }}</span>
              <span v-if="(item.errorCount || 0) > 0" class="lsr-detail-error">错误 {{ fmtVol(item.errorCount) }}</span>
            </div>
          </div>
          <span class="lsr-rank-val">{{ fmtVol(item.totalCount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { DailyTrendVO, TopItemVO } from '@/types/largeScreen'

const props = defineProps<{
  sevenDayTrend: DailyTrendVO[]
  tables: TopItemVO[]
}>()

const trendChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null

const tableList = computed(() => {
  return [...props.tables].sort((a, b) => (a.rank || 0) - (b.rank || 0))
})

function shortTableName(name: string): string {
  if (!name) return ''
  const parts = name.split('.')
  return parts.length >= 3 ? parts.slice(1).join('.') : name
}

function fmtVol(v: number | undefined | null): string {
  if (v == null) return '--'
  if (v >= 100000000) return (v / 100000000).toFixed(1) + '亿'
  if (v >= 10000) return (v / 10000).toFixed(1) + '万'
  return v.toLocaleString()
}

function buildChartOption() {
  const trend = props.sevenDayTrend
  const dates = trend.map(d => d.date ? d.date.slice(5) : '')
  const values = trend.map(d => d.count ?? 0)
  return {
    tooltip: {
      trigger: 'axis',
      textStyle: { color: '#fff', fontSize: 11 },
      backgroundColor: 'rgba(4,20,50,0.9)',
      borderColor: '#00e5ff',
      formatter: (params: any) => {
        const p = params[0]; const idx = p.dataIndex; const t = trend[idx]
        return t ? `${t.date} ${t.weekday}<br/>同步量: ${p.value.toLocaleString()}` : p.axisValue
      }
    },
    grid: { left: 12, right: 12, top: 20, bottom: 10, containLabel: true },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: 'rgba(0,200,255,0.25)' } }, axisTick: { show: false }, axisLabel: { color: '#8aa0b8', fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(0,200,255,0.08)' } }, axisLabel: { color: '#8aa0b8', fontSize: 10, formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : String(v) } },
    series: [{
      type: 'line', data: values, smooth: true, symbol: 'circle', symbolSize: 6,
      lineStyle: { color: '#00e5ff', width: 2 },
      itemStyle: { color: '#00e5ff', borderColor: '#fff', borderWidth: 1 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0,229,255,0.25)' }, { offset: 1, color: 'rgba(0,229,255,0.02)' }]) }
    }]
  } as echarts.EChartsOption
}

function initChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption(buildChartOption())
}

watch(() => props.sevenDayTrend, () => { trendChart?.setOption(buildChartOption()) }, { deep: true })

onMounted(() => { initChart() })
onBeforeUnmount(() => { trendChart?.dispose(); trendChart = null })
</script>

<style scoped>
.lsr-container { height: 100%; display: flex; flex-direction: column; gap: 16px; }

.lsr-panel {
  display: flex; flex-direction: column;
  border: 1px solid rgba(0, 210, 255, 0.3); background: rgba(5, 22, 52, 0.85); position: relative;
}
.lsr-panel::before {
  content: ''; position: absolute; top: -1px; left: 15px; right: 15px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent);
}
.lsr-panel-header {
  height: 34px; line-height: 34px; text-align: center; font-size: 14px; font-weight: 700;
  color: #e0f4ff; background: url('@/assets/large-screen/source/panel_bg.png') no-repeat center;
  background-size: 100% 100%;
}
.lsr-panel-body { flex: 1; min-height: 0; }

/* 折线图 */
.lsr-chart-panel { flex: 2.2; }
.lsr-chart { width: 100%; height: 100%; }

/* 表排名 */
.lsr-rank-panel { flex: 3.5; min-height: 0; }
.lsr-rank-body { overflow: hidden; padding: 4px 8px; }
.lsr-empty { text-align: center; padding-top: 24px; color: #8aa0b8; font-size: 13px; }
.lsr-rank-item { display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(0, 200, 255, 0.06); font-size: 11px; gap: 6px; }
.lsr-rank-item:last-child { border-bottom: none; }
.lsr-rank-num { width: 20px; height: 20px; line-height: 20px; text-align: center; font-weight: 700; font-size: 11px; border-radius: 3px; flex-shrink: 0; }
.lsr-rank-1 { background: rgba(255,107,53,0.25); color: #ff6b35; }
.lsr-rank-2 { background: rgba(255,167,38,0.25); color: #ffa726; }
.lsr-rank-3 { background: rgba(102,187,106,0.25); color: #66bb6a; }
.lsr-rank-num:not(.lsr-rank-1):not(.lsr-rank-2):not(.lsr-rank-3) { background: rgba(66,165,245,0.2); color: #42a5f5; }
.lsr-rank-info { flex: 1; min-width: 0; }
.lsr-rank-name { display: block; color: #dce8f4; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.lsr-rank-detail { display: flex; gap: 8px; font-size: 10px; }
.lsr-detail-success { color: #69f0ae; }
.lsr-detail-error { color: #ff6b6b; }
.lsr-rank-val { color: #00f4ff; font-weight: 700; font-size: 12px; white-space: nowrap; min-width: 48px; text-align: right; }
</style>
