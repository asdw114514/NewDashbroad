<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🧪 品質管理</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="api-status" :class="apiStatusClass">API：{{ apiStatus }}</div>
      </div>
    </header>

    <main class="main-content">
      <p v-if="operationError" class="error-message">{{ operationError }}</p>
      <section class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">總批次數</div><div class="kpi-value">{{ kpis.batches }}</div></div>
        <div class="kpi-card"><div class="kpi-label">總生產數</div><div class="kpi-value">{{ kpis.total }}</div></div>
        <div class="kpi-card"><div class="kpi-label">總良品數</div><div class="kpi-value text-green">{{ kpis.ok }}</div></div>
        <div class="kpi-card"><div class="kpi-label">平均良品率</div><div class="kpi-value text-blue">{{ kpis.okRate }}%</div></div>
      </section>

      <section class="card">
        <div class="card-header">
          <span>📋 品質紀錄</span>
          <button class="btn btn-primary" @click="showAddModal = true">➕ 新增品質紀錄</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>機台</th>
                <th>批次號</th>
                <th>總數</th>
                <th>良品</th>
                <th>NG數</th>
                <th>NG率</th>
                <th>NG原因</th>
                <th>刪除</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in qualityRecords" :key="item.batchId">
                <td>{{ item.date }}</td>
                <td>{{ item.machine }}</td>
                <td>{{ item.batchId }}</td>
                <td>{{ item.total }}</td>
                <td>{{ item.ok }}</td>
                <td>{{ item.ng }}</td>
                <td :class="ngRateClass(item.ngRate)">{{ Number(item.ngRate || 0).toFixed(1) }}%</td>
                <td>{{ item.ngReason || '-' }}</td>
                <td><button class="btn btn-danger" @click="deleteRecord(item.batchId)">🗑️</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="showAddModal" class="modal-mask" @click.self="showAddModal = false">
        <div class="modal">
          <h3>新增品質紀錄</h3>
          <div class="form-grid">
            <input v-model="newRecord.date" type="date" class="input" />
            <select v-model="newRecord.machine" class="input">
              <option disabled value="">選擇機台</option>
              <option v-for="machine in machineOptions" :key="machine" :value="machine">{{ machine }}</option>
            </select>
            <input v-model.trim="newRecord.batchId" class="input" placeholder="批次號" />
            <input v-model.number="newRecord.total" type="number" min="1" class="input" placeholder="總數" />
            <input v-model.number="newRecord.ok" type="number" min="0" class="input" placeholder="良品數" />
            <input v-model.trim="newRecord.ngReason" class="input" placeholder="NG原因（可選）" />
          </div>
          <div class="modal-actions">
            <button class="btn" @click="showAddModal = false">取消</button>
            <button class="btn btn-primary" @click="addRecord">儲存</button>
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
const qualityRecords = ref([])
const showAddModal = ref(false)
const currentTime = ref('')
const apiStatus = ref('檢查中')
const apiStatusClass = ref('api-warn')
const operationError = ref('')
const machineOptions = ['INJ-101', 'INJ-102', 'INJ-103', 'INJ-104', 'INJ-105', 'INJ-106']
const newRecord = ref({ date: '', machine: '', batchId: '', total: null, ok: null, ngReason: '' })

let timer

const kpis = computed(() => {
  const batches = qualityRecords.value.length
  const total = qualityRecords.value.reduce((sum, item) => sum + Number(item.total || 0), 0)
  const ok = qualityRecords.value.reduce((sum, item) => sum + Number(item.ok || 0), 0)
  const okRate = total > 0 ? ((ok / total) * 100).toFixed(1) : '0.0'
  return { batches, total, ok, okRate }
})

function updateTime() {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

function ngRateClass(rate) {
  const value = Number(rate || 0)
  if (value >= 10) return 'text-red'
  if (value >= 5) return 'text-orange'
  return 'text-green'
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function fetchQuality() {
  try {
    const result = await request('/quality')
    qualityRecords.value = Array.isArray(result.data) ? result.data : []
    apiStatus.value = '正常'
    apiStatusClass.value = 'api-ok'
  } catch {
    qualityRecords.value = []
    apiStatus.value = '異常'
    apiStatusClass.value = 'api-error'
  }
}

async function addRecord() {
  operationError.value = ''
  if (!newRecord.value.date || !newRecord.value.machine || !newRecord.value.batchId || newRecord.value.total === null || Number(newRecord.value.total) <= 0 || newRecord.value.ok === null) {
    operationError.value = '請完整填寫品質紀錄欄位'
    return
  }
  if (Number(newRecord.value.ok) > Number(newRecord.value.total) || Number(newRecord.value.ok) < 0) {
    operationError.value = '良品數需介於 0 到總數之間'
    return
  }

  try {
    await request('/quality/add', {
      method: 'POST',
      body: JSON.stringify(newRecord.value),
    })

    showAddModal.value = false
    newRecord.value = { date: '', machine: '', batchId: '', total: null, ok: null, ngReason: '' }
    await fetchQuality()
  } catch {
    operationError.value = '新增品質紀錄失敗'
  }
}

async function deleteRecord(batchId) {
  if (!window.confirm(`確定刪除 ${batchId}？`)) return
  operationError.value = ''
  try {
    await request('/quality/delete', {
      method: 'POST',
      body: JSON.stringify({ batchId }),
    })
    await fetchQuality()
  } catch {
    operationError.value = '刪除品質紀錄失敗'
  }
}

onMounted(async () => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  await fetchQuality()
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
.text-orange { color: #ea580c; }
.text-red { color: #dc2626; }
.card { background: #fff; border-radius: 10px; overflow: hidden; }
.card-header { background: #0f172a; color: #fff; padding: 0.7rem 1rem; display: flex; justify-content: space-between; align-items: center; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
.input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.45rem 0.6rem; }
.btn { border: none; border-radius: 6px; padding: 0.42rem 0.72rem; cursor: pointer; }
.btn-primary { background: #3b82f6; color: #fff; }
.btn-danger { background: #ef4444; color: #fff; }
.modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: grid; place-items: center; }
.modal { background: #fff; border-radius: 10px; width: min(560px, 92vw); padding: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0.8rem 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
