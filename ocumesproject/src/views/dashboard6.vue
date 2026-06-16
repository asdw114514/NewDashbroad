<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-purple">人員工位與出勤監控</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">早班領班：林志明</div>
      </div>
    </header>

    <main class="main-content">

      <!-- 頂部 KPI -->
      <section class="summary-row">
        <div class="summary-card">
          <div class="sum-title">今日班次</div>
          <div class="sum-value text-dark">{{ data.shift || '--' }}</div>
        </div>
        <div class="summary-card">
          <div class="sum-title">總人數</div>
          <div class="sum-value text-dark">{{ data.totalCount ?? '--' }} <span class="sum-unit">人</span></div>
        </div>
        <div class="summary-card">
          <div class="sum-title">實際出勤</div>
          <div class="sum-value text-green">{{ data.presentCount ?? '--' }} <span class="sum-unit">人</span></div>
        </div>
        <div class="summary-card">
          <div class="sum-title">請假 / 缺席</div>
          <div class="sum-value text-red">{{ data.leaveCount ?? '--' }} <span class="sum-unit">人</span></div>
        </div>
        <div class="summary-card">
          <div class="sum-title">跨線支援</div>
          <div class="sum-value text-blue">{{ data.supportCount ?? '--' }} <span class="sum-unit">人</span></div>
        </div>
        <div class="summary-card highlight-card">
          <div class="sum-title text-white">人力稼動率</div>
          <div class="sum-value text-white">{{ utilRate }} <span class="sum-unit">%</span></div>
        </div>
      </section>

      <!-- API 狀態 + 最後更新 -->
      <div class="api-bar">
        <span :class="apiConnected ? 'api-ok' : 'api-err'">
          {{ apiConnected ? '🟢 API 連線正常' : '🔴 API 連線失敗' }}
        </span>
        <span class="api-time">資料日期：{{ data.date || '--' }}　最後更新：{{ updatedAt }}</span>
      </div>

      <!-- 工位卡片 -->
      <section class="station-grid">
        <div v-if="!apiConnected && stations.length === 0" class="no-data-card">
          📭 尚無人員資料，請至後台管理 → 人員管理 輸入班次資料
        </div>

        <div
          class="card station-card"
          v-for="s in stations" :key="s.id"
          :class="{ 'alert-pulse': s.status === '缺料呼叫' || s.status === '設備異常' }"
        >
          <div class="card-header dark flex-between">
            <span class="station-name">{{ s.id }} - {{ s.name }}</span>
            <span :class="['status-badge', getStatusColor(s.status)]">{{ s.status }}</span>
          </div>

          <div class="operator-info">
            <div class="avatar" :class="s.operator ? 'bg-cyan' : 'bg-gray'">
              {{ s.operator ? s.operator.charAt(0) : '?' }}
            </div>
            <div class="operator-details">
              <div class="op-name">{{ s.operator || '無人派駐' }}</div>
              <div class="op-emp-id" v-if="s.empId">工號: {{ s.empId }}</div>
              <div class="op-skill" v-if="s.skill > 0">
                技能：<span class="stars">{{ '★'.repeat(s.skill) }}{{ '☆'.repeat(5 - s.skill) }}</span>
              </div>
            </div>
          </div>

          <div class="empty-state" v-if="!s.operator">
            <p>目前無安排人員於此工位</p>
          </div>
        </div>
      </section>

    </main>
    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavDrawer from '@/components/NavDrawer.vue'

const API_URL = 'http://localhost:1880/personnel'
const POLL_INTERVAL = 30000 // 30 秒更新一次（班次資料不需要太頻繁）

const currentTime  = ref('')
const apiConnected = ref(false)
const updatedAt    = ref('--')
const data         = ref({})
const stations     = computed(() => data.value.stations || [])
const utilRate     = computed(() => {
  if (!data.value.totalCount) return '--'
  return ((data.value.presentCount / data.value.totalCount) * 100).toFixed(1)
})

let timeTimer = null
let pollTimer = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

const fetchPersonnel = async () => {
  try {
    const res  = await fetch(API_URL)
    const json = await res.json()
    if (json.data) {
      data.value         = json.data
      apiConnected.value = true
      updatedAt.value    = new Date().toTimeString().split(' ')[0]
    } else {
      apiConnected.value = false
    }
  } catch (e) {
    apiConnected.value = false
  }
}

const getStatusColor = (status) => {
  const map = {
    '正常作業': 'badge-green',
    '缺料呼叫': 'badge-red',
    '設備異常': 'badge-red',
    '閒置中':   'badge-gray',
  }
  return map[status] || 'badge-gray'
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  fetchPersonnel()
  pollTimer = setInterval(fetchPersonnel, POLL_INTERVAL)
})
onUnmounted(() => {
  clearInterval(timeTimer)
  clearInterval(pollTimer)
})
</script>

<style scoped>
.dashboard-container { height: 100vh; background-color: #475569; color: #1e293b; font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-purple { background-color: #8b5cf6; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }

.main-content { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; flex: 1; overflow: hidden; min-height: 0; }

/* KPI */
.summary-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; flex-shrink: 0; }
.summary-card { background: white; border-radius: 0.75rem; padding: 1rem 1.25rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
.highlight-card { background-color: #3b82f6; }
.sum-title { font-size: 0.78rem; color: #64748b; font-weight: bold; margin-bottom: 0.4rem; }
.sum-value { font-size: 2rem; font-weight: bold; line-height: 1; }
.sum-unit { font-size: 0.85rem; font-weight: normal; color: #94a3b8; }
.text-dark  { color: #1e293b; }
.text-green { color: #16a34a; }
.text-red   { color: #dc2626; }
.text-blue  { color: #3b82f6; }
.text-white { color: white; }
.highlight-card .sum-title { color: #bfdbfe; }

/* API 狀態列 */
.api-bar { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: bold; flex-shrink: 0; }
.api-ok  { color: #16a34a; }
.api-err { color: #dc2626; }
.api-time { color: #94a3b8; font-weight: normal; }

/* 工位卡片 */
.station-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; overflow-y: auto; flex: 1; min-height: 0; padding-bottom: 0.5rem; }
.no-data-card { grid-column: 1/-1; background: white; border-radius: 0.75rem; padding: 3rem; text-align: center; color: #94a3b8; font-size: 1rem; }

.card { background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; }
.card-header { padding: 0.65rem 1rem; font-weight: bold; font-size: 0.9rem; }
.card-header.dark { background-color: #1e293b; color: white; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.station-name { font-size: 0.88rem; }

.status-badge { padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: bold; color: white; }
.badge-green { background: #16a34a; }
.badge-red   { background: #dc2626; }
.badge-gray  { background: #94a3b8; }

.operator-info { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.1rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
.avatar { width: 44px; height: 44px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: bold; flex-shrink: 0; }
.bg-cyan { background-color: #06b6d4; }
.bg-gray { background-color: #94a3b8; }
.operator-details { display: flex; flex-direction: column; gap: 0.15rem; }
.op-name   { font-size: 1rem; font-weight: bold; color: #0f172a; }
.op-emp-id { font-size: 0.75rem; color: #64748b; font-family: monospace; }
.op-skill  { font-size: 0.8rem; color: #475569; }
.stars { color: #f59e0b; letter-spacing: 2px; }

.empty-state { padding: 1.5rem 1rem; text-align: center; color: #94a3b8; font-size: 0.88rem; }

.alert-pulse { animation: border-pulse 1.5s infinite; border: 2px solid #ef4444; }
@keyframes border-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
  70%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}
</style>