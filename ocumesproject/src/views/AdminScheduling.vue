<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-blue">生產排程與派工</span>
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
          <div class="kpi-icon">📋</div>
          <div class="kpi-info">
            <div class="kpi-label">今日工單數</div>
            <div class="kpi-value text-white">12</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <div class="kpi-label">已完成</div>
            <div class="kpi-value text-green">5</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⚙️</div>
          <div class="kpi-info">
            <div class="kpi-label">進行中</div>
            <div class="kpi-value text-cyan">4</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-info">
            <div class="kpi-label">待排程</div>
            <div class="kpi-value text-yellow">3</div>
          </div>
        </div>
      </section>

      <!-- 主要內容 -->
      <div class="bottom-grid">

        <!-- 工單列表 -->
        <section class="card">
          <div class="card-header">
            <span>📋 工單排程列表</span>
            <select class="filter-select" v-model="filterStatus">
              <option value="">全部</option>
              <option value="進行中">進行中</option>
              <option value="待排程">待排程</option>
              <option value="已完成">已完成</option>
            </select>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>工單編號</th>
                  <th>產品名稱</th>
                  <th>指派機台</th>
                  <th>計劃數量</th>
                  <th>完成數量</th>
                  <th>預計完成</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in filteredOrders" :key="order.id">
                  <td class="id-cell">{{ order.id }}</td>
                  <td>{{ order.product }}</td>
                  <td><span class="machine-tag">{{ order.machine }}</span></td>
                  <td>{{ order.planQty }}</td>
                  <td>
                    <span :class="order.doneQty >= order.planQty ? 'text-green' : 'text-cyan'">
                      {{ order.doneQty }}
                    </span>
                  </td>
                  <td>{{ order.dueDate }}</td>
                  <td>
                    <span class="status-badge" :class="order.statusClass">{{ order.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 右側：甘特示意 -->
        <section class="card">
          <div class="card-header">📅 今日排程甘特圖（示意）</div>
          <div class="gantt-area">
            <div class="gantt-time-header">
              <span v-for="h in timeSlots" :key="h" class="gantt-time">{{ h }}</span>
            </div>
            <div class="gantt-rows">
              <div class="gantt-row" v-for="row in ganttData" :key="row.machine">
                <div class="gantt-label">{{ row.machine }}</div>
                <div class="gantt-track">
                  <div
                    class="gantt-block"
                    v-for="block in row.blocks"
                    :key="block.id"
                    :style="{ left: block.left + '%', width: block.width + '%' }"
                    :class="block.colorClass"
                    :title="block.label"
                  >
                    <span class="block-label">{{ block.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
const currentTime = ref('')
let timer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

const filterStatus = ref('')

const orders = ref([
  { id: 'WO-2026-001', product: '外殼 A型', machine: 'INJ-101', planQty: 500, doneQty: 500, dueDate: '2026-05-13', status: '已完成', statusClass: 'status-done' },
  { id: 'WO-2026-002', product: '齒輪組 B', machine: 'CNC-201', planQty: 200, doneQty: 120, dueDate: '2026-05-13', status: '進行中', statusClass: 'status-running' },
  { id: 'WO-2026-003', product: '端蓋 C型', machine: 'INJ-102', planQty: 300, doneQty: 300, dueDate: '2026-05-13', status: '已完成', statusClass: 'status-done' },
  { id: 'WO-2026-004', product: '支架 D型', machine: 'ASM-301', planQty: 150, doneQty: 80,  dueDate: '2026-05-13', status: '進行中', statusClass: 'status-running' },
  { id: 'WO-2026-005', product: '底板 E型', machine: 'INJ-103', planQty: 400, doneQty: 0,   dueDate: '2026-05-14', status: '待排程', statusClass: 'status-pending' },
  { id: 'WO-2026-006', product: '外殼 F型', machine: 'INJ-104', planQty: 250, doneQty: 250, dueDate: '2026-05-13', status: '已完成', statusClass: 'status-done' },
  { id: 'WO-2026-007', product: '轉子 G型', machine: 'CNC-202', planQty: 100, doneQty: 60,  dueDate: '2026-05-13', status: '進行中', statusClass: 'status-running' },
  { id: 'WO-2026-008', product: '連接器 H', machine: 'ASM-302', planQty: 600, doneQty: 0,   dueDate: '2026-05-15', status: '待排程', statusClass: 'status-pending' },
  { id: 'WO-2026-009', product: '蓋板 I型', machine: 'INJ-101', planQty: 350, doneQty: 350, dueDate: '2026-05-12', status: '已完成', statusClass: 'status-done' },
  { id: 'WO-2026-010', product: '框架 J型', machine: 'CNC-201', planQty: 180, doneQty: 50,  dueDate: '2026-05-14', status: '進行中', statusClass: 'status-running' },
  { id: 'WO-2026-011', product: '軸承座 K', machine: 'INJ-102', planQty: 220, doneQty: 0,   dueDate: '2026-05-16', status: '待排程', statusClass: 'status-pending' },
  { id: 'WO-2026-012', product: '護蓋 L型', machine: 'ASM-301', planQty: 130, doneQty: 130, dueDate: '2026-05-13', status: '已完成', statusClass: 'status-done' },
])

const filteredOrders = computed(() => {
  if (!filterStatus.value) return orders.value
  return orders.value.filter(o => o.status === filterStatus.value)
})

const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']

const ganttData = ref([
  { machine: 'INJ-101', blocks: [
    { id: 1, label: 'WO-001', left: 0, width: 25, colorClass: 'block-done' },
    { id: 2, label: 'WO-009', left: 25, width: 20, colorClass: 'block-done' },
    { id: 3, label: 'WO-013', left: 50, width: 30, colorClass: 'block-running' },
  ]},
  { machine: 'INJ-102', blocks: [
    { id: 1, label: 'WO-003', left: 0, width: 30, colorClass: 'block-done' },
    { id: 2, label: 'WO-011', left: 55, width: 35, colorClass: 'block-pending' },
  ]},
  { machine: 'CNC-201', blocks: [
    { id: 1, label: 'WO-002', left: 10, width: 40, colorClass: 'block-running' },
    { id: 2, label: 'WO-010', left: 55, width: 30, colorClass: 'block-running' },
  ]},
  { machine: 'ASM-301', blocks: [
    { id: 1, label: 'WO-004', left: 5, width: 45, colorClass: 'block-running' },
    { id: 2, label: 'WO-012', left: 60, width: 25, colorClass: 'block-done' },
  ]},
])

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { min-height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-blue { background-color: #3b82f6; }
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
.bottom-grid { display: grid; grid-template-columns: 1fr 420px; gap: 1.5rem; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.filter-select { background: #334155; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.75rem 1rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.8rem; }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; font-size: 0.8rem; }
.machine-tag { background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.78rem; font-weight: bold; font-family: monospace; }
.status-badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: bold; }
.status-done    { background: #dcfce7; color: #16a34a; }
.status-running { background: #dbeafe; color: #2563eb; }
.status-pending { background: #fef9c3; color: #ca8a04; }
.text-white  { color: white; }
.text-green  { color: #16a34a; }
.text-cyan   { color: #0891b2; }
.text-yellow { color: #ca8a04; }

/* 甘特圖 */
.gantt-area { padding: 1rem 1.25rem; }
.gantt-time-header { display: flex; justify-content: space-between; padding: 0 0 0.5rem 80px; }
.gantt-time { font-size: 0.7rem; color: #94a3b8; }
.gantt-rows { display: flex; flex-direction: column; gap: 0.75rem; }
.gantt-row { display: flex; align-items: center; gap: 0.75rem; }
.gantt-label { width: 72px; font-size: 0.78rem; font-weight: bold; color: #0ea5e9; font-family: monospace; flex-shrink: 0; }
.gantt-track { flex: 1; height: 32px; background: #f1f5f9; border-radius: 4px; position: relative; overflow: hidden; }
.gantt-block { position: absolute; top: 3px; height: 26px; border-radius: 4px; display: flex; align-items: center; padding: 0 0.4rem; overflow: hidden; }
.block-label { font-size: 0.7rem; font-weight: bold; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.block-done    { background-color: #22c55e; }
.block-running { background-color: #3b82f6; }
.block-pending { background-color: #eab308; }
</style>