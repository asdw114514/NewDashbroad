<template>
  <div class="dashboard-container">

    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-orange">設備管理</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">系統管理員：王大明</div>
      </div>
    </header>

    <main class="main-content">

      <!-- 區塊一：KPI 總覽 -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">🏭</div>
          <div class="kpi-info">
            <div class="kpi-label">設備總數</div>
            <div class="kpi-value text-white">{{ kpi.total }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <div class="kpi-label">運轉中</div>
            <div class="kpi-value text-green">{{ kpi.running }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🔧</div>
          <div class="kpi-info">
            <div class="kpi-label">待保養</div>
            <div class="kpi-value text-yellow">{{ kpi.maintenance }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🚨</div>
          <div class="kpi-info">
            <div class="kpi-label">異常停機</div>
            <div class="kpi-value text-red">{{ kpi.fault }}</div>
          </div>
        </div>
      </section>

      <!-- 區塊二 + 三：下方兩�� -->
      <div class="bottom-grid">

        <!-- 設備列表 -->
        <section class="card table-section">
          <div class="card-header">
            <span>📋 設備列表</span>
            <input class="search-input" v-model="searchText" placeholder="搜尋設備..." />
          </div>
          <div class="table-wrap">
            <table class="asset-table">
              <thead>
                <tr>
                  <th>機台編號</th>
                  <th>設備名稱</th>
                  <th>狀態</th>
                  <th>稼動率</th>
                  <th>累計時數</th>
                  <th>下次保養</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="asset in filteredAssets" :key="asset.id">
                  <td class="id-cell">{{ asset.id }}</td>
                  <td>{{ asset.name }}</td>
                  <td>
                    <span class="status-badge" :class="asset.statusClass">
                      {{ asset.status }}
                    </span>
                  </td>
                  <td>
                    <div class="oee-wrap">
                      <span :class="getOeeTextClass(asset.oee)">{{ asset.oee }}%</span>
                      <div class="mini-bar">
                        <div class="mini-bar-fill" :class="getOeeBarClass(asset.oee)" :style="{ width: asset.oee + '%' }"></div>
                      </div>
                    </div>
                  </td>
                  <td>{{ asset.hours }} h</td>
                  <td>
                    <span :class="getMaintenanceClass(asset.nextMaintenance)">
                      {{ asset.nextMaintenance }}
                    </span>
                  </td>
                  <td>
                    <button class="detail-btn">詳情</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 右側：保養提醒 + 趨勢圖 -->
        <div class="right-col">

          <!-- 保養排程提醒 -->
          <section class="card">
            <div class="card-header">🔔 保養排程提醒</div>
            <div class="maintenance-list">
              <div
                class="maintenance-item"
                v-for="item in maintenanceAlerts"
                :key="item.id"
              >
                <div class="m-left">
                  <span class="m-id">{{ item.id }}</span>
                  <span class="m-name">{{ item.name }}</span>
                </div>
                <span class="m-days" :class="item.daysClass">
                  {{ item.days > 0 ? `剩 ${item.days} 天` : '已逾期' }}
                </span>
              </div>
            </div>
          </section>

          <!-- 稼動率趨勢圖（純 CSS 模擬） -->
          <section class="card">
            <div class="card-header">📈 近7日稼動率趨勢</div>
            <div class="chart-area">
              <div class="chart-bars">
                <div
                  class="chart-col"
                  v-for="(day, i) in trendData"
                  :key="i"
                >
                  <div class="bar-labels">
                    <span
                      v-for="(val, j) in day.values"
                      :key="j"
                      class="bar-segment"
                      :class="getOeeBarClass(val)"
                      :style="{ height: val + '%' }"
                      :title="`INJ-${j+1}0${j+1}: ${val}%`"
                    ></span>
                  </div>
                  <div class="bar-date">{{ day.date }}</div>
                </div>
              </div>
              <div class="chart-legend">
                <span v-for="(m, i) in machines" :key="i" class="legend-item">
                  <span class="legend-dot" :class="m.color"></span>{{ m.name }}
                </span>
              </div>
            </div>
          </section>

        </div>
      </div>

    </main>

    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NavDrawer from '@/components/NavDrawer.vue'

const router = useRouter()

// 時間
const currentTime = ref('')
let timer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

// KPI
const kpi = ref({ total: 8, running: 5, maintenance: 2, fault: 1 })

// 設備列表
const assets = ref([
  { id: 'INJ-101', name: '射出成型機 A', status: '運轉中', statusClass: 'status-running', oee: 91.5, hours: 4820, nextMaintenance: '2026-05-25' },
  { id: 'INJ-102', name: '射出成型機 B', status: '運轉中', statusClass: 'status-running', oee: 87.2, hours: 3650, nextMaintenance: '2026-06-10' },
  { id: 'INJ-103', name: '射出成型機 C', status: '異常停機', statusClass: 'status-fault',   oee: 12.0, hours: 5100, nextMaintenance: '2026-05-14' },
  { id: 'INJ-104', name: '射出成型機 D', status: '運轉中', statusClass: 'status-running', oee: 88.0, hours: 2900, nextMaintenance: '2026-07-01' },
  { id: 'CNC-201', name: 'CNC 加工機 A', status: '待保養',  statusClass: 'status-warn',    oee: 55.0, hours: 6300, nextMaintenance: '2026-05-13' },
  { id: 'CNC-202', name: 'CNC 加工機 B', status: '運轉中', statusClass: 'status-running', oee: 93.1, hours: 1800, nextMaintenance: '2026-08-15' },
  { id: 'ASM-301', name: '組裝產線 1',   status: '待保養',  statusClass: 'status-warn',    oee: 60.5, hours: 7200, nextMaintenance: '2026-05-16' },
  { id: 'ASM-302', name: '組裝產線 2',   status: '運轉中', statusClass: 'status-running', oee: 85.0, hours: 3300, nextMaintenance: '2026-06-30' },
])

const searchText = ref('')
const filteredAssets = computed(() => {
  if (!searchText.value) return assets.value
  return assets.value.filter(a =>
    a.id.includes(searchText.value) || a.name.includes(searchText.value)
  )
})

// 保養提醒
const maintenanceAlerts = computed(() => {
  const today = new Date('2026-05-12')
  return assets.value
    .map(a => {
      const diff = Math.ceil((new Date(a.nextMaintenance) - today) / 86400000)
      return {
        id: a.id,
        name: a.name,
        days: diff,
        daysClass: diff <= 0 ? 'days-overdue' : diff <= 3 ? 'days-urgent' : diff <= 7 ? 'days-warn' : 'days-ok'
      }
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 6)
})

// 趨勢圖假資料
const trendData = ref([
  { date: '05/06', values: [88, 91, 55, 85] },
  { date: '05/07', values: [90, 89, 40, 87] },
  { date: '05/08', values: [85, 92, 20, 88] },
  { date: '05/09', values: [91, 88, 15, 90] },
  { date: '05/10', values: [89, 90, 18, 85] },
  { date: '05/11', values: [92, 91, 12, 88] },
  { date: '05/12', values: [91, 87, 12, 85] },
])

const machines = [
  { name: 'INJ-101', color: 'dot-green' },
  { name: 'INJ-102', color: 'dot-cyan' },
  { name: 'INJ-103', color: 'dot-red' },
  { name: 'INJ-104', color: 'dot-blue' },
]

// 工具函數
const getOeeTextClass = (v) => v >= 85 ? 'text-green' : v >= 50 ? 'text-yellow' : 'text-red'
const getOeeBarClass  = (v) => v >= 85 ? 'bar-green'  : v >= 50 ? 'bar-yellow'  : 'bar-red'
const getMaintenanceClass = (date) => {
  const diff = Math.ceil((new Date(date) - new Date('2026-05-12')) / 86400000)
  return diff <= 0 ? 'text-red' : diff <= 3 ? 'text-red' : diff <= 7 ? 'text-yellow' : 'text-green'
}

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #475569;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background-color: #0f172a;
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-orange { background-color: #f97316; }
.back-btn {
  background: #1e293b; color: #94a3b8; border: none;
  padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer;
  font-size: 0.85rem; transition: background 0.2s;
}
.back-btn:hover { background: #334155; color: white; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }

/* Main */
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; flex: 1; }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.kpi-card {
  background-color: #1e293b;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}
.kpi-icon { font-size: 2rem; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
.kpi-value { font-size: 2rem; font-weight: bold; }

/* 下方兩欄 */
.bottom-grid { display: grid; grid-template-columns: 1fr 380px; gap: 1.5rem; }
.right-col { display: flex; flex-direction: column; gap: 1.5rem; }

/* 共用卡片 */
.card {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}
.card-header {
  background-color: #1e293b;
  color: white;
  padding: 0.75rem 1.25rem;
  font-weight: bold;
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-input {
  background: #334155; border: none; color: white;
  padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem;
  outline: none;
}
.search-input::placeholder { color: #64748b; }

/* 表格 */
.table-wrap { overflow-x: auto; }
.asset-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.asset-table thead tr { background-color: #f1f5f9; }
.asset-table th { padding: 0.75rem 1rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.8rem; }
.asset-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.asset-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; }

.status-badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: bold; }
.status-running { background: #dcfce7; color: #16a34a; }
.status-fault   { background: #fee2e2; color: #dc2626; }
.status-warn    { background: #fef9c3; color: #ca8a04; }

.oee-wrap { display: flex; flex-direction: column; gap: 0.25rem; }
.mini-bar { height: 6px; background: #f1f5f9; border-radius: 999px; overflow: hidden; width: 80px; }
.mini-bar-fill { height: 100%; border-radius: 999px; }

.detail-btn {
  background: #e0f2fe; color: #0284c7; border: none;
  padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer;
  font-size: 0.8rem; font-weight: bold; transition: background 0.2s;
}
.detail-btn:hover { background: #bae6fd; }

/* 保養提醒 */
.maintenance-list { padding: 0.75rem 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
.maintenance-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 0.75rem; background: #f8fafc; border-radius: 6px;
  border-left: 3px solid #e2e8f0;
}
.m-left { display: flex; gap: 0.5rem; align-items: center; }
.m-id { font-family: monospace; font-size: 0.8rem; color: #0ea5e9; font-weight: bold; }
.m-name { font-size: 0.85rem; color: #475569; }
.m-days { font-size: 0.85rem; font-weight: bold; }
.days-overdue { color: #dc2626; }
.days-urgent  { color: #dc2626; }
.days-warn    { color: #ca8a04; }
.days-ok      { color: #16a34a; }

/* 趨勢圖 */
.chart-area { padding: 1rem 1.25rem; }
.chart-bars { display: flex; gap: 0.5rem; align-items: flex-end; height: 120px; margin-bottom: 0.5rem; }
.chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.bar-labels { display: flex; gap: 2px; align-items: flex-end; height: 100px; }
.bar-segment { width: 8px; border-radius: 3px 3px 0 0; transition: height 0.5s; display: block; }
.bar-date { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
.chart-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
.legend-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #64748b; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }

/* 顏色 */
.text-white  { color: white; }
.text-green  { color: #16a34a; }
.text-yellow { color: #ca8a04; }
.text-red    { color: #dc2626; }

.bar-green  { background-color: #22c55e; }
.bar-yellow { background-color: #eab308; }
.bar-red    { background-color: #ef4444; }

.dot-green { background-color: #22c55e; }
.dot-cyan  { background-color: #06b6d4; }
.dot-red   { background-color: #ef4444; }
.dot-blue  { background-color: #3b82f6; }
</style>