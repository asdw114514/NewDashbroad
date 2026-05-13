<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-cyan">生產追蹤與看板</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">系統管理員：王大明</div>
      </div>
    </header>

    <main class="main-content">

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">🏭</div>
          <div class="kpi-info">
            <div class="kpi-label">今日總產量</div>
            <div class="kpi-value text-white">2,840</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🔄</div>
          <div class="kpi-info">
            <div class="kpi-label">在製品 (WIP)</div>
            <div class="kpi-value text-cyan">430</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📊</div>
          <div class="kpi-info">
            <div class="kpi-label">整體 OEE</div>
            <div class="kpi-value text-green">87.3%</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-info">
            <div class="kpi-label">異常工站</div>
            <div class="kpi-value text-red">1</div>
          </div>
        </div>
      </section>

      <!-- 主要內容 -->
      <div class="bottom-grid">

        <!-- WIP 追蹤看板 -->
        <section class="card">
          <div class="card-header">🔄 在製品 (WIP) 追蹤</div>
          <div class="kanban-board">
            <div class="kanban-col" v-for="col in kanbanCols" :key="col.title">
              <div class="kanban-col-header" :class="col.headerClass">
                {{ col.title }}
                <span class="kanban-count">{{ col.items.length }}</span>
              </div>
              <div class="kanban-items">
                <div class="kanban-item" v-for="item in col.items" :key="item.id">
                  <div class="item-id">{{ item.id }}</div>
                  <div class="item-product">{{ item.product }}</div>
                  <div class="item-meta">
                    <span class="item-qty">{{ item.qty }} pcs</span>
                    <span class="item-station">{{ item.station }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 右側：各機台 OEE -->
        <section class="card">
          <div class="card-header">📊 各機台即時 OEE</div>
          <div class="oee-list">
            <div class="oee-row" v-for="m in machines" :key="m.id">
              <div class="oee-id">{{ m.id }}</div>
              <div class="oee-bar-wrap">
                <div class="oee-bar-bg">
                  <div class="oee-bar-fill" :class="getOeeClass(m.oee)" :style="{ width: m.oee + '%' }"></div>
                </div>
                <span class="oee-val" :class="getOeeTextClass(m.oee)">{{ m.oee }}%</span>
              </div>
              <span class="status-dot" :class="m.statusClass"></span>
            </div>
          </div>
        </section>

      </div>
    </main>

    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NavDrawer from '@/components/NavDrawer.vue'

const router = useRouter()
const currentTime = ref('')
let timer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

const kanbanCols = ref([
  {
    title: '待加工', headerClass: 'header-yellow', items: [
      { id: 'WIP-045', product: '外殼 A型', qty: 100, station: 'INJ-101' },
      { id: 'WIP-046', product: '端蓋 C型', qty: 80,  station: 'INJ-102' },
      { id: 'WIP-047', product: '框架 J型', qty: 60,  station: 'CNC-201' },
    ]
  },
  {
    title: '加工中', headerClass: 'header-blue', items: [
      { id: 'WIP-038', product: '齒輪組 B', qty: 50,  station: 'CNC-201' },
      { id: 'WIP-040', product: '支架 D型', qty: 75,  station: 'ASM-301' },
      { id: 'WIP-042', product: '轉子 G型', qty: 45,  station: 'CNC-202' },
    ]
  },
  {
    title: '待檢驗', headerClass: 'header-purple', items: [
      { id: 'WIP-033', product: '底板 E型', qty: 90,  station: 'QC-01' },
      { id: 'WIP-035', product: '護蓋 L型', qty: 130, station: 'QC-02' },
    ]
  },
  {
    title: '已完成', headerClass: 'header-green', items: [
      { id: 'WIP-020', product: '外殼 A型', qty: 200, station: 'FG-01' },
      { id: 'WIP-025', product: '蓋板 I型', qty: 350, station: 'FG-01' },
      { id: 'WIP-028', product: '連接器 H', qty: 150, station: 'FG-02' },
    ]
  },
])

const machines = ref([
  { id: 'INJ-101', oee: 91.5, statusClass: 'dot-green' },
  { id: 'INJ-102', oee: 87.2, statusClass: 'dot-green' },
  { id: 'INJ-103', oee: 12.0, statusClass: 'dot-red' },
  { id: 'INJ-104', oee: 88.0, statusClass: 'dot-green' },
  { id: 'CNC-201', oee: 55.0, statusClass: 'dot-yellow' },
  { id: 'CNC-202', oee: 93.1, statusClass: 'dot-green' },
  { id: 'ASM-301', oee: 60.5, statusClass: 'dot-yellow' },
  { id: 'ASM-302', oee: 85.0, statusClass: 'dot-green' },
])

const getOeeClass     = (v) => v >= 85 ? 'bar-green' : v >= 50 ? 'bar-yellow' : 'bar-red'
const getOeeTextClass = (v) => v >= 85 ? 'text-green' : v >= 50 ? 'text-yellow' : 'text-red'

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { min-height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-cyan { background-color: #06b6d4; }
.back-btn { background: #1e293b; color: #94a3b8; border: none; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: background 0.2s; }
.back-btn:hover { background: #334155; color: white; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; flex: 1; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.kpi-card { background-color: #1e293b; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.kpi-icon { font-size: 2rem; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
.kpi-value { font-size: 2rem; font-weight: bold; }
.bottom-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; }
.kanban-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; height: calc(100% - 44px); }
.kanban-col { border-right: 1px solid #f1f5f9; display: flex; flex-direction: column; }
.kanban-col:last-child { border-right: none; }
.kanban-col-header { padding: 0.6rem 1rem; font-size: 0.85rem; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
.header-yellow { background: #fef9c3; color: #a16207; }
.header-blue   { background: #dbeafe; color: #1d4ed8; }
.header-purple { background: #f3e8ff; color: #7e22ce; }
.header-green  { background: #dcfce7; color: #15803d; }
.kanban-count { background: rgba(0,0,0,0.1); border-radius: 999px; padding: 0.1rem 0.5rem; font-size: 0.75rem; }
.kanban-items { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; flex: 1; }
.kanban-item { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.6rem 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.item-id { font-family: monospace; font-size: 0.75rem; color: #0ea5e9; font-weight: bold; }
.item-product { font-size: 0.85rem; color: #1e293b; font-weight: bold; margin: 0.2rem 0; }
.item-meta { display: flex; justify-content: space-between; }
.item-qty { font-size: 0.75rem; color: #64748b; }
.item-station { font-size: 0.75rem; color: #7c3aed; font-weight: bold; }
.oee-list { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
.oee-row { display: flex; align-items: center; gap: 0.75rem; }
.oee-id { width: 70px; font-family: monospace; font-size: 0.8rem; font-weight: bold; color: #0ea5e9; flex-shrink: 0; }
.oee-bar-wrap { flex: 1; display: flex; align-items: center; gap: 0.5rem; }
.oee-bar-bg { flex: 1; height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.oee-bar-fill { height: 100%; border-radius: 999px; transition: width 0.5s; }
.oee-val { width: 48px; font-size: 0.82rem; font-weight: bold; text-align: right; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.bar-green  { background-color: #22c55e; }
.bar-yellow { background-color: #eab308; }
.bar-red    { background-color: #ef4444; }
.text-white  { color: white; }
.text-green  { color: #16a34a; }
.text-cyan   { color: #0891b2; }
.text-yellow { color: #ca8a04; }
.text-red    { color: #dc2626; }
.dot-green  { background-color: #22c55e; }
.dot-yellow { background-color: #eab308; }
.dot-red    { background-color: #ef4444; }
</style>