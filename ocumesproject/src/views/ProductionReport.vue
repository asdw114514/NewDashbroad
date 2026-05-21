<template>
  <div class="dashboard-container">

    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-blue">生產報表</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">值班主管：王大明</div>
      </div>
    </header>

    <main class="main-content">

      <!-- 控制面板 -->
      <div class="card control-panel">
        <div class="filter-row border-bottom flex-between">

          <div class="btn-group">
            <button
              v-for="tab in reportTabs" :key="tab"
              :class="['tab-btn', { active: activeTab === tab }]"
              @click="activeTab = tab"
            >{{ tab }}</button>
          </div>

          <div class="date-filter" v-if="activeTab === '歷史資訊'">
            <input type="date" v-model="historyFilter.start" class="form-input-sm">
            <span class="mx-2 text-gray">～</span>
            <input type="date" v-model="historyFilter.end" class="form-input-sm">
            <button class="tab-btn active ms-2" @click="applyHistoryFilter">查詢</button>
          </div>

          <div class="time-range-group" v-if="activeTab === '趨勢圖'">
            <button
              v-for="range in timeRanges" :key="range"
              :class="['time-btn', { active: selectedRange === range }]"
              @click="switchRange(range)"
            >{{ range }}</button>
          </div>

        </div>

        <!-- 機台選擇 -->
        <div class="filter-row">
          <div class="machine-list">
            <button
              v-for="machine in machines" :key="machine"
              :class="['machine-btn', { selected: selectedMachine === machine }]"
              @click="switchMachine(machine)"
            >{{ machine }}</button>
          </div>
        </div>
      </div>

      <!-- Tab 1：即時資訊 -->
      <div class="card table-card" v-show="activeTab === '即時資訊'">
        <div class="card-header dark flex-between">
          <span>📡 {{ selectedMachine }} - 即時生產資訊</span>
          <span class="result-count">🟢 資料更新中</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>生產日期</th>
                <th>產品 QR Code</th>
                <th>CCD1 點火角度</th>
                <th>CCD2 焊接檢查</th>
                <th>電焊開始時間</th>
                <th>焊接檢查</th>
                <th>填充前空重(g)</th>
                <th>是否OK</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in realtimeData" :key="index">
                <td class="text-gray">{{ row.date }}</td>
                <td class="font-mono text-dark">{{ row.qrCode }}</td>
                <td :class="row.ccd1 === 'ok' ? 'text-green' : 'text-red'">{{ row.ccd1 }}</td>
                <td :class="row.ccd2 === 'ok' ? 'text-green' : 'text-red'">{{ row.ccd2 }}</td>
                <td class="text-gray">{{ row.weldTime }}</td>
                <td :class="row.weldCheck === 'NG' ? 'text-red' : 'text-green'">{{ row.weldCheck }}</td>
                <td class="text-dark">{{ row.weight }}</td>
                <td>
                  <span :class="['ok-badge', row.isOk === 'OK' ? 'badge-green' : 'badge-red']">
                    {{ row.isOk || '--' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2：歷史資訊 -->
      <div class="card table-card" v-show="activeTab === '歷史資訊'">
        <div class="card-header dark flex-between">
          <span>📂 {{ selectedMachine }} - 歷史生產紀錄</span>
          <span class="result-count">共 {{ historyData.length }} 筆</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>生產日期</th>
                <th>產品 QR Code</th>
                <th>CCD1</th>
                <th>CCD2</th>
                <th>焊接檢查</th>
                <th>填充前空重(g)</th>
                <th>總產量</th>
                <th>是否OK</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="historyData.length === 0">
                <td colspan="8" class="no-data">📭 查無符合日期範圍的歷史資料</td>
              </tr>
              <tr v-for="(row, index) in historyData" :key="index">
                <td class="text-gray">{{ row.date }}</td>
                <td class="font-mono text-dark">{{ row.qrCode }}</td>
                <td :class="row.ccd1 === 'ok' ? 'text-green' : 'text-red'">{{ row.ccd1 }}</td>
                <td :class="row.ccd2 === 'ok' ? 'text-green' : 'text-red'">{{ row.ccd2 }}</td>
                <td :class="row.weldCheck === 'NG' ? 'text-red' : 'text-green'">{{ row.weldCheck }}</td>
                <td class="text-dark">{{ row.weight }}</td>
                <td class="font-bold">{{ row.total }}</td>
                <td>
                  <span :class="['ok-badge', row.isOk === 'OK' ? 'badge-green' : 'badge-red']">
                    {{ row.isOk }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 3：趨勢圖 -->
      <div class="card chart-card" v-show="activeTab === '趨勢圖'">
        <div class="chart-header flex-between">
          <span class="chart-title">
            📈 {{ selectedMachine }} - 關鍵製程參數走勢
          </span>
          <div class="chart-legend-custom">
            <span class="legend-item">
              <span class="dot color-cyan"></span> 填充前空重 (g)
            </span>
            <span class="legend-item">
              <span class="dot color-orange"></span> 焊接溫度 (°C)
            </span>
          </div>
        </div>
        <div class="chart-body">
          <div ref="chartRef" class="echarts-container"></div>
        </div>
      </div>

    </main>

    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import NavDrawer from '@/components/NavDrawer.vue'

const currentTime = ref('')
let timeTimer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

const reportTabs = ['即時資訊', '歷史資訊', '趨勢圖']
const activeTab = ref('即時資訊')

// ✅ 機台名稱改為 INJ 系列，只保留 6 台
const machines = [
  'INJ-101', 'INJ-102', 'INJ-103',
  'INJ-104', 'INJ-105', 'INJ-106'
]
const selectedMachine = ref('INJ-101')

const realtimeData = ref([
  { date: '2026/04/30 08:05:10', qrCode: 'C2122324', ccd1: 'ok',  ccd2: 'ok', weldTime: '08:05:09', weldCheck: 'OK', weight: '266.46', isOk: 'OK' },
  { date: '2026/04/30 08:10:22', qrCode: 'C2122325', ccd1: 'ok',  ccd2: 'ng', weldTime: '08:10:20', weldCheck: 'NG', weight: '265.10', isOk: 'NG' },
  { date: '2026/04/30 08:15:45', qrCode: 'C2122326', ccd1: 'ok',  ccd2: 'ok', weldTime: '08:15:43', weldCheck: 'OK', weight: '267.02', isOk: 'OK' },
  { date: '2026/04/30 08:20:11', qrCode: 'C2122327', ccd1: 'ok',  ccd2: 'ok', weldTime: '08:20:10', weldCheck: 'OK', weight: '266.88', isOk: 'OK' },
])

const historyFilter = ref({ start: '2022-11-01', end: '2026-04-30' })
const allHistoryData = ref([
  { date: '2022/11/03', qrCode: 'C2122300', ccd1: 'ok', ccd2: 'ok', weldCheck: 'OK', weight: '265.80', total: '320', isOk: 'OK' },
  { date: '2022/11/03', qrCode: 'C2122301', ccd1: 'ok', ccd2: 'ng', weldCheck: 'NG', weight: '263.10', total: '318', isOk: 'NG' },
  { date: '2026/04/20', qrCode: 'C2122320', ccd1: 'ok', ccd2: 'ok', weldCheck: 'OK', weight: '266.46', total: '410', isOk: 'OK' },
  { date: '2026/04/21', qrCode: 'C2122321', ccd1: 'ok', ccd2: 'ok', weldCheck: 'OK', weight: '267.12', total: '398', isOk: 'OK' },
  { date: '2026/04/29', qrCode: 'C2122322', ccd1: 'ng', ccd2: 'ok', weldCheck: 'NG', weight: '264.55', total: '305', isOk: 'NG' },
])
const historyData = ref([...allHistoryData.value])

const applyHistoryFilter = () => {
  historyData.value = allHistoryData.value.filter(row => {
    const rowDate = new Date(row.date)
    const start = historyFilter.value.start ? new Date(historyFilter.value.start) : null
    const end = historyFilter.value.end ? new Date(historyFilter.value.end) : null
    return (start ? rowDate >= start : true) && (end ? rowDate <= end : true)
  })
}

const chartRef = ref(null)
let myChart = null
const timeRanges = ['近 1 小時', '近 4 小時', '近 24 小時']
const selectedRange = ref('近 1 小時')

const generateMockData = (points = 60) => {
  let baseTime = new Date('2026-04-30T08:00:00').getTime()
  const timeData = [], weightData = [], tempData = []
  for (let i = 0; i < points; i++) {
    timeData.push(new Date(baseTime).toLocaleTimeString('zh-TW', { hour12: false }))
    weightData.push((266 + Math.random() * 2 - 1).toFixed(2))
    let temp = 120 + Math.random() * 5
    if (i === Math.floor(points * 0.75)) temp = 145
    tempData.push(temp.toFixed(1))
    baseTime += 60000
  }
  return { timeData, weightData, tempData }
}

const initChart = () => {
  if (!chartRef.value || typeof window.echarts === 'undefined') return
  myChart = window.echarts.init(chartRef.value)
  updateChartData()
  window.addEventListener('resize', () => myChart?.resize())
}

const updateChartData = () => {
  if (!myChart) return
  const points = selectedRange.value === '近 1 小時' ? 60
               : selectedRange.value === '近 4 小時' ? 120 : 180
  const data = generateMockData(points)

  myChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.9)',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      axisPointer: { type: 'cross', label: { backgroundColor: '#334155' } }
    },
    grid: { top: '10%', left: '3%', right: '3%', bottom: '15%', containLabel: true },
    yAxis: [
      { type: 'value', name: '重量 (g)', min: 260, max: 270,
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } } },
      { type: 'value', name: '溫度 (°C)', min: 100, max: 160,
        axisLabel: { color: '#64748b' }, splitLine: { show: false } }
    ],
    xAxis: {
      type: 'category', boundaryGap: false, data: data.timeData,
      axisLabel: { color: '#64748b', interval: Math.floor(data.timeData.length / 8) },
      axisLine: { lineStyle: { color: '#cbd5e1' } }
    },
    dataZoom: [{ type: 'slider', show: true, start: 0, end: 100, bottom: '2%', textStyle: { color: '#64748b' } }],
    series: [
      {
        name: '填充前空重', type: 'line', yAxisIndex: 0,
        data: data.weightData, smooth: true, symbol: 'none',
        lineStyle: { width: 3, color: '#0ea5e9' },
        areaStyle: {
          color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(14,165,233,0.3)' },
            { offset: 1, color: 'rgba(14,165,233,0.02)' }
          ])
        }
      },
      {
        name: '焊接溫度', type: 'line', yAxisIndex: 1,
        data: data.tempData, smooth: true,
        symbol: 'circle', symbolSize: 6,
        lineStyle: { width: 2, color: '#f97316' },
        itemStyle: { color: '#f97316' },
        markLine: {
          symbol: ['none', 'none'],
          label: { formatter: '警戒值 140°C', position: 'insideStartTop', color: '#ef4444' },
          lineStyle: { color: '#ef4444', type: 'solid', width: 2 },
          data: [{ yAxis: 140 }]
        }
      }
    ]
  })
}

