<template>
  <div class="dashboard-home">

    <!-- 頂部 KPI -->
    <section class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">🏭</div>
        <div class="kpi-info">
          <div class="kpi-label">今日總產量</div>
          <div class="kpi-value text-white">{{ totalProduction.toLocaleString() }}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div class="kpi-info">
          <div class="kpi-label">整體 OEE</div>
          <div class="kpi-value" :class="avgOee >= 85 ? 'text-green' : avgOee >= 50 ? 'text-yellow' : 'text-red'">
            {{ avgOee }}%
          </div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">✅</div>
        <div class="kpi-info">
          <div class="kpi-label">今日良品率</div>
          <div class="kpi-value text-green">{{ avgYield }}%</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🚨</div>
        <div class="kpi-info">
          <div class="kpi-label">異常機台數</div>
          <div class="kpi-value" :class="faultCount > 0 ? 'text-red' : 'text-green'">{{ faultCount }}</div>
        </div>
      </div>
    </section>

    <!-- 主要內容 -->
    <div class="main-grid">

      <!-- 左側：機台列表 -->
      <section class="card station-list">
        <div class="card-header">🏭 機台總覽</div>
        <div class="station-items">
          <div
            v-for="s in stations"
            :key="s.id"
            class="station-item"
            :class="{ active: activeStationId === s.id }"
            @click="activeStationId = s.id"
          >
            <div class="station-left">
              <span class="station-id">{{ s.id }}</span>
              <span class="station-name">{{ s.name }}</span>
            </div>
            <div class="station-right">
              <span class="station-oee" :class="getOeeTextClass(s.oee)">{{ s.oee }}%</span>
              <span class="status-dot" :class="getDotClass(s.status)"></span>
            </div>
          </div>
        </div>
      </section>

      <!-- 中間：選中機台詳情 -->
      <section class="card center-panel">
        <div class="card-header">
          📡 {{ activeStation.id }} — {{ activeStation.name }}
          <span class="status-badge-sm" :class="getBadgeClass(activeStation.status)">{{ activeStation.status }}</span>
          <span class="api-time">🕐 {{ apiTime }}</span>
        </div>

        <!-- OEE 大字 + 三要素 -->
        <div class="oee-section">
          <div class="oee-label">整體設備效率 (OEE)</div>
          <div class="oee-value" :class="getOeeTextClass(activeStation.oee)">
            {{ activeStation.oee }}<span class="oee-unit">%</span>
          </div>
          <div class="oee-bar-bg">
            <div
              class="oee-bar-fill"
              :class="getOeeBarClass(activeStation.oee)"
              :style="{ width: activeStation.oee + '%' }"
            ></div>
          </div>
          <div class="oee-hint">{{ getOeeHint(activeStation.oee) }}</div>

          <!-- OEE 三要素 -->
          <div class="oee-factors">
            <div class="factor-item">
              <div class="factor-label">⏱ 稼動率 (A)</div>
              <div class="factor-value" :class="getOeeTextClass(activeStation.availability)">
                {{ activeStation.availability }}%
              </div>
              <div class="factor-sub">{{ activeStation.actualRunTime }} / {{ activeStation.plannedTime }} min</div>
            </div>
            <div class="factor-divider">×</div>
            <div class="factor-item">
              <div class="factor-label">⚡ 效率 (P)</div>
              <div class="factor-value" :class="getOeeTextClass(activeStation.performance)">
                {{ activeStation.performance }}%
              </div>
              <div class="factor-sub">實際速度 {{ activeStation.speed }} pcs/min</div>
            </div>
            <div class="factor-divider">×</div>
            <div class="factor-item">
              <div class="factor-label">✅ 良品率 (Q)</div>
              <div class="factor-value" :class="getOeeTextClass(activeStation.yieldRate)">
                {{ activeStation.yieldRate }}%
              </div>
              <div class="factor-sub">本班產量 {{ activeStation.shiftCount.toLocaleString() }} pcs</div>
            </div>
          </div>
        </div>

        <!-- 底部指標 -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">⚡ 生產速度</div>
            <div class="metric-value text-cyan">{{ activeStation.speed }}</div>
            <div class="metric-unit">pcs / min</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">✅ 良品率</div>
            <div class="metric-value text-green">{{ activeStation.yieldRate }}</div>
            <div class="metric-unit">%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">📦 本班產量</div>
            <div class="metric-value text-white">{{ activeStation.shiftCount.toLocaleString() }}</div>
            <div class="metric-unit">pcs</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">⏱ 稼動時間</div>
            <div class="metric-value text-yellow">{{ activeStation.actualRunTime }}</div>
            <div class="metric-unit">/ {{ activeStation.plannedTime }} min</div>
          </div>
        </div>
      </section>

      <!-- 右側：警告 + 快捷入口 -->
      <div class="right-col">

        <!-- API 狀態 -->
        <div class="api-status" :class="apiConnected ? 'api-ok' : 'api-err'">
          <span>{{ apiConnected ? '🟢 API 連線正常' : '🔴 API 連線失敗' }}</span>
          <span class="api-update">{{ apiConnected ? `每 5 秒更新` : '請確認 Node-RED' }}</span>
        </div>

        <!-- 警告訊息 -->
        <section class="card event-card">
          <div class="card-header">⚡ 即時警告</div>
          <div class="event-list">
            <div v-if="warnings.length === 0" class="no-warning">
              ✅ 目前無異常
            </div>
            <div
              v-for="(w, i) in warnings"
              :key="i"
              class="event-item item-error"
            >
              <div class="event-time">{{ apiTime }}</div>
              <div class="event-content">
                <span class="event-tag tag-error">警告</span>
                <span class="event-msg">{{ w }}</span>
              </div>
            </div>
            <div
              v-for="ev in historyEvents"
              :key="ev.id"
              class="event-item"
              :class="ev.itemClass"
            >
              <div class="event-time">{{ ev.time }}</div>
              <div class="event-content">
                <span class="event-tag" :class="ev.tagClass">{{ ev.tag }}</span>
                <span class="event-msg">{{ ev.msg }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 快捷入口 -->
        <section class="card shortcut-card">
          <div class="card-header">🚀 快捷入口</div>
          <div class="shortcut-grid">
            <div class="shortcut-item" v-for="sc in shortcuts" :key="sc.path" @click="router.push(sc.path)">
              <span class="sc-icon">{{ sc.icon }}</span>
              <span class="sc-name">{{ sc.name }}</span>
            </div>
          </div>
        </section>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const API_URL = 'http://localhost:1880/test'
const POLL_INTERVAL = 5000 // 每 5 秒抓一次

// API 狀態
const apiConnected = ref(false)
const apiTime = ref('--:--:--')

// 機台資料（初始空資料，等 API 回來再填）
const stations = ref([
  { id: 'ST-01', name: '射出成型機 A', status: '--', oee: 0, availability: 0, performance: 0, yieldRate: 0, speed: '0', shiftCount: 0, actualRunTime: 0, plannedTime: 480 },
  { id: 'ST-02', name: '射出成型機 B', status: '--', oee: 0, availability: 0, performance: 0, yieldRate: 0, speed: '0', shiftCount: 0, actualRunTime: 0, plannedTime: 480 },
  { id: 'ST-03', name: 'CNC 加工機 A', status: '--', oee: 0, availability: 0, performance: 0, yieldRate: 0, speed: '0', shiftCount: 0, actualRunTime: 0, plannedTime: 480 },
  { id: 'ST-04', name: 'CNC 加工機 B', status: '--', oee: 0, availability: 0, performance: 0, yieldRate: 0, speed: '0', shiftCount: 0, actualRunTime: 0, plannedTime: 480 },
  { id: 'ST-05', name: '組裝產線 1',   status: '--', oee: 0, availability: 0, performance: 0, yieldRate: 0, speed: '0', shiftCount: 0, actualRunTime: 0, plannedTime: 480 },
  { id: 'ST-06', name: '組裝產線 2',   status: '--', oee: 0, availability: 0, performance: 0, yieldRate: 0, speed: '0', shiftCount: 0, actualRunTime: 0, plannedTime: 480 },
])

const warnings = ref([])
const activeStationId = ref('ST-01')
const activeStation = computed(() => stations.value.find(s => s.id === activeStationId.value) || stations.value[0])

// KPI 計算
const totalProduction = computed(() => stations.value.reduce((sum, s) => sum + (s.shiftCount || 0), 0))
const avgOee   = computed(() => (stations.value.reduce((sum, s) => sum + s.oee, 0) / stations.value.length).toFixed(1))
const avgYield = computed(() => (stations.value.reduce((sum, s) => sum + s.yieldRate, 0) / stations.value.length).toFixed(1))
const faultCount = computed(() => stations.value.filter(s => s.status === '異常').length)

// 歷史事件（靜態，讓畫面不空白）
const historyEvents = ref([
  { id: 1, time: '--', tag: '正常', tagClass: 'tag-ok', msg: '等待 API 資料中...', itemClass: '' },
])

// 抓 API
const fetchData = async () => {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error('API 回傳錯誤')
    const data = await res.json()

    // 更新機台資料
    if (data.stations && Array.isArray(data.stations)) {
      data.stations.forEach(apiStation => {
        const found = stations.value.find(s => s.id === apiStation.id)
        if (found) {
          found.status        = apiStation.status
          found.oee           = apiStation.oee
          found.availability  = apiStation.availability
          found.performance   = apiStation.performance
          found.yieldRate     = apiStation.yieldRate
          found.speed         = apiStation.speed
          found.shiftCount    = apiStation.shiftCount
          found.actualRunTime = apiStation.actualRunTime
          found.plannedTime   = apiStation.plannedTime
        }
      })
    }

    // 更新警告
    warnings.value = data.warnings || []

    // 更新時間
    apiTime.value = data.time ? data.time.split(' ')[1] : '--'

    // 有資料後清空佔位訊息
    if (historyEvents.value[0]?.msg === '等待 API 資料中...') {
      historyEvents.value = []
    }

    apiConnected.value = true
  } catch (e) {
    apiConnected.value = false
    console.error('API 抓取失敗：', e)
  }
}

