<template>
  <div class="lsl-container">
    <!-- 今日核心指标 -->
    <div class="lsl-panel lsl-metrics-panel">
      <div class="lsl-panel-header">今日核心指标</div>
      <div class="lsl-panel-body lsl-metrics-body">
        <div class="lsl-metric-row">
          <div class="lsl-metric-item">
            <div class="lsl-metric-label">今日同步量</div>
            <div class="lsl-metric-value">{{ fmtVol(metrics.todaySync) }}</div>
          </div>
          <div class="lsl-metric-item">
            <div class="lsl-metric-label">今日成功量</div>
            <div class="lsl-metric-value lsl-color-success">{{ fmtVol(metrics.todaySuccess) }}</div>
          </div>
        </div>
        <div class="lsl-metric-row">
          <div class="lsl-metric-item">
            <div class="lsl-metric-label">今日错误量</div>
            <div class="lsl-metric-value lsl-color-error">{{ fmtVol(metrics.todayError) }}</div>
          </div>
          <div class="lsl-metric-item">
            <div class="lsl-metric-label">今日成功率</div>
            <div class="lsl-metric-value lsl-color-accent">{{ fmtRate(metrics.todaySuccessRate) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 正确/错误数据占比 环形图 -->
    <div class="lsl-panel lsl-chart-panel">
      <div class="lsl-panel-header">正确/错误数据占比</div>
      <div class="lsl-panel-body">
        <div ref="ratioChartRef" class="lsl-chart"></div>
        <div class="lsl-chart-center">
          <div class="lsl-center-pct">{{ totalRatioCount === 0 ? '--' : successRatePct + '%' }}</div>
          <div class="lsl-center-sub">{{ totalRatioCount === 0 ? '暂无今日数据' : '成功率' }}</div>
        </div>
      </div>
    </div>

    <!-- 源库同步量 Top10 -->
    <div class="lsl-panel lsl-rank-panel">
      <div class="lsl-panel-header">源库同步量 Top10</div>
      <div class="lsl-panel-body lsl-rank-body">
        <div v-if="sourceList.length === 0" class="lsl-empty">暂无统计数据</div>
        <div class="lsl-rank-item" v-for="(item, idx) in sourceList" :key="item.key || idx">
          <span class="lsl-rank-num" :class="'lsl-rank-' + (idx + 1)">{{ idx + 1 }}</span>
          <span class="lsl-rank-name" :title="item.name">{{ item.name }}</span>
          <span class="lsl-rank-val">{{ fmtVol(item.totalCount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { CoreMetricsVO, DataRatioVO, TopItemVO } from '@/types/largeScreen'

const props = defineProps<{
  coreMetrics: CoreMetricsVO | null
  todayRatio: DataRatioVO | null
  sourceDatabases: TopItemVO[]
}>()

const ratioChartRef = ref<HTMLElement | null>(null)
let ratioChart: echarts.ECharts | null = null

const metrics = computed(() => props.coreMetrics || {
  todaySync: 0, cumulativeSync: 0, todaySuccess: 0, todayError: 0, todaySuccessRate: 0
} as CoreMetricsVO)

const sourceList = computed(() => {
  return [...props.sourceDatabases].sort((a, b) => (a.rank || 0) - (b.rank || 0))
})

const totalRatioCount = computed(() => (props.todayRatio?.successCount || 0) + (props.todayRatio?.errorCount || 0))

const successRatePct = computed(() => {
  if (!props.todayRatio) return '--'
  if (totalRatioCount.value === 0) return '--'
  return ((props.todayRatio.successCount / totalRatioCount.value) * 100).toFixed(2)
})

function fmtVol(v: number | undefined | null): string {
  if (v == null) return '--'
  if (v >= 100000000) return (v / 100000000).toFixed(1) + '亿'
  if (v >= 10000) return (v / 10000).toFixed(1) + '万'
  return v.toLocaleString()
}

function fmtRate(v: number | undefined | null): string {
  if (v == null) return '--'
  return v.toFixed(2)
}

function buildChartOption() {
  const r = props.todayRatio
  const s = r?.successCount ?? 0
  const e = r?.errorCount ?? 0
  const total = s + e
  if (total === 0) {
    return {
      series: [{
        type: 'pie', radius: ['55%', '72%'], center: ['50%', '48%'],
        silent: true,
        itemStyle: { borderColor: 'transparent', borderWidth: 0 },
        label: { show: false },
        data: [{ value: 1, name: '', itemStyle: { color: 'rgba(0,200,255,0.12)' } }]
      }]
    } as echarts.EChartsOption
  }
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        const pct = total > 0 ? ((p.value / total) * 100).toFixed(2) : '0.00'
        return `${p.name}: ${p.value.toLocaleString()} (${pct}%)`
      },
      textStyle: { color: '#fff', fontSize: 12 }
    },
    legend: { bottom: 5, textStyle: { color: '#b0c8e0', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['55%', '72%'], center: ['50%', '48%'],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: 'transparent', borderWidth: 0 },
      label: { show: true, position: 'outside', color: '#c0d0e0', fontSize: 11, formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: 'rgba(0,200,255,0.3)' } },
      data: [
        { value: s, name: '正确数据', itemStyle: { color: '#00e5ff' } },
        { value: e, name: '错误数据', itemStyle: { color: '#ff6b6b' } }
      ]
    }]
  } as echarts.EChartsOption
}

