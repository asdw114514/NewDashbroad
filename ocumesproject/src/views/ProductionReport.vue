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

          <!-- 即時資訊：API 狀態 -->
          <div v-if="activeTab === '即時資訊'" class="api-status" :class="apiConnected ? 'api-ok' : 'api-err'">
            {{ apiConnected ? '🟢 API 連線正常，每 5 秒更新' : '🔴 API 連線失敗' }}
          </div>

          <!-- 歷史資訊：筆數選擇 -->
          <div v-if="activeTab === '歷史資訊'" class="date-filter">
            <span class="text-gray">顯示最新</span>
            <select class="filter-select" v-model="historyLimit" @change="fetchHistory">
              <option :value="20">20 筆</option>
              <option :value="50">50 筆</option>
              <option :value="100">100 筆</option>
            </select>
          </div>

          <!-- 趨勢圖：時間範圍 -->
          <div v-if="activeTab === '趨勢圖'" class="time-range-group">
            <button
              v-for="range in timeRanges" :key="range.label"
              :class="['time-btn', { active: selectedRange === range.label }]"
              @click="switchRange(range)"
            >{{ range.label }}</button>
          </div>
        </div>

        <!-- 機台選擇 -->
        <div class="filter-row">
          <div class="machine-list">
            <button
              v-for="m in machines" :key="m.id"
              :class="['machine-btn', { selected: selectedMachine === m.id }]"
              @click="switchMachine(m.id)"
            >
              <span class="machine-dot" :class="getDotClass(m.status)"></span>
              {{ m.id }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 1：即時資訊 -->
      <div class="card table-card" v-show="activeTab === '即時資訊'">
        <div class="card-header dark flex-between">
          <span>📡 {{ selectedMachine }} - 即時生產資訊</span>
          <span class="result-count">更新時間：{{ apiTime }}</span>
        </div>

        <!-- KPI 列 -->
        <div class="realtime-kpi" v-if="currentStation">
          <div class="rt-kpi-item">
            <div class="rt-kpi-label">OEE</div>
            <div class="rt-kpi-value" :class="getOeeTextClass(currentStation.oee)">{{ currentStation.oee }}%</div>
          </div>
          <div class="rt-kpi-divider">×</div>
          <div class="rt-kpi-item">
            <div class="rt-kpi-label">稼動率 (A)</div>
            <div class="rt-kpi-value" :class="getOeeTextClass(currentStation.availability)">{{ currentStation.availability }}%</div>
          </div>
          <div class="rt-kpi-divider">×</div>
          <div class="rt-kpi-item">
            <div class="rt-kpi-label">效率 (P)</div>
            <div class="rt-kpi-value" :class="getOeeTextClass(currentStation.performance)">{{ currentStation.performance }}%</div>
          </div>
          <div class="rt-kpi-divider">×</div>
          <div class="rt-kpi-item">
            <div class="rt-kpi-label">良品率 (Q)</div>
            <div class="rt-kpi-value" :class="getOeeTextClass(currentStation.yieldRate)">{{ currentStation.yieldRate }}%</div>
          </div>
          <div class="rt-kpi-sep"></div>
          <div class="rt-kpi-item">
            <div class="rt-kpi-label">生產速度</div>
            <div class="rt-kpi-value text-cyan">{{ currentStation.speed }} <small>pcs/min</small></div>
          </div>
          <div class="rt-kpi-item">
            <div class="rt-kpi-label">本班產量</div>
            <div class="rt-kpi-value text-dark">{{ currentStation.shiftCount?.toLocaleString() }} <small>pcs</small></div>
          </div>
          <div class="rt-kpi-item">
            <div class="rt-kpi-label">稼動時間</div>
            <div class="rt-kpi-value text-dark">{{ currentStation.actualRunTime }} <small>/ 480 min</small></div>
          </div>
        </div>

        <!-- 即時表格 -->
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>時間</th>
                <th>機台</th>
                <th>OEE</th>
                <th>稼動率 (A)</th>
                <th>效率 (P)</th>
                <th>良品率 (Q)</th>
                <th>速度 (pcs/min)</th>
                <th>本班產量</th>
                <th>稼動時間</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="realtimeRows.length === 0">
                <td colspan="10" class="no-data">⏳ 等待 API 資料中...</td>
              </tr>
              <tr v-for="(row, i) in realtimeRows" :key="i">
                <td class="text-gray font-mono">{{ row.time }}</td>
                <td><span class="machine-tag">{{ row.id }}</span></td>
                <td><span :class="getOeeTextClass(row.oee)" class="fw-bold">{{ row.oee }}%</span></td>
                <td><span :class="getOeeTextClass(row.availability)">{{ row.availability }}%</span></td>
                <td><span :class="getOeeTextClass(row.performance)">{{ row.performance }}%</span></td>
                <td><span :class="getOeeTextClass(row.yieldRate)">{{ row.yieldRate }}%</span></td>
                <td class="text-cyan fw-bold">{{ row.speed }}</td>
                <td class="fw-bold">{{ row.shiftCount?.toLocaleString() }}</td>
                <td class="text-gray">{{ row.actualRunTime }} min</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(row.oee)">
                    {{ getStatusLabel(row.oee) }}
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
          <span class="result-count">共 {{ historyRows.length }} 筆</span>
        </div>
        <div class="table-wrapper history-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>時間</th>
                <th>OEE</th>
                <th>稼動率 (A)</th>
                <th>效率 (P)</th>
                <th>良品率 (Q)</th>
                <th>速度 (pcs/min)</th>
                <th>本班產量</th>
                <th>稼動時間</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="historyRows.length === 0">
                <td colspan="9" class="no-data">
                  {{ historyLoading ? '⏳ 資料載入中...' : '📭 查無資料' }}
                </td>
              </tr>
              <tr v-for="(row, i) in historyRows" :key="i">
                <td class="text-gray font-mono">{{ row.time }}</td>
                <td><span :class="getOeeTextClass(row.oee)" class="fw-bold">{{ row.oee }}%</span></td>
                <td><span :class="getOeeTextClass(row.availability)">{{ row.availability }}%</span></td>
                <td><span :class="getOeeTextClass(row.performance)">{{ row.performance }}%</span></td>
                <td><span :class="getOeeTextClass(row.yieldRate)">{{ row.yieldRate }}%</span></td>
                <td class="text-cyan fw-bold">{{ row.speed }}</td>
                <td class="fw-bold">{{ row.shiftCount?.toLocaleString() }}</td>
                <td class="text-gray">{{ row.actualRunTime }} min</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(row.oee)">
                    {{ getStatusLabel(row.oee) }}
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
          <span class="chart-title">📈 {{ selectedMachine }} - OEE 趨勢圖</span>
          <div class="chart-legend-custom">
            <span class="legend-item"><span class="dot color-blue"></span> OEE</span>
            <span class="legend-item"><span class="dot color-cyan"></span> 稼動率 (A)</span>
            <span class="legend-item"><span class="dot color-green"></span> 效率 (P)</span>
            <span class="legend-item"><span class="dot color-orange"></span> 良品率 (Q)</span>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import NavDrawer from '@/components/NavDrawer.vue'

const API_REALTIME = 'http://localhost:1880/test'
const API_HISTORY  = 'http://localhost:1880/history'
const POLL_INTERVAL = 5000

// 時間
const currentTime = ref('')
let timeTimer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

// Tab
const reportTabs = ['即時資訊', '歷史資訊', '趨勢圖']
const activeTab  = ref('即時資訊')

// 機台
const machines = ref([
  { id: 'ST-01', name: '射出成型機 A', status: '--' },
  { id: 'ST-02', name: '射出成型機 B', status: '--' },
  { id: 'ST-03', name: 'CNC 加工機 A', status: '--' },
  { id: 'ST-04', name: 'CNC 加工機 B', status: '--' },
  { id: 'ST-05', name: '組裝產線 1',   status: '--' },
  { id: 'ST-06', name: '組裝產線 2',   status: '--' },
])
const selectedMachine = ref('ST-01')

// API 狀態
const apiConnected = ref(false)
const apiTime      = ref('--:--:--')

// 即時資訊
const latestStations = ref([])
const currentStation = computed(() => latestStations.value.find(s => s.id === selectedMachine.value))
const realtimeRows   = computed(() => {
  if (!currentStation.value) return []
  return [{ ...currentStation.value, time: apiTime.value }]
})

// 歷史資訊
const historyLimit   = ref(50)
const historyLoading = ref(false)
const historyData    = ref([]) // 全部歷史，所有機台
const historyRows    = computed(() => {
  return historyData.value
    .map(record => {
      const s = record.stations.find(s => s.id === selectedMachine.value)
      if (!s) return null
      return { ...s, time: record.time }
    })
    .filter(Boolean)
})

// 趨勢圖
const chartRef     = ref(null)
let myChart        = null
const timeRanges   = [
  { label: '最新 20 筆', limit: 20 },
  { label: '最新 50 筆', limit: 50 },
  { label: '最新 100 筆', limit: 100 },
]
const selectedRange = ref('最新 20 筆')

// ── API 抓取 ──

const fetchRealtime = async () => {
  try {
    const res  = await fetch(API_REALTIME)
    const data = await res.json()
    if (data.stations) {
      latestStations.value = data.stations
      // 同步更新機台狀態燈號
      data.stations.forEach(s => {
        const m = machines.value.find(m => m.id === s.id)
        if (m) m.status = s.status
      })
      apiTime.value      = data.time ? data.time.split(' ')[1] : '--'
      apiConnected.value = true
    }
  } catch (e) {
    apiConnected.value = false
  }
}

const fetchHistory = async () => {
  historyLoading.value = true
  try {
    const res  = await fetch(`${API_HISTORY}?limit=${historyLimit.value}`)
    const data = await res.json()
    if (data.data) {
      historyData.value = data.data
      if (activeTab.value === '趨勢圖') updateChart()
    }
  } catch (e) {
    console.error('history API 失敗', e)
  } finally {
    historyLoading.value = false
  }
}

const switchMachine = (id) => {
  selectedMachine.value = id
  if (activeTab.value === '趨勢圖') nextTick(() => updateChart())
}

const switchRange = (range) => {
  selectedRange.value = range.label
  historyLimit.value  = range.limit
  fetchHistory()
}

// ── ECharts ──

const initChart = () => {
  if (!chartRef.value || typeof window.echarts === 'undefined') return
  myChart = window.echarts.init(chartRef.value)
  updateChart()
  window.addEventListener('resize', () => myChart?.resize())
}

const updateChart = () => {
  if (!myChart || historyRows.value.length === 0) return

  // 時間軸（倒序轉正序）
  const rows     = [...historyRows.value].reverse()
  const timeData = rows.map(r => r.time.split(' ')[1] || r.time)
  const oeeData  = rows.map(r => r.oee)
  const aData    = rows.map(r => r.availability)
  const pData    = rows.map(r => r.performance)
  const qData    = rows.map(r => r.yieldRate)

  myChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.9)',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      axisPointer: { type: 'cross', label: { backgroundColor: '#334155' } }
    },
    legend: {
      data: ['OEE', '稼動率(A)', '效率(P)', '良品率(Q)'],
      textStyle: { color: '#64748b' },
      top: 5,
    },
    grid: { top: '15%', left: '3%', right: '3%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData,
      axisLabel: {
        color: '#64748b',
        interval: Math.floor(timeData.length / 8),
        rotate: 30,
      },
      axisLine: { lineStyle: { color: '#cbd5e1' } }
    },
    yAxis: {
      type: 'value',
      min: 0, max: 100,
      name: '%',
      axisLabel: { color: '#64748b', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } }
    },
    dataZoom: [{
      type: 'slider', show: true, start: 0, end: 100,
      bottom: '2%', textStyle: { color: '#64748b' }
    }],
    series: [
      {
        name: 'OEE', type: 'line', data: oeeData,
        smooth: true, symbol: 'circle', symbolSize: 4,
        lineStyle: { width: 3, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        markLine: {
          symbol: ['none', 'none'],
          lineStyle: { color: '#ef4444', type: 'dashed' },
          label: { formatter: '目標 85%', color: '#ef4444' },
          data: [{ yAxis: 85 }]
        }
      },
      {
        name: '稼動率(A)', type: 'line', data: aData,
        smooth: true, symbol: 'none',
        lineStyle: { width: 2, color: '#06b6d4' },
        itemStyle: { color: '#06b6d4' },
      },
      {
        name: '效率(P)', type: 'line', data: pData,
        smooth: true, symbol: 'none',
        lineStyle: { width: 2, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
      },
      {
        name: '良品率(Q)', type: 'line', data: qData,
        smooth: true, symbol: 'none',
        lineStyle: { width: 2, color: '#f97316' },
        itemStyle: { color: '#f97316' },
      },
    ]
  })
}