let pollTimer = null
onMounted(() => {
  fetchData()
  pollTimer = setInterval(fetchData, POLL_INTERVAL)
})
onUnmounted(() => clearInterval(pollTimer))

// 快捷入口
const shortcuts = [
  { path: '/warings',           icon: '⚠️', name: '異常日誌' },
  { path: '/production-report', icon: '📋', name: '生產報表' },
  { path: '/da5',               icon: '🌱', name: '能源 ESG' },
  { path: '/da6',               icon: '👷', name: '人員工位' },
  { path: '/da7',               icon: '🔧', name: '模具壽命' },
  { path: '/da8',               icon: '🏭', name: '射出成型機' },
]

// 工具函數
const getOeeTextClass = (v) => v >= 85 ? 'text-green' : v >= 50 ? 'text-yellow' : 'text-red'
const getOeeBarClass  = (v) => v >= 85 ? 'bar-green'  : v >= 50 ? 'bar-yellow'  : 'bar-red'
const getOeeHint      = (v) => v >= 85 ? '✅ OEE 良好' : v >= 50 ? '⚠️ OEE 偏低，請注意' : '🚨 OEE 異常，需立即處理'
const getDotClass     = (s) => s === '運轉中' ? 'dot-green' : s === '待機中' ? 'dot-yellow' : s === '異常' ? 'dot-red' : 'dot-grey'
const getBadgeClass   = (s) => s === '運轉中' ? 'badge-running' : s === '待機中' ? 'badge-idle' : s === '異常' ? 'badge-fault' : 'badge-idle'
</script>