function initChart() {
  if (!ratioChartRef.value) return
  ratioChart = echarts.init(ratioChartRef.value)
  ratioChart.setOption(buildChartOption())
}

watch(() => props.todayRatio, () => { ratioChart?.setOption(buildChartOption()) }, { deep: true })

onMounted(() => { initChart() })
onBeforeUnmount(() => { ratioChart?.dispose(); ratioChart = null })
</script>

<style scoped>
.lsl-container { height: 100%; display: flex; flex-direction: column; gap: 16px; }

.lsl-panel {
  display: flex; flex-direction: column;
  border: 1px solid rgba(0, 210, 255, 0.3); background: rgba(5, 22, 52, 0.85); position: relative;
}
.lsl-panel::before {
  content: ''; position: absolute; top: -1px; left: 15px; right: 15px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent);
}
.lsl-panel-header {
  height: 34px; line-height: 34px; text-align: center; font-size: 14px; font-weight: 700;
  color: #e0f4ff; background: url('@/assets/large-screen/source/panel_bg.png') no-repeat center;
  background-size: 100% 100%;
}
.lsl-panel-body { flex: 1; min-height: 0; position: relative; }

/* 今日指标 */
.lsl-metrics-panel { flex: 1.2; }
.lsl-metrics-body { display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 4px 12px; }
.lsl-metric-row { display: flex; gap: 8px; }
.lsl-metric-item { flex: 1; text-align: center; padding: 4px 0; }
.lsl-metric-label { font-size: 11px; color: #a0b8d0; margin-bottom: 2px; }
.lsl-metric-value { font-size: 18px; font-weight: 700; color: #00f0ff; text-shadow: 0 0 10px rgba(0,240,255,0.4); }
.lsl-color-success { color: #69f0ae; text-shadow: 0 0 10px rgba(105,240,174,0.4); }
.lsl-color-error { color: #ff6b6b; text-shadow: 0 0 10px rgba(255,107,107,0.4); }
.lsl-color-accent { color: #ffd54f; text-shadow: 0 0 10px rgba(255,213,79,0.4); }

/* 环形图 */
.lsl-chart-panel { flex: 2; }
.lsl-chart { width: 100%; height: 100%; }
.lsl-chart-center { position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; }
.lsl-center-pct { font-size: 20px; font-weight: 700; color: #00f4ff; text-shadow: 0 0 14px rgba(0,244,255,0.6); }
.lsl-center-sub { font-size: 11px; color: #7bd8f7; margin-top: 2px; }

/* 源库 Top10 */
.lsl-rank-panel { flex: 3; min-height: 0; }
.lsl-rank-body { overflow: hidden; padding: 4px 8px; }
.lsl-empty { text-align: center; padding-top: 24px; color: #8aa0b8; font-size: 13px; }
.lsl-rank-item { display: flex; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(0, 200, 255, 0.06); font-size: 12px; }
.lsl-rank-item:last-child { border-bottom: none; }
.lsl-rank-num { width: 20px; height: 20px; line-height: 20px; text-align: center; font-weight: 700; font-size: 11px; border-radius: 3px; flex-shrink: 0; margin-right: 6px; }
.lsl-rank-1 { background: rgba(255,107,53,0.25); color: #ff6b35; }
.lsl-rank-2 { background: rgba(255,167,38,0.25); color: #ffa726; }
.lsl-rank-3 { background: rgba(102,187,106,0.25); color: #66bb6a; }
.lsl-rank-num:not(.lsl-rank-1):not(.lsl-rank-2):not(.lsl-rank-3) { background: rgba(66,165,245,0.2); color: #42a5f5; }
.lsl-rank-name { flex: 1; color: #d8e8f8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lsl-rank-val { color: #00f4ff; font-weight: 700; font-size: 12px; margin-left: 8px; white-space: nowrap; }
</style>