// ── Watch ──

watch(activeTab, (newTab) => {
  if (newTab === '歷史資訊') fetchHistory()
  if (newTab === '趨勢圖') {
    fetchHistory()
    nextTick(() => {
      if (!myChart) initChart()
      else { myChart.resize(); updateChart() }
    })
  }
})

watch(historyRows, () => {
  if (activeTab.value === '趨勢圖') nextTick(() => updateChart())
})

// ── 生命週期 ──

let pollTimer = null
onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  fetchRealtime()
  pollTimer = setInterval(fetchRealtime, POLL_INTERVAL)
})
onUnmounted(() => {
  clearInterval(timeTimer)
  clearInterval(pollTimer)
  myChart?.dispose()
})

// ── 工具函數 ──
const getOeeTextClass = (v) => v >= 85 ? 'text-green' : v >= 50 ? 'text-yellow' : 'text-red'
const getDotClass     = (s) => s === '運轉中' ? 'dot-green' : s === '待機中' ? 'dot-yellow' : s === '異常' ? 'dot-red' : 'dot-grey'
const getStatusClass  = (v) => v >= 85 ? 'status-ok' : v >= 50 ? 'status-warn' : 'status-err'
const getStatusLabel  = (v) => v >= 85 ? '正常' : v >= 50 ? '待機' : '異常'
</script>