<style scoped>
.dashboard-home {
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-sizing: border-box;
  overflow: hidden;
}

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; flex-shrink: 0; }
.kpi-card { background-color: #1e293b; border-radius: 0.75rem; padding: 0.85rem 1.2rem; display: flex; align-items: center; gap: 0.85rem; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.kpi-icon { font-size: 1.6rem; }
.kpi-label { color: #94a3b8; font-size: 0.78rem; margin-bottom: 0.15rem; }
.kpi-value { font-size: 1.6rem; font-weight: bold; }

/* 主要三欄 */
.main-grid { display: grid; grid-template-columns: 210px 1fr 265px; gap: 0.75rem; flex: 1; min-height: 0; }

/* 共用卡片 */
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
.card-header { background-color: #1e293b; color: white; padding: 0.55rem 1rem; font-weight: bold; font-size: 0.88rem; display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.api-time { margin-left: auto; font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

/* API 狀態列 */
.api-status {
  border-radius: 8px;
  padding: 0.4rem 0.85rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  font-weight: bold;
  flex-shrink: 0;
}
.api-ok  { background: #dcfce7; color: #16a34a; }
.api-err { background: #fee2e2; color: #dc2626; }
.api-update { font-size: 0.72rem; font-weight: normal; }

/* 機台列表 */
.station-list { height: 100%; }
.station-items { padding: 0.4rem; display: flex; flex-direction: column; gap: 0.35rem; overflow-y: auto; flex: 1; min-height: 0; }
.station-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.65rem; border-radius: 6px; cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s; background-color: #f8fafc; flex-shrink: 0; }
.station-item:hover { background-color: #f1f5f9; }
.station-item.active { background-color: #e0f2fe; border-left-color: #0ea5e9; }
.station-left { display: flex; flex-direction: column; gap: 0.1rem; }
.station-id   { font-family: monospace; font-size: 0.82rem; font-weight: bold; color: #0ea5e9; }
.station-name { font-size: 0.72rem; color: #64748b; }
.station-right { display: flex; align-items: center; gap: 0.4rem; }
.station-oee  { font-size: 0.82rem; font-weight: bold; }
.status-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green  { background-color: #22c55e; box-shadow: 0 0 5px #22c55e; }
.dot-yellow { background-color: #eab308; box-shadow: 0 0 5px #eab308; }
.dot-red    { background-color: #ef4444; box-shadow: 0 0 5px #ef4444; animation: blink 1s infinite; }
.dot-grey   { background-color: #94a3b8; }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

/* 中間面板 */
.center-panel { height: 100%; }
.status-badge-sm { padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.72rem; font-weight: bold; }
.badge-running { background: #dcfce7; color: #16a34a; }
.badge-idle    { background: #fef9c3; color: #ca8a04; }
.badge-fault   { background: #fee2e2; color: #dc2626; }

.oee-section { padding: 0.75rem 1.5rem 0.5rem; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; }
.oee-label { color: #94a3b8; font-size: 0.8rem; margin-bottom: 0.3rem; }
.oee-value { font-size: 4rem; font-weight: bold; line-height: 1; }
.oee-unit  { font-size: 1.2rem; color: #94a3b8; }
.oee-bar-bg { height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; margin: 0.5rem auto; max-width: 380px; width: 100%; }
.oee-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.oee-hint { font-size: 0.8rem; color: #64748b; margin-bottom: 0.75rem; }

/* OEE 三要素 */
.oee-factors { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.5rem; }
.factor-item { background: #f8fafc; border-radius: 8px; padding: 0.6rem 0.9rem; text-align: center; flex: 1; border: 1px solid #e2e8f0; }
.factor-label { font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem; }
.factor-value { font-size: 1.4rem; font-weight: bold; }
.factor-sub   { font-size: 0.68rem; color: #94a3b8; margin-top: 0.2rem; }
.factor-divider { font-size: 1.2rem; color: #94a3b8; font-weight: bold; flex-shrink: 0; }

/* 底部指標 */
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #f1f5f9; flex-shrink: 0; }
.metric-card { padding: 0.75rem 0.5rem; text-align: center; border-right: 1px solid #f1f5f9; display: flex; flex-direction: column; justify-content: center; }
.metric-card:last-child { border-right: none; }
.metric-label { font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem; }
.metric-value { font-size: 1.6rem; font-weight: bold; }
.metric-unit  { font-size: 0.7rem; color: #94a3b8; }

/* 右側 */
.right-col { display: flex; flex-direction: column; gap: 0.75rem; min-height: 0; }
.event-card { flex: 1; min-height: 0; }
.event-list { padding: 0.4rem 0.65rem; display: flex; flex-direction: column; gap: 0; overflow-y: auto; flex: 1; min-height: 0; }
.no-warning { padding: 1rem; text-align: center; color: #16a34a; font-size: 0.85rem; font-weight: bold; }
.event-item { padding: 0.45rem 0.4rem; border-bottom: 1px solid #f1f5f9; border-left: 3px solid transparent; }
.event-item:last-child { border-bottom: none; }
.item-error { border-left-color: #ef4444; background-color: #fff5f5; }
.item-warn  { border-left-color: #eab308; background-color: #fffbeb; }
.event-time { font-size: 0.68rem; color: #94a3b8; font-family: monospace; margin-bottom: 0.15rem; }
.event-content { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
.event-tag { font-size: 0.68rem; font-weight: bold; padding: 0.1rem 0.35rem; border-radius: 4px; flex-shrink: 0; }
.tag-error { background: #fee2e2; color: #dc2626; }
.tag-warn  { background: #fef9c3; color: #ca8a04; }
.tag-ok    { background: #dcfce7; color: #16a34a; }
.event-msg { font-size: 0.75rem; color: #475569; }

/* 快捷入口 */
.shortcut-card { flex-shrink: 0; }
.shortcut-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; padding: 0.6rem; }
.shortcut-item { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.5rem 0.25rem; border-radius: 8px; cursor: pointer; background: #f8fafc; transition: all 0.15s; border: 1px solid #e2e8f0; }
.shortcut-item:hover { background: #e0f2fe; border-color: #0ea5e9; transform: translateY(-2px); }
.sc-icon { font-size: 1.2rem; }
.sc-name { font-size: 0.68rem; font-weight: bold; color: #475569; text-align: center; }

/* 顏色 */
.text-white  { color: #1e293b; }
.text-green  { color: #16a34a; }
.text-yellow { color: #ca8a04; }
.text-red    { color: #dc2626; }
.text-cyan   { color: #0891b2; }
.bar-green   { background-color: #22c55e; }
.bar-yellow  { background-color: #eab308; }
.bar-red     { background-color: #ef4444; }
</style>