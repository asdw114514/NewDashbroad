<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🏭 生產排程</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="api-status" :class="apiStatusClass">API：{{ apiStatus }}</div>
      </div>
    </header>

    <main class="main-content">
      <p v-if="operationError" class="error-message">{{ operationError }}</p>
      <section class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">總工單數</div><div class="kpi-value">{{ kpis.total }}</div></div>
        <div class="kpi-card"><div class="kpi-label">已完成</div><div class="kpi-value text-green">{{ kpis.done }}</div></div>
        <div class="kpi-card"><div class="kpi-label">生產中</div><div class="kpi-value text-blue">{{ kpis.running }}</div></div>
        <div class="kpi-card"><div class="kpi-label">待生產</div><div class="kpi-value text-yellow">{{ kpis.pending }}</div></div>
      </section>

      <section class="card">
        <div class="card-header">
          <span>📋 工單列表</span>
          <div class="actions">
            <select v-model="filterStatus" class="input small">
              <option value="">全部狀態</option>
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
            <button class="btn btn-primary" @click="showAddModal = true">➕ 新增工單</button>
          </div>
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
              <tr v-for="order in filteredOrders" :key="order.orderId">
                <td>{{ order.orderId }}</td>
                <td>{{ order.product }}</td>
                <td>{{ order.machine }}</td>
                <td>{{ order.quantity }}</td>
                <td>{{ order.startDate }}</td>
                <td>
                  <select
                    class="input small"
                    :value="order.status"
                    @change="updateOrderStatus(order.orderId, $event.target.value)"
                  >
                    <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
                  </select>
                </td>
                <td><button class="btn btn-danger" @click="deleteOrder(order.orderId)">🗑️</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <div class="card-header">📅 甘特圖（示意）</div>
        <div class="gantt-area">
          <div class="gantt-row" v-for="row in ganttData" :key="row.machine">
            <div class="gantt-label">{{ row.machine }}</div>
            <div class="gantt-track">
              <div
                v-for="block in row.blocks"
                :key="block.label"
                class="gantt-block"
                :class="block.type"
                :style="{ left: `${block.left}%`, width: `${block.width}%` }"
              >
                {{ block.label }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div v-if="showAddModal" class="modal-mask" @click.self="showAddModal = false">
        <div class="modal">
          <h3>新增工單</h3>
          <div class="form-grid">
            <input v-model.trim="newOrder.orderId" class="input" placeholder="工單號" />
            <input v-model.trim="newOrder.product" class="input" placeholder="產品名稱" />
            <input v-model.number="newOrder.quantity" type="number" min="1" class="input" placeholder="數量" />
            <select v-model="newOrder.machine" class="input">
              <option disabled value="">選擇機台</option>
              <option v-for="machine in machineOptions" :key="machine" :value="machine">{{ machine }}</option>
            </select>
            <input v-model="newOrder.startDate" type="date" class="input" />
          </div>
          <div class="modal-actions">
            <button class="btn" @click="showAddModal = false">取消</button>
            <button class="btn btn-primary" @click="addOrder">儲存</button>
          </div>
        </div>
      </div>
    </main>

    <NavDrawer />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavDrawer from '@/components/NavDrawer.vue'

const API_BASE = 'http://localhost:1880'
const router = useRouter()
const currentTime = ref('')
const orders = ref([])
const filterStatus = ref('')
const showAddModal = ref(false)
const apiStatus = ref('檢查中')
const apiStatusClass = ref('api-warn')
const operationError = ref('')
const statusOptions = ['待生產', '生產中', '完成']
const machineOptions = ['INJ-101', 'INJ-102', 'INJ-103', 'INJ-104', 'INJ-105', 'INJ-106']
const newOrder = ref({ orderId: '', product: '', quantity: null, machine: '', startDate: '' })

const ganttData = [
  { machine: 'INJ-101', blocks: [{ label: 'ORD-001', left: 0, width: 28, type: 'done' }, { label: 'ORD-008', left: 34, width: 30, type: 'running' }] },
  { machine: 'INJ-102', blocks: [{ label: 'ORD-003', left: 8, width: 24, type: 'done' }, { label: 'ORD-010', left: 40, width: 36, type: 'pending' }] },
  { machine: 'INJ-103', blocks: [{ label: 'ORD-006', left: 18, width: 38, type: 'running' }] },
]

let timer

const kpis = computed(() => {
  const total = orders.value.length
  const done = orders.value.filter((item) => item.status === '完成').length
  const running = orders.value.filter((item) => item.status === '生產中').length
  const pending = orders.value.filter((item) => item.status === '待生產').length
  return { total, done, running, pending }
})

const filteredOrders = computed(() => {
  if (!filterStatus.value) return orders.value
  return orders.value.filter((item) => item.status === filterStatus.value)
})

function updateTime() {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function fetchOrders() {
  try {
    const result = await request('/orders')
    orders.value = Array.isArray(result.data) ? result.data : []
    apiStatus.value = '正常'
    apiStatusClass.value = 'api-ok'
  } catch {
    orders.value = []
    apiStatus.value = '異常'
    apiStatusClass.value = 'api-error'
  }
}

async function addOrder() {
  operationError.value = ''
  if (!newOrder.value.orderId || !newOrder.value.product || !newOrder.value.quantity || !newOrder.value.machine || !newOrder.value.startDate) {
    operationError.value = '請完整填寫新增工單欄位'
    return
  }

  try {
    await request('/orders/add', {
      method: 'POST',
      body: JSON.stringify({ ...newOrder.value, status: '待生產' }),
    })

    showAddModal.value = false
    newOrder.value = { orderId: '', product: '', quantity: null, machine: '', startDate: '' }
    await fetchOrders()
  } catch {
    operationError.value = '新增工單失敗，請稍後再試'
  }
}

async function updateOrderStatus(orderId, status) {
  operationError.value = ''
  try {
    await request('/orders/update', {
      method: 'POST',
      body: JSON.stringify({ orderId, status }),
    })
    await fetchOrders()
  } catch {
    operationError.value = '更新工單狀態失敗'
  }
}

async function deleteOrder(orderId) {
  if (!window.confirm(`確定刪除 ${orderId}？`)) return
  operationError.value = ''
  try {
    await request('/orders/delete', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    })
    await fetchOrders()
  } catch {
    operationError.value = '刪除工單失敗'
  }
}

onMounted(async () => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  await fetchOrders()
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.dashboard-container { height: 100vh; overflow: hidden; background: #475569; display: flex; flex-direction: column; font-family: sans-serif; }
.header { flex-shrink: 0; background: #0f172a; color: #fff; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; gap: 1rem; align-items: center; }
.title { font-size: 1.2rem; font-weight: 700; }
.back-btn { background: #1e293b; color: #cbd5e1; border: 0; border-radius: 6px; padding: 0.4rem 0.8rem; cursor: pointer; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; }
.api-status { font-size: 0.82rem; margin-top: 0.2rem; }
.api-ok { color: #4ade80; }
.api-error { color: #f87171; }
.api-warn { color: #fbbf24; }
.main-content { flex: 1; min-height: 0; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.kpi-card { background: #fff; border-radius: 10px; padding: 1rem; }
.kpi-label { color: #64748b; font-size: 0.85rem; }
.kpi-value { font-size: 1.8rem; font-weight: 700; color: #0f172a; }
.error-message { margin: 0; color: #fee2e2; background: #7f1d1d; border-radius: 8px; padding: 0.55rem 0.75rem; }
.text-green { color: #16a34a; }
.text-blue { color: #2563eb; }
.text-yellow { color: #ca8a04; }
.card { background: #fff; border-radius: 10px; overflow: hidden; }
.card-header { background: #0f172a; color: #fff; padding: 0.7rem 1rem; display: flex; justify-content: space-between; align-items: center; }
.actions { display: flex; gap: 0.5rem; align-items: center; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
.input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.45rem 0.6rem; }
.small { min-width: 110px; }
.btn { border: none; border-radius: 6px; padding: 0.42rem 0.72rem; cursor: pointer; }
.btn-primary { background: #3b82f6; color: #fff; }
.btn-danger { background: #ef4444; color: #fff; }
.gantt-area { padding: 0.9rem; display: flex; flex-direction: column; gap: 0.7rem; }
.gantt-row { display: flex; gap: 0.6rem; align-items: center; }
.gantt-label { width: 70px; font-size: 0.8rem; color: #334155; }
.gantt-track { flex: 1; height: 30px; background: #e2e8f0; border-radius: 6px; position: relative; }
.gantt-block { position: absolute; top: 3px; height: 24px; border-radius: 4px; color: #fff; font-size: 0.72rem; display: flex; align-items: center; padding: 0 0.35rem; }
.gantt-block.done { background: #22c55e; }
.gantt-block.running { background: #3b82f6; }
.gantt-block.pending { background: #f59e0b; }
.modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: grid; place-items: center; }
.modal { background: #fff; border-radius: 10px; width: min(560px, 92vw); padding: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0.8rem 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
