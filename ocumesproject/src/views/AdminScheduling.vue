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

      <!-- API 狀態 -->
      <div class="api-bar">
        <span :class="apiConnected ? 'api-ok' : 'api-err'">
          {{ apiConnected ? '🟢 API 連線正常' : '🔴 API 連線失敗' }}
        </span>
        <button class="add-btn" @click="showModal = true">➕ 新增工單</button>
      </div>

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">📋</div>
          <div class="kpi-info">
            <div class="kpi-label">總工單數</div>
            <div class="kpi-value text-white">{{ orders.length }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <div class="kpi-label">已完成</div>
            <div class="kpi-value text-green">{{ orders.filter(o=>o.status==='完成').length }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⚙️</div>
          <div class="kpi-info">
            <div class="kpi-label">生產中</div>
            <div class="kpi-value text-cyan">{{ orders.filter(o=>o.status==='生產中').length }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-info">
            <div class="kpi-label">待生產</div>
            <div class="kpi-value text-yellow">{{ orders.filter(o=>o.status==='待生產').length }}</div>
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
              <option value="待生產">待生產</option>
              <option value="生產中">生產中</option>
              <option value="完成">完成</option>
            </select>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>工單號</th>
                  <th>產品名稱</th>
                  <th>機台</th>
                  <th>數量</th>
                  <th>開始日期</th>
                  <th>狀態</th>
                  <th>刪除</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="7" class="no-data">⏳ 載入中...</td>
                </tr>
                <tr v-else-if="filteredOrders.length === 0">
                  <td colspan="7" class="no-data">📭 尚無工單資料</td>
                </tr>
                <tr v-else v-for="order in filteredOrders" :key="order._id">
                  <td class="id-cell">{{ order.orderId }}</td>
                  <td>{{ order.product }}</td>
                  <td><span class="machine-tag">{{ order.machine }}</span></td>
                  <td>{{ order.quantity }}</td>
                  <td class="text-muted">{{ order.startDate }}</td>
                  <td>
                    <select class="status-select" :value="order.status" @change="updateStatus(order, $event.target.value)">
                      <option value="待生產">待生產</option>
                      <option value="生產中">生產中</option>
                      <option value="完成">完成</option>
                    </select>
                  </td>
                  <td>
                    <button class="del-btn" @click="deleteOrder(order.orderId)">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 甘特圖（靜態示意） -->
        <section class="card">
          <div class="card-header">📅 排程甘特圖（示意）</div>
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
                    v-for="block in row.blocks" :key="block.id"
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

    <!-- 新增 Modal -->
    <Teleport to="body">
      <div class="order-modal-overlay" v-if="showModal" @click.self="showModal = false">
        <div class="order-modal">
          <div class="order-modal-header">➕ 新增工單</div>
          <div class="order-modal-body">
            <div class="order-form-group">
              <label>工單號</label>
              <input class="order-form-input" v-model="form.orderId" placeholder="例：ORD-001">
            </div>
            <div class="order-form-group">
              <label>產品名稱</label>
              <input class="order-form-input" v-model="form.product" placeholder="例：外殼A型">
            </div>
            <div class="order-form-group">
              <label>數量</label>
              <input class="order-form-input" type="number" v-model="form.quantity" placeholder="例：500">
            </div>
            <div class="order-form-group">
              <label>機台</label>
              <select class="order-form-input" v-model="form.machine">
                <option value="">請選擇機台</option>
                <option v-for="m in machines" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="order-form-group">
              <label>開始日期</label>
              <input class="order-form-input" type="date" v-model="form.startDate">
            </div>
          </div>
          <div class="order-modal-footer">
            <button class="order-btn order-btn-outline" @click="showModal = false">取消</button>
            <button class="order-btn order-btn-primary" @click="addOrder">確認新增</button>
          </div>
        </div>
      </div>
    </Teleport>
    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NavDrawer from '@/components/NavDrawer.vue'

const router = useRouter()
const API = 'http://localhost:1880'
const currentTime = ref('')
let timer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

const apiConnected = ref(false)
const loading = ref(true)
const orders = ref([])
const filterStatus = ref('')
const showModal = ref(false)
const machines = ['INJ-101','INJ-102','INJ-103','INJ-104','INJ-105','INJ-106']
const form = ref({ orderId:'', product:'', quantity:'', machine:'', startDate:'' })

const filteredOrders = computed(() => {
  if (!filterStatus.value) return orders.value
  return orders.value.filter(o => o.status === filterStatus.value)
})

const fetchOrders = async () => {
  try {
    const res = await fetch(`${API}/orders`)
    const data = await res.json()
    orders.value = data.data || []
    apiConnected.value = true
  } catch {
    apiConnected.value = false
  } finally {
    loading.value = false
  }
}

const addOrder = async () => {
  if (!form.value.orderId || !form.value.product || !form.value.machine) return alert('請填寫必填欄位')
  await fetch(`${API}/orders/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form.value, status: '待生產' })
  })
  showModal.value = false
  form.value = { orderId:'', product:'', quantity:'', machine:'', startDate:'' }
  fetchOrders()
}

const updateStatus = async (order, status) => {
  await fetch(`${API}/orders/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: order.orderId, status })
  })
  fetchOrders()
}

