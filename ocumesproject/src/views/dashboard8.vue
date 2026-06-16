<template>
  <div class="dashboard-container">

    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-purple">射出成型機監控</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">值班主管：王大明</div>
      </div>
    </header>

    <main class="main-content">

      <!-- 機台選��列 -->
      <div class="card control-panel">
        <div class="filter-row">
          <span class="label-text">選擇射出機台：</span>
          <div class="machine-list">
            <button
              v-for="m in machines" :key="m.id"
              :class="['machine-btn', { selected: selectedMachineId === m.id }, statusBtnClass(m.status)]"
              @click="selectedMachineId = m.id"
            >
              <span class="btn-dot"></span>
              {{ m.id }}
            </button>
          </div>
          <div class="machine-legend">
            <span class="legend-dot dot-green"></span>運轉中
            <span class="legend-dot dot-yellow ms-2"></span>待機
            <span class="legend-dot dot-red ms-2"></span>異常
            <span class="legend-dot dot-gray ms-2"></span>停機
          </div>
        </div>
      </div>

      <!-- 本班計數（大數字） -->
      <div class="card counter-card">
        <div class="card-header dark">
          📦 {{ selectedMachine.id }} - 本班生產計數
          <span :class="['status-chip', chipClass(selectedMachine.status)]">{{ selectedMachine.status }}</span>
        </div>
        <div class="counters">
          <div class="counter-item">
            <div class="counter-num text-cyan">{{ selectedMachine.shotCount }}</div>
            <div class="counter-label">總模次</div>
          </div>
          <div class="counter-item">
            <div class="counter-num text-green">{{ selectedMachine.goodCount }}</div>
            <div class="counter-label">良品數</div>
          </div>
          <div class="counter-item">
            <div class="counter-num text-red">{{ selectedMachine.ngCount }}</div>
            <div class="counter-label">NG 數</div>
          </div>
          <div class="counter-item">
            <div class="counter-num" :class="yieldRateColor">{{ yieldRate }}%</div>
            <div class="counter-label">良品率</div>
          </div>
        </div>
      </div>

      <!-- 即時製程參數（只留4個） -->
      <div class="card params-card">
        <div class="card-header dark">🌡️ 即時製程參數</div>
        <div class="params-grid">
          <div class="param-item" v-for="p in processParams" :key="p.label">
            <div class="param-label">{{ p.icon }} {{ p.label }}</div>
            <div class="param-value" :class="p.alertClass">
              {{ p.value }}<span class="param-unit">{{ p.unit }}</span>
            </div>
            <div class="param-bar-wrap">
              <div class="param-bar" :style="{ width: p.percent + '%', backgroundColor: p.barColor }"></div>
            </div>
            <div class="param-range">正常範圍：{{ p.min }} ～ {{ p.max }} {{ p.unit }}</div>
          </div>
        </div>
      </div>

      <!-- 異常紀錄 -->
      <div class="card alert-card">
        <div class="card-header dark flex-between">
          <span>⚠️ 本班異常紀錄</span>
          <span class="result-count">共 {{ machineAlerts.length }} 筆</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>時間</th>
                <th>機台</th>
                <th>異常項目</th>
                <th>數值</th>
                <th>標準範圍</th>
                <th>嚴重度</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="machineAlerts.length === 0">
                <td colspan="7" class="no-data">✅ 本班目前無異常紀錄</td>
              </tr>
              <tr v-for="a in machineAlerts" :key="a.id">
                <td class="text-gray mono">{{ a.time }}</td>
                <td class="fw-bold">{{ a.machine }}</td>
                <td>{{ a.item }}</td>
                <td class="text-red fw-bold">{{ a.value }}</td>
                <td class="text-gray">{{ a.standard }}</td>
                <td>
                  <span :class="['chip', a.level === '嚴重' ? 'chip-red' : 'chip-yellow']">{{ a.level }}</span>
                </td>
                <td>
                  <span :class="['chip', a.resolved ? 'chip-green' : 'chip-red blink']">
                    {{ a.resolved ? '已排除' : '未處理' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>

    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavDrawer from '@/components/NavDrawer.vue'

// ── 系統時間 ─────────────────────────────
const currentTime = ref('')
let timeTimer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

// ── 機台清單 ─────────────────────────────
const machines = ref([
  { id: 'INJ-101', status: '運轉中', shotCount: 1248, goodCount: 1235, ngCount: 13 },
  { id: 'INJ-102', status: '待機',   shotCount: 856,  goodCount: 850,  ngCount: 6  },
  { id: 'INJ-103', status: '異常',   shotCount: 432,  goodCount: 405,  ngCount: 27 },
  { id: 'INJ-104', status: '運轉中', shotCount: 1102, goodCount: 1098, ngCount: 4  },
  { id: 'INJ-105', status: '停機',   shotCount: 0,    goodCount: 0,    ngCount: 0  },
  { id: 'INJ-106', status: '運轉��', shotCount: 998,  goodCount: 991,  ngCount: 7  },
])

const selectedMachineId = ref('INJ-101')
const selectedMachine = computed(() => machines.value.find(m => m.id === selectedMachineId.value))

// ── 良品率 ───────────────────────────────
const yieldRate = computed(() => {
  const m = selectedMachine.value
  if (m.shotCount === 0) return '—'
  return ((m.goodCount / m.shotCount) * 100).toFixed(1)
})
const yieldRateColor = computed(() => {
  const r = parseFloat(yieldRate.value)
  if (isNaN(r)) return 'text-gray'
  if (r >= 98) return 'text-green'
  if (r >= 90) return 'text-yellow'
  return 'text-red'
})

// ── 即時製程參數（只留4個）────────────────
const processParams = ref([
  { label: '射出壓力', icon: '💪', value: 1420, unit: 'bar', min: 1200, max: 1600, percent: 71, barColor: '#0ea5e9', alertClass: '' },
  { label: '模具溫度', icon: '🧊', value: 48,   unit: '°C',  min: 40,   max: 60,   percent: 80, barColor: '#10b981', alertClass: '' },
  { label: '冷卻時間', icon: '❄️', value: 18.5, unit: 's',   min: 15,   max: 25,   percent: 35, barColor: '#06b6d4', alertClass: '' },
  { label: '良品率',   icon: '✅', value: 98.9, unit: '%',   min: 95,   max: 100,  percent: 98, barColor: '#22c55e', alertClass: '' },
])

// ── 本班異常紀錄 ─────────────────────────
const machineAlerts = ref([
  { id: 1, time: '08:42:15', machine: 'INJ-103', item: '射出壓力過高', value: '1680 bar', standard: '1200~1600 bar', level: '嚴重', resolved: false },
  { id: 2, time: '09:15:30', machine: 'INJ-103', item: '模具溫度偏低', value: '32°C',     standard: '40~60°C',       level: '警告', resolved: false },
  { id: 3, time: '07:30:00', machine: 'INJ-102', item: '冷卻時間超時', value: '32.1 s',   standard: '15~25 s',       level: '警告', resolved: true  },
])

// ── 機台按鈕樣式 ─────────────────────────
const statusBtnClass = (status) => ({
  'btn-running': status === '運轉中',
  'btn-idle':    status === '待機',
  'btn-error':   status === '異常',
  'btn-off':     status === '停機',
})
const chipClass = (status) => ({
  'chip-green':  status === '運轉中',
  'chip-yellow': status === '待機',
  'chip-red':    status === '異常',
  'chip-gray':   status === '停機',
})

onMounted(() => { updateTime(); timeTimer = setInterval(updateTime, 1000) })
onUnmounted(() => { clearInterval(timeTimer) })
</script>

<style scoped>
.dashboard-container { min-height: 100vh; background-color: #0f172a; color: #1e293b; font-family: sans-serif; display: flex; flex-direction: column; }

/* Header */
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: .25rem .6rem; border-radius: 4px; font-size: .875rem; font-weight: bold; color: white; }
.bg-purple { background-color: #7c3aed; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: .875rem; color: #9ca3af; }

/* Layout */
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; flex: 1; }

/* Card */
.card { background-color: white; border-radius: .5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,.1); }
.card-header { padding: .85rem 1.25rem; font-weight: bold; background-color: #1e293b; color: white; border-radius: .5rem .5rem 0 0; display: flex; align-items: center; }
.flex-between { justify-content: space-between; }
.result-count { font-size: .875rem; color: #94a3b8; font-weight: normal; margin-left: auto; }

/* 機台選擇列 */
.filter-row { padding: 1rem 1.5rem; display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; }
.label-text { font-weight: bold; color: #475569; white-space: nowrap; }
.machine-list { display: flex; flex-wrap: wrap; gap: .6rem; }
.machine-btn { display: flex; align-items: center; gap: .4rem; padding: .45rem 1.1rem; border-radius: 999px; border: 2px solid transparent; font-weight: bold; font-size: .9rem; cursor: pointer; transition: all .2s; }
.btn-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.btn-running { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
.btn-running.selected { background: #10b981; color: white; }
.btn-idle    { background: #fef9c3; color: #713f12; border-color: #fde047; }
.btn-idle.selected    { background: #eab308; color: white; }
.btn-error   { background: #fee2e2; color: #7f1d1d; border-color: #fca5a5; }
.btn-error.selected   { background: #ef4444; color: white; }
.btn-off     { background: #f1f5f9; color: #64748b; border-color: #cbd5e1; }
.btn-off.selected     { background: #64748b; color: white; }
.machine-legend { display: flex; align-items: center; font-size: .8rem; color: #64748b; font-weight: bold; margin-left: auto; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 4px; }
.dot-green  { background: #10b981; }
.dot-yellow { background: #eab308; }
.dot-red    { background: #ef4444; }
.dot-gray   { background: #94a3b8; }
.ms-2 { margin-left: .5rem; }

/* 本班計數 */
.counters { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; padding: 1.25rem; }
.counter-item { text-align: center; padding: 1rem; background: #f8fafc; border-radius: .5rem; border: 1px solid #e2e8f0; }
.counter-num  { font-size: 2.2rem; font-weight: bold; line-height: 1; }
.counter-label { font-size: .8rem; color: #64748b; font-weight: bold; margin-top: .4rem; }

/* 製程參數 */
.params-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 1.25rem; }
.param-item { display: flex; flex-direction: column; gap: .3rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: .5rem; background: #f8fafc; }
.param-label { font-size: .8rem; color: #64748b; font-weight: bold; }
.param-value { font-size: 1.8rem; font-weight: bold; color: #0f172a; line-height: 1; }
.param-unit  { font-size: .85rem; color: #94a3b8; font-weight: normal; margin-left: 2px; }
.param-bar-wrap { height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: .25rem; }
.param-bar { height: 100%; border-radius: 999px; transition: width .6s; }
.param-range { font-size: .72rem; color: #94a3b8; }

/* 異常表格 */
.alert-card { overflow: hidden; }
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; white-space: nowrap; }
.data-table th { background: #f8fafc; padding: .85rem 1rem; color: #64748b; font-size: .85rem; font-weight: bold; border-bottom: 2px solid #e2e8f0; }
.data-table td { padding: .8rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: .9rem; }
.data-table tbody tr:hover td { background: #f8fafc; }
.no-data { text-align: center; padding: 2.5rem !important; color: #94a3b8; font-size: 1rem; }
.fw-bold { font-weight: bold; }
.mono { font-family: monospace; }
.text-gray   { color: #64748b; }
.text-red    { color: #dc2626; }
.text-cyan   { color: #0891b2; }
.text-green  { color: #16a34a; }
.text-yellow { color: #ca8a04; }

/* 狀態標籤 */
.status-chip { padding: .2rem .7rem; border-radius: 999px; font-size: .78rem; font-weight: bold; margin-left: .5rem; }
.chip        { padding: .2rem .6rem; border-radius: 4px; font-size: .78rem; font-weight: bold; color: white; }
.chip-green  { background: #16a34a; }
.chip-yellow { background: #ca8a04; }
.chip-red    { background: #dc2626; }
.chip-gray   { background: #64748b; }

.blink { animation: blinker 1.8s linear infinite; }
@keyframes blinker { 50% { opacity: .5; } }
</style>