const switchRange = (range) => {
  selectedRange.value = range
  if (myChart) {
    myChart.showLoading({ text: '資料讀取中...', color: '#0ea5e9' })
    setTimeout(() => { updateChartData(); myChart.hideLoading() }, 400)
  }
}

const switchMachine = (machine) => {
  selectedMachine.value = machine
  if (activeTab.value === '趨勢圖' && myChart) {
    myChart.showLoading({ text: '資料讀取中...', color: '#0ea5e9' })
    setTimeout(() => { updateChartData(); myChart.hideLoading() }, 500)
  }
}

watch(activeTab, (newTab) => {
  if (newTab === '趨勢圖') {
    nextTick(() => {
      if (!myChart) initChart()
      else myChart.resize()
    })
  }
})

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timeTimer)
  myChart?.dispose()
})
</script>

<style scoped>
.dashboard-container { min-height: 100vh; background-color: #475569; color: #1e293b; font-family: sans-serif; display: flex; flex-direction: column; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-blue { background-color: #3b82f6; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; flex: 1; overflow: hidden; }
.card { background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.card-header { padding: 1rem 1.5rem; font-weight: bold; }
.card-header.dark { background-color: #1e293b; color: white; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.result-count { font-size: 0.875rem; color: #94a3b8; font-weight: normal; }
.control-panel { display: flex; flex-direction: column; }
.filter-row { padding: 1rem 1.5rem; }
.border-bottom { border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 0.5rem 0.5rem 0 0; }
.btn-group { display: flex; gap: 0.5rem; }
.tab-btn { padding: 0.5rem 1.5rem; background-color: #e2e8f0; border: none; border-radius: 4px; color: #475569; font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { background-color: #cbd5e1; }
.tab-btn.active { background-color: #1e293b; color: white; }
.date-filter { display: flex; align-items: center; gap: 0.5rem; }
.form-input-sm { padding: 0.4rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; }
.text-gray { color: #64748b; }
.time-range-group { display: flex; gap: 0.5rem; }
.time-btn { padding: 0.4rem 1rem; background: transparent; border: 1px solid #cbd5e1; border-radius: 20px; color: #64748b; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
.time-btn.active { border-color: #0ea5e9; color: #0ea5e9; font-weight: bold; background-color: #f0f9ff; }
.machine-list { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.machine-btn { padding: 0.5rem 1.25rem; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 999px; color: #334155; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.machine-btn:hover { background-color: #e2e8f0; }
.machine-btn.selected { background-color: #0ea5e9; color: white; border-color: #0ea5e9; }
.table-card {overflow: hidden;display: flex;flex-direction: column;flex-shrink: 0; /* 不隨頁面拉伸 */}
.table-wrapper {overflow-y: auto;max-height: 420px; /* 固定最大高度，超過就在框內滾動 */}
.data-table { width: 100%; border-collapse: collapse; text-align: left; white-space: nowrap; }
.data-table th { background-color: #e2e8f0; padding: 1rem; color: #334155; font-size: 0.85rem; font-weight: bold; position: sticky; top: 0; border-bottom: 2px solid #cbd5e1; z-index: 1; }
.data-table td { padding: 0.9rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
.data-table tbody tr:hover td { background-color: #f8fafc; }
.font-mono { font-family: monospace; }
.font-bold { font-weight: bold; }
.text-dark { color: #0f172a; font-weight: bold; }
.text-green { color: #16a34a; font-weight: bold; }
.text-red { color: #dc2626; font-weight: bold; }
.no-data { text-align: center; padding: 3rem !important; color: #94a3b8; font-size: 1.1rem; }
.ok-badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; color: white; }
.badge-green { background-color: #16a34a; }
.badge-red { background-color: #dc2626; }
.chart-card { flex: 1; display: flex; flex-direction: column; min-height: 420px; }
.chart-header { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.chart-title { font-weight: bold; font-size: 1.1rem; color: #1e293b; }
.chart-body { flex: 1; padding: 1rem; }
.echarts-container { width: 100%; height: 100%; min-height: 350px; }
.chart-legend-custom { display: flex; gap: 1rem; }
.legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #64748b; font-weight: bold; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.color-cyan { background-color: #0ea5e9; }
.color-orange { background-color: #f97316; }
</style>