const deleteOrder = async (orderId) => {
  if (!confirm(`確定刪除工單 ${orderId}？`)) return
  await fetch(`${API}/orders/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  })
  fetchOrders()
}

const timeSlots = ['08:00','10:00','12:00','14:00','16:00','18:00']
const ganttData = ref([
  { machine: 'INJ-101', blocks: [
    { id:1, label:'ORD-001', left:0,  width:25, colorClass:'block-done' },
    { id:2, label:'ORD-003', left:30, width:30, colorClass:'block-running' },
  ]},
  { machine: 'INJ-102', blocks: [
    { id:1, label:'ORD-002', left:10, width:40, colorClass:'block-running' },
  ]},
  { machine: 'INJ-103', blocks: [
    { id:1, label:'ORD-004', left:0,  width:20, colorClass:'block-done' },
    { id:2, label:'ORD-005', left:55, width:35, colorClass:'block-pending' },
  ]},
])

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000); fetchOrders() })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-blue { background-color: #3b82f6; }
.back-btn { background: #1e293b; color: #94a3b8; border: none; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.back-btn:hover { background: #334155; color: white; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; overflow-y: auto; min-height: 0; }
.api-bar { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: bold; }
.api-ok { color: #16a34a; }
.api-err { color: #dc2626; }
.add-btn { background: #0ea5e9; color: white; border: none; padding: 0.45rem 1rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
.add-btn:hover { background: #0284c7; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; flex-shrink: 0; }
.kpi-card { background-color: #1e293b; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.kpi-icon { font-size: 2rem; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
.kpi-value { font-size: 2rem; font-weight: bold; }
.bottom-grid { display: grid; grid-template-columns: 1fr 400px; gap: 1.5rem; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.filter-select { background: #334155; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.75rem 1rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.8rem; }
.data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; font-size: 0.8rem; }
.machine-tag { background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.78rem; font-weight: bold; font-family: monospace; }
.status-select { border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.25rem 0.5rem; font-size: 0.8rem; outline: none; cursor: pointer; }
.del-btn { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.del-btn:hover { background: #fca5a5; }
.text-muted { color: #64748b; font-size: 0.85rem; }
.no-data { text-align: center; padding: 2rem; color: #94a3b8; }
/* 甘特圖 */
.gantt-area { padding: 1rem 1.25rem; }
.gantt-time-header { display: flex; justify-content: space-between; padding: 0 0 0.5rem 72px; }
.gantt-time { font-size: 0.7rem; color: #94a3b8; }
.gantt-rows { display: flex; flex-direction: column; gap: 0.75rem; }
.gantt-row { display: flex; align-items: center; gap: 0.75rem; }
.gantt-label { width: 64px; font-size: 0.75rem; font-weight: bold; color: #0ea5e9; font-family: monospace; flex-shrink: 0; }
.gantt-track { flex: 1; height: 30px; background: #f1f5f9; border-radius: 4px; position: relative; overflow: hidden; }
.gantt-block { position: absolute; top: 3px; height: 24px; border-radius: 4px; display: flex; align-items: center; padding: 0 0.4rem; overflow: hidden; }
.block-label { font-size: 0.68rem; font-weight: bold; color: white; white-space: nowrap; }
.block-done    { background-color: #22c55e; }
.block-running { background-color: #3b82f6; }
.block-pending { background-color: #eab308; }
/* 顏色 */
.text-white  { color: white; }
.text-green  { color: #16a34a; }
.text-cyan   { color: #0891b2; }
.text-yellow { color: #ca8a04; }
</style>
<style>
.order-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.order-modal { background: white !important; border-radius: 0.75rem; width: 420px; max-width: 90vw; box-shadow: 0 20px 40px rgba(0,0,0,0.3); overflow: hidden; }
.order-modal-header { background: #1e293b !important; color: white !important; padding: 1rem 1.5rem; font-weight: bold; font-size: 1rem; }
.order-modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; background: white; }
.order-modal-footer { padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; background: white; }
.order-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.order-form-group label { font-size: 0.8rem; font-weight: bold; color: #475569; }
.order-form-input { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1 !important; border-radius: 6px; font-size: 0.88rem; outline: none; background: white !important; color: #1e293b !important; width: 100%; box-sizing: border-box; }
.order-form-input:focus { border-color: #0ea5e9 !important; }
.order-btn { padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.88rem; border: none; }
.order-btn-primary { background: #0ea5e9 !important; color: white !important; }
.order-btn-primary:hover { background: #0284c7 !important; }
.order-btn-outline { background: white !important; border: 1px solid #cbd5e1 !important; color: #475569 !important; }
.order-btn-outline:hover { background: #f1f5f9 !important; }
</style>