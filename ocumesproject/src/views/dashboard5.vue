<template>
  <div class="dashboard-container">

    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-green">能源與碳排監控 (ESG)</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">廠務經理：陳建國</div>
      </div>
    </header>

    <main class="main-content">

      <!-- API 狀態列 -->
      <div class="api-bar">
        <span :class="apiConnected ? 'api-ok' : 'api-err'">
          {{ apiConnected ? '🟢 API 連線正常' : '🔴 API 連線失敗（顯示預設數據）' }}
        </span>
        <span class="api-time">最後更新：{{ updatedAt }}</span>
      </div>

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="card kpi-card" v-for="kpi in esgKpis" :key="kpi.label">
          <div class="kpi-icon-wrapper" :class="kpi.colorClass">
            <span class="kpi-icon">{{ kpi.icon }}</span>
          </div>
          <div class="kpi-info">
            <p class="kpi-label">{{ kpi.label }}</p>
            <p class="kpi-value">
              {{ kpi.value }} <span class="kpi-unit">{{ kpi.unit }}</span>
            </p>
          </div>
        </div>
      </section>

      <!-- 圖表 -->
      <section class="chart-grid">
        <div class="card chart-card">
          <div class="card-header dark flex-between">
            <span>⚡ 全廠用電負載趨勢（今日每小時）</span>
            <span class="text-sm text-cyan">太陽能佔比：{{ solarPercent }}%</span>
          </div>
          <div class="card-body chart-body">
            <div ref="powerChartRef" class="echarts-container"></div>
          </div>
        </div>

        <div class="card chart-card">
          <div class="card-header dark">🍃 碳排放源佔比分析 (Scope 1 & Scope 2)</div>
          <div class="card-body chart-body">
            <div ref="carbonPieRef" class="echarts-container"></div>
          </div>
        </div>
      </section>

      <!-- 高耗能設備 -->
      <section class="bottom-section">
        <div class="card w-full">
          <div class="card-header bg-slate-100 font-bold text-dark">
            🔥 廠區高耗能設備即時監控 (Top 3)
          </div>
          <div class="card-body p-1-5">
            <div class="energy-hog-list">
              <div class="hog-item" v-for="(machine, index) in topConsumers" :key="machine.id">
                <div class="hog-info">
                  <span class="hog-rank">#{{ index + 1 }}</span>
                  <span class="hog-name">{{ machine.name }}</span>
                  <span class="hog-power text-orange">{{ machine.kwh }} kWh</span>
                </div>
                <div class="progress-container">
                  <div
                    class="progress-bar striped-bg"
                    :style="{ width: machine.usagePercent + '%', backgroundColor: getPowerColor(machine.usagePercent) }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import NavDrawer from '@/components/NavDrawer.vue'

const API_URL      = 'http://localhost:1880/energy'
const POLL_INTERVAL = 60000 // 每分鐘更新

// 時間
const currentTime = ref('')
let timeTimer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

// API 狀態
const apiConnected = ref(false)
const updatedAt    = ref('--')

// 原始 API 資料
const energyData = ref(null)

// KPI 計算
const solarPercent = computed(() => {
  if (!energyData.value) return '--'
  return ((energyData.value.solarKwh / energyData.value.totalKwh) * 100).toFixed(1)
})

const esgKpis = computed(() => {
  const d = energyData.value
  return [
    { label: '今日累積用電量', value: d ? d.totalKwh.toLocaleString() : '12,450', unit: 'kWh',   icon: '⚡', colorClass: 'icon-bg-blue'  },
    { label: '預估碳排放當量', value: d ? d.carbonTon : '6.24',                   unit: 'tCO2e', icon: '☁️', colorClass: 'icon-bg-gray'  },
    { label: '製程回收水用量', value: d ? d.waterTon : '450',                      unit: '噸',    icon: '💧', colorClass: 'icon-bg-cyan'  },
    { label: '太陽能發電佔比', value: d ? solarPercent.value : '12.5',             unit: '%',     icon: '☀️', colorClass: 'icon-bg-green' },
  ]
})

// 高耗能設備（API machines + 計算佔比）
const topConsumers = computed(() => {
  if (!energyData.value?.machines) return [
    { name: '射出成型機 A', kwh: 450, usagePercent: 92 },
    { name: '射出成型機 B', kwh: 380, usagePercent: 78 },
    { name: 'CNC 加工機 A', kwh: 310, usagePercent: 65 },
  ]
  const machines = energyData.value.machines
  const maxKwh   = Math.max(...machines.map(m => m.kwh))
  return machines.map(m => ({
    name:         m.name,
    kwh:          m.kwh,
    usagePercent: Math.round((m.kwh / maxKwh) * 100)
  }))
})

const getPowerColor = (percent) => {
  if (percent >= 90) return '#ef4444'
  if (percent >= 75) return '#f97316'
  return '#10b981'
}

// ECharts
const powerChartRef = ref(null)
const carbonPieRef  = ref(null)
let powerChart = null
let carbonPie  = null

