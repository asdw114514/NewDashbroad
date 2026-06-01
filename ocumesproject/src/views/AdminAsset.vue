<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🛠️ 設備管理</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="api-status" :class="apiStatusClass">API：{{ apiStatus }}</div>
      </div>
    </header>

    <main class="main-content">
      <p v-if="operationError" class="error-message">{{ operationError }}</p>
      <section class="kpi-grid three">
        <div class="kpi-card"><div class="kpi-label">待維修</div><div class="kpi-value text-red">{{ kpis.pending }}</div></div>
        <div class="kpi-card"><div class="kpi-label">維修中</div><div class="kpi-value text-orange">{{ kpis.working }}</div></div>
        <div class="kpi-card"><div class="kpi-label">已完成</div><div class="kpi-value text-green">{{ kpis.done }}</div></div>
      </section>

      <section class="card">
        <div class="card-header">
          <span>📋 維修工單列表</span>
          <button class="btn btn-primary" @click="showAddModal = true">➕ 新增維修單</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>設備ID</th>
                <th>設備名稱</th>
                <th>通報日期</th>
                <th>問題描述</th>
                <th>狀態</th>
                <th>完修日期</th>
                <th>刪除</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in assets" :key="item.assetId">
                <td>{{ item.assetId }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.reportDate }}</td>
                <td>{{ item.issue }}</td>
                <td>
                  <select
                    class="input small"
                    :class="statusClass(item.status)"
                    :value="item.status"
                    @change="updateStatus(item, $event.target.value)"
                  >
                    <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
                  </select>
                </td>
                <td>{{ item.fixedDate || '-' }}</td>
                <td><button class="btn btn-danger" @click="deleteAsset(item.assetId)">🗑️</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="showAddModal" class="modal-mask" @click.self="showAddModal = false">
        <div class="modal">
          <h3>新增維修單</h3>
          <div class="form-grid">
            <input v-model.trim="newAsset.assetId" class="input" placeholder="設備ID" />
            <input v-model.trim="newAsset.name" class="input" placeholder="設備名稱" />
            <input v-model="newAsset.reportDate" type="date" class="input" />
            <input v-model.trim="newAsset.issue" class="input" placeholder="問題描述" />
          </div>
          <div class="modal-actions">
            <button class="btn" @click="showAddModal = false">取消</button>
            <button class="btn btn-primary" @click="addAsset">儲存</button>
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
const assets = ref([])
const showAddModal = ref(false)
const currentTime = ref('')
const apiStatus = ref('檢查中')
const apiStatusClass = ref('api-warn')
const operationError = ref('')
const statusOptions = ['待維修', '維修中', '已完成']
const newAsset = ref({ assetId: '', name: '', reportDate: '', issue: '' })

let timer

const kpis = computed(() => ({
  pending: assets.value.filter((item) => item.status === '待維修').length,
  working: assets.value.filter((item) => item.status === '維修中').length,
  done: assets.value.filter((item) => item.status === '已完成').length,
}))

function updateTime() {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

function statusClass(status) {
  if (status === '待維修') return 'text-red'
  if (status === '維修中') return 'text-orange'
  return 'text-green'
}

function today() {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function fetchAssets() {
  try {
    const result = await request('/assets')
    assets.value = Array.isArray(result.data) ? result.data : []
    apiStatus.value = '正常'
    apiStatusClass.value = 'api-ok'
  } catch {
    assets.value = []
    apiStatus.value = '異常'
    apiStatusClass.value = 'api-error'
  }
}

async function addAsset() {
  operationError.value = ''
  if (!newAsset.value.assetId || !newAsset.value.name || !newAsset.value.reportDate || !newAsset.value.issue) {
    operationError.value = '請完整填寫維修單欄位'
    return
  }

  try {
    await request('/assets/add', {
      method: 'POST',
      body: JSON.stringify({ ...newAsset.value, status: '待維修' }),
    })

    showAddModal.value = false
    newAsset.value = { assetId: '', name: '', reportDate: '', issue: '' }
    await fetchAssets()
  } catch {
    operationError.value = '新增維修單失敗'
  }
}

async function updateStatus(item, status) {
  const fixedDate = status === '已完成' ? today() : item.fixedDate || ''
  operationError.value = ''
  try {
    await request('/assets/update', {
      method: 'POST',
      body: JSON.stringify({ assetId: item.assetId, status, fixedDate }),
    })
    await fetchAssets()
  } catch {
    operationError.value = '更新維修狀態失敗'
  }
}

async function deleteAsset(assetId) {
  if (!window.confirm(`確定刪除 ${assetId}？`)) return
  operationError.value = ''
  try {
    await request('/assets/delete', {
      method: 'POST',
      body: JSON.stringify({ assetId }),
    })
    await fetchAssets()
  } catch {
    operationError.value = '刪除維修單失敗'
  }
}

onMounted(async () => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  await fetchAssets()
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
.kpi-grid { display: grid; gap: 1rem; }
.kpi-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.kpi-card { background: #fff; border-radius: 10px; padding: 1rem; }
.kpi-label { color: #64748b; font-size: 0.85rem; }
.kpi-value { font-size: 1.8rem; font-weight: 700; color: #0f172a; }
.error-message { margin: 0; color: #fee2e2; background: #7f1d1d; border-radius: 8px; padding: 0.55rem 0.75rem; }
.text-green { color: #16a34a; }
.text-orange { color: #ea580c; }
.text-red { color: #dc2626; }
.card { background: #fff; border-radius: 10px; overflow: hidden; }
.card-header { background: #0f172a; color: #fff; padding: 0.7rem 1rem; display: flex; justify-content: space-between; align-items: center; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
.input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.45rem 0.6rem; }
.small { min-width: 95px; }
.btn { border: none; border-radius: 6px; padding: 0.42rem 0.72rem; cursor: pointer; }
.btn-primary { background: #3b82f6; color: #fff; }
.btn-danger { background: #ef4444; color: #fff; }
.modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: grid; place-items: center; }
.modal { background: #fff; border-radius: 10px; width: min(560px, 92vw); padding: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0.8rem 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