<style scoped>
.dashboard-container { min-height: 100vh; overflow: hidden; background-color: #475569; color: #1e293b; font-family: sans-serif; display: flex; flex-direction: column; }
.header { flex-shrink: 0; background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-blue { background-color: #3b82f6; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }

.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; flex: 1; overflow-y: auto; min-height: 0; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.card-header { padding: 0.75rem 1.25rem; font-weight: bold; }
.card-header.dark { background-color: #1e293b; color: white; border-radius: 0.75rem 0.75rem 0 0; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }

/* 控制面板 */
.control-panel { display: flex; flex-direction: column; flex-shrink: 0; }
.filter-row { padding: 0.85rem 1.25rem; }
.border-bottom { border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 0.75rem 0.75rem 0 0; }
.btn-group { display: flex; gap: 0.5rem; }
.tab-btn { padding: 0.45rem 1.25rem; background-color: #e2e8f0; border: none; border-radius: 4px; color: #475569; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { background-color: #cbd5e1; }
.tab-btn.active { background-color: #1e293b; color: white; }
.filter-select { background: #1e293b; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.85rem; outline: none; cursor: pointer; }
.date-filter { display: flex; align-items: center; gap: 0.5rem; }
.text-gray { color: #64748b; }
.time-range-group { display: flex; gap: 0.5rem; }
.time-btn { padding: 0.35rem 0.9rem; background: transparent; border: 1px solid #cbd5e1; border-radius: 20px; color: #64748b; font-size: 0.82rem; cursor: pointer; transition: 0.2s; }
.time-btn.active { border-color: #0ea5e9; color: #0ea5e9; font-weight: bold; background-color: #f0f9ff; }
.machine-list { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.machine-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1.1rem; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 999px; color: #334155; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
.machine-btn:hover { background-color: #e2e8f0; }
.machine-btn.selected { background-color: #0ea5e9; color: white; border-color: #0ea5e9; }
.machine-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background-color: #22c55e; }
.dot-yellow { background-color: #eab308; }
.dot-red { background-color: #ef4444; }
.dot-grey { background-color: #94a3b8; }

/* API 狀態 */
.api-status { padding: 0.35rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: bold; }
.api-ok  { background: #dcfce7; color: #16a34a; }
.api-err { background: #fee2e2; color: #dc2626; }

/* 即時 KPI */
.realtime-kpi { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.25rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; flex-wrap: wrap; }
.rt-kpi-item { text-align: center; padding: 0 0.75rem; }
.rt-kpi-label { font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem; }
.rt-kpi-value { font-size: 1.4rem; font-weight: bold; }
.rt-kpi-value small { font-size: 0.72rem; color: #94a3b8; }
.rt-kpi-divider { font-size: 1.2rem; color: #94a3b8; font-weight: bold; }
.rt-kpi-sep { width: 1px; height: 36px; background: #e2e8f0; margin: 0 0.5rem; }

/* 表格 */
.table-card { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.table-wrapper { overflow: auto; flex: 1; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; white-space: nowrap; }
.data-table th { background-color: #e2e8f0; padding: 0.75rem 1rem; color: #334155; font-size: 0.82rem; font-weight: bold; position: sticky; top: 0; border-bottom: 2px solid #cbd5e1; z-index: 1; }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; }
.data-table tbody tr:hover td { background-color: #f8fafc; }
.no-data { text-align: center; padding: 3rem !important; color: #94a3b8; font-size: 1rem; }
.font-mono { font-family: monospace; }
.fw-bold { font-weight: bold; }
.result-count { font-size: 0.82rem; color: #94a3b8; font-weight: normal; }
.machine-tag { background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.78rem; font-weight: bold; font-family: monospace; }
.status-badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: bold; }
.status-ok   { background: #dcfce7; color: #16a34a; }
.status-warn { background: #fef9c3; color: #ca8a04; }
.status-err  { background: #fee2e2; color: #dc2626; }
.history-wrapper {
  max-height: calc(100vh - 340px); /* 扣掉 header + 控制面板的高度 */
  overflow-y: auto;
}

/* 趨勢圖 */
.chart-card { flex: 1; display: flex; flex-direction: column; min-height: 420px; }
.chart-header { padding: 0.85rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
.chart-title { font-weight: bold; font-size: 1rem; color: #1e293b; }
.chart-body { flex: 1; padding: 0.75rem; }
.echarts-container { width: 100%; height: 100%; min-height: 350px; }
.chart-legend-custom { display: flex; gap: 1rem; }
.legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: #64748b; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.color-blue   { background-color: #3b82f6; }
.color-cyan   { background-color: #06b6d4; }
.color-green  { background-color: #22c55e; }
.color-orange { background-color: #f97316; }

/* 顏色 */
.text-green  { color: #16a34a; }
.text-yellow { color: #ca8a04; }
.text-red    { color: #dc2626; }
.text-cyan   { color: #0891b2; }
.text-dark   { color: #1e293b; }
</style>