const initCharts = () => {
  if (typeof window.echarts === 'undefined') return

  if (powerChartRef.value) {
    powerChart = window.echarts.init(powerChartRef.value)
    updatePowerChart([])
  }
  if (carbonPieRef.value) {
    carbonPie = window.echarts.init(carbonPieRef.value)
    carbonPie.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} tCO2e ({d}%)', backgroundColor: 'rgba(15,23,42,0.9)', textStyle: { color: '#fff' } },
      legend: { orient: 'vertical', right: '5%', top: 'middle', textStyle: { color: '#475569', fontWeight: 'bold' } },
      series: [{
        name: '碳排來源', type: 'pie', radius: ['50%', '70%'], center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false }, emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#1e293b' } },
        labelLine: { show: false },
        data: [
          { value: 1048, name: '外購電力 (Scope 2)', itemStyle: { color: '#3b82f6' } },
          { value: 335,  name: '空調冷媒洩漏',       itemStyle: { color: '#06b6d4' } },
          { value: 234,  name: '公務車汽柴油',       itemStyle: { color: '#f59e0b' } },
          { value: 135,  name: '製程直接排放',       itemStyle: { color: '#ef4444' } },
        ]
      }]
    })
  }

  window.addEventListener('resize', handleResize)
}

const updatePowerChart = (hourlyKwh) => {
  if (!powerChart) return
  const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`)
  powerChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.9)', textStyle: { color: '#fff' } },
    legend: { data: ['今日用電 (kWh)'], bottom: 0, textStyle: { color: '#64748b' } },
    grid: { top: '10%', left: '5%', right: '5%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: labels, axisLabel: { color: '#64748b', rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    series: [{
      name: '今日用電 (kWh)', type: 'line', smooth: true,
      lineStyle: { width: 3, color: '#0ea5e9' },
      areaStyle: {
        color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(14,165,233,0.4)' }, { offset: 1, color: 'rgba(14,165,233,0.0)' }
        ])
      },
      data: hourlyKwh.length ? hourlyKwh : Array(24).fill(0)
    }]
  })
}

const handleResize = () => {
  powerChart?.resize()
  carbonPie?.resize()
}

// API
let pollTimer = null
const fetchEnergy = async () => {
  try {
    const res  = await fetch(API_URL)
    const json = await res.json()
    if (json.data) {
      energyData.value   = json.data
      apiConnected.value = true
      updatedAt.value    = new Date().toTimeString().split(' ')[0]
      updatePowerChart(json.data.hourlyKwh || [])
    } else {
      apiConnected.value = false
    }
  } catch (e) {
    apiConnected.value = false
  }
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  nextTick(() => {
    initCharts()
    fetchEnergy()
    pollTimer = setInterval(fetchEnergy, POLL_INTERVAL)
  })
})

onUnmounted(() => {
  clearInterval(timeTimer)
  clearInterval(pollTimer)
  window.removeEventListener('resize', handleResize)
  powerChart?.dispose()
  carbonPie?.dispose()
})
</script>

<style scoped>
/* 固定 NavBar */
.dashboard-container {
  height: 100vh;
  background-color: #475569;
  color: #1e293b;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.header {
  background-color: #0f172a;
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 10;
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-green { background-color: #10b981; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; margin-top: 0.2rem; }

/* 內容區可滾動 */
.main-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* API 狀態列 */
.api-bar { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: bold; flex-shrink: 0; }
.api-ok  { color: #16a34a; }
.api-err { color: #dc2626; }
.api-time { color: #94a3b8; font-weight: normal; }

.card { background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
.card-header { padding: 1rem 1.5rem; font-weight: bold; border-bottom: 1px solid #e5e7eb; }
.card-header.dark { background-color: #1e293b; color: white; border-bottom: none; }
.bg-slate-100 { background-color: #f1f5f9; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.w-full { width: 100%; }
.p-1-5 { padding: 1.5rem; }

.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
.kpi-card { display: flex; flex-direction: row; align-items: center; padding: 1.5rem; gap: 1.25rem; }
.kpi-icon-wrapper { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
.icon-bg-blue  { background-color: #e0f2fe; color: #0284c7; }
.icon-bg-gray  { background-color: #f1f5f9; color: #475569; }
.icon-bg-cyan  { background-color: #cffafe; color: #0891b2; }
.icon-bg-green { background-color: #d1fae5; color: #059669; }
.kpi-info { display: flex; flex-direction: column; }
.kpi-label { margin: 0; font-size: 0.9rem; color: #64748b; font-weight: bold; margin-bottom: 0.25rem; }
.kpi-value { margin: 0; font-size: 2rem; font-weight: bold; color: #1e293b; line-height: 1; }
.kpi-unit { font-size: 1rem; color: #94a3b8; font-weight: normal; }

.chart-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 1.5rem; }
@media (max-width: 1024px) { .chart-grid { grid-template-columns: 1fr; } }
.chart-card { min-height: 400px; }
.chart-body { flex: 1; position: relative; padding: 1rem; }
.echarts-container { width: 100%; height: 100%; min-height: 320px; }

.energy-hog-list { display: flex; flex-direction: column; gap: 1rem; }
.hog-item { display: flex; flex-direction: column; gap: 0.5rem; }
.hog-info { display: flex; align-items: center; gap: 0.75rem; font-weight: bold; }
.hog-rank { background-color: #334155; color: white; padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.hog-name { flex: 1; color: #334155; }
.hog-power { font-size: 1.1rem; }
.progress-container { width: 100%; height: 0.75rem; background-color: #e2e8f0; border-radius: 999px; overflow: hidden; }
.progress-bar { height: 100%; transition: width 1s ease-in-out; }

.text-cyan   { color: #22d3ee; }
.text-orange { color: #f97316; }
.text-dark   { color: #0f172a; }
.text-sm     { font-size: 0.85rem; }
.striped-bg {
  background-image: linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent);
  background-size: 1rem 1rem;
}
</style>