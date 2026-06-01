<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">📦 物料管理</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="api-status" :class="apiStatusClass">API：{{ apiStatus }}</div>
      </div>
    </header>

    <main class="main-content">
      <p v-if="operationError" class="error-message">{{ operationError }}</p>
      <section class="kpi-grid three">
        <div class="kpi-card"><div class="kpi-label">總物料種類</div><div class="kpi-value">{{ kpis.total }}</div></div>
        <div class="kpi-card"><div class="kpi-label">低庫存警示數</div><div class="kpi-value text-orange">{{ kpis.alert }}</div></div>
        <div class="kpi-card"><div class="kpi-label">庫存正常數</div><div class="kpi-value text-green">{{ kpis.normal }}</div></div>
      </section>

      <section class="card">
        <div class="card-header">
          <span>📋 物料列表</span>
          <button class="btn btn-primary" @click="showAddModal = true">➕ 新增物料</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>物料ID</th>
                <th>名稱</th>
                <th>單位</th>
                <th>目前庫存</th>
                <th>安全庫存</th>
                <th>庫存狀態</th>
                <th>庫存進度</th>
                <th>最後更新</th>
                <th>調整數量</th>
                <th>刪除</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in materials" :key="item.materialId">
                <td>{{ item.materialId }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.unit }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.minStock }}</td>
                <td :class="stockState(item).className">{{ stockState(item).label }}</td>
                <td>
                  <div class="progress-bg">
                    <div class="progress-fill" :style="{ width: `${stockRatio(item)}%` }" :class="stockState(item).className"></div>
                  </div>
                </td>
                <td>{{ item.updatedAt || '-' }}</td>
                <td><button class="btn btn-secondary" @click="openAdjust(item)">調整</button></td>
                <td><button class="btn btn-danger" @click="deleteMaterial(item.materialId)">🗑️</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="showAddModal" class="modal-mask" @click.self="showAddModal = false">
        <div class="modal">
          <h3>新增物料</h3>
          <div class="form-grid">
            <input v-model.trim="newMaterial.materialId" class="input" placeholder="物料ID" />
            <input v-model.trim="newMaterial.name" class="input" placeholder="名稱" />
            <input v-model.trim="newMaterial.unit" class="input" placeholder="單位" />
            <input v-model.number="newMaterial.quantity" type="number" min="0" class="input" placeholder="初始數量" />
            <input v-model.number="newMaterial.minStock" type="number" min="1" class="input" placeholder="安全庫存" />
          </div>
          <div class="modal-actions">
            <button class="btn" @click="showAddModal = false">取消</button>
            <button class="btn btn-primary" @click="addMaterial">儲存</button>
          </div>
        </div>
      </div>

      <div v-if="showAdjustModal" class="modal-mask" @click.self="showAdjustModal = false">
        <div class="modal">
          <h3>調整數量（{{ adjustForm.materialId }}）</h3>
          <input v-model.number="adjustForm.quantity" type="number" min="0" class="input full" placeholder="新數量" />
          <div class="modal-actions">
            <button class="btn" @click="showAdjustModal = false">取消</button>
            <button class="btn btn-primary" @click="adjustQuantity">更新</button>
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
const materials = ref([])
const showAddModal = ref(false)
const showAdjustModal = ref(false)
const currentTime = ref('')
const apiStatus = ref('檢查中')
const apiStatusClass = ref('api-warn')
const operationError = ref('')
const newMaterial = ref({ materialId: '', name: '', unit: '', quantity: null, minStock: null })
const adjustForm = ref({ materialId: '', quantity: null })

let timer

const kpis = computed(() => {
  const total = materials.value.length
  const alert = materials.value.filter((item) => Number(item.quantity) <= Number(item.minStock)).length
  const normal = total - alert
  return { total, alert, normal }
})

function updateTime() {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

function stockState(item) {
  const quantity = Number(item.quantity || 0)
  const minStock = Number(item.minStock || 0)
  if (quantity <= minStock * 0.5) return { label: '危險', className: 'text-red' }
  if (quantity <= minStock) return { label: '警示', className: 'text-orange' }
  return { label: '正常', className: 'text-green' }
}

function stockRatio(item) {
  const quantity = Number(item.quantity || 0)
  const max = Math.max(Number(item.minStock || 0) * 2, 1)
  return Math.min((quantity / max) * 100, 100)
}

function openAdjust(item) {
  adjustForm.value = { materialId: item.materialId, quantity: Number(item.quantity) }
  showAdjustModal.value = true
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function fetchMaterials() {
  try {
    const result = await request('/materials')
    materials.value = Array.isArray(result.data) ? result.data : []
    apiStatus.value = '正常'
    apiStatusClass.value = 'api-ok'
  } catch {
    materials.value = []
    apiStatus.value = '異常'
    apiStatusClass.value = 'api-error'
  }
}

async function addMaterial() {
  operationError.value = ''
  if (!newMaterial.value.materialId || !newMaterial.value.name || !newMaterial.value.unit || newMaterial.value.quantity === null || !newMaterial.value.minStock) {
    operationError.value = '請完整填寫物料欄位'
    return
  }
  if (Number(newMaterial.value.quantity) < 0 || Number(newMaterial.value.minStock) <= 0) {
    operationError.value = '初始數量需 ≥ 0，安全庫存需 > 0'
    return
  }

  try {
    await request('/materials/add', {
      method: 'POST',
      body: JSON.stringify(newMaterial.value),
    })

    showAddModal.value = false
    newMaterial.value = { materialId: '', name: '', unit: '', quantity: null, minStock: null }
    await fetchMaterials()
  } catch {
    operationError.value = '新增物料失敗'
  }
}

async function adjustQuantity() {
  operationError.value = ''
  if (!adjustForm.value.materialId || adjustForm.value.quantity === null || Number(adjustForm.value.quantity) < 0) {
    operationError.value = '調整數量需為 0 以上'
    return
  }
  try {
    await request('/materials/update', {
      method: 'POST',
      body: JSON.stringify(adjustForm.value),
    })
    showAdjustModal.value = false
    await fetchMaterials()
  } catch {
    operationError.value = '更新庫存失敗'
  }
}

async function deleteMaterial(materialId) {
  if (!window.confirm(`確定刪除 ${materialId}？`)) return
  operationError.value = ''
  try {
    await request('/materials/delete', {
      method: 'POST',
      body: JSON.stringify({ materialId }),
    })
    await fetchMaterials()
  } catch {
    operationError.value = '刪除物料失敗'
  }
}

onMounted(async () => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  await fetchMaterials()
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
.progress-bg { width: 130px; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; }
.input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.45rem 0.6rem; }
.full { width: 100%; margin: 0.8rem 0; }
.btn { border: none; border-radius: 6px; padding: 0.42rem 0.72rem; cursor: pointer; }
.btn-primary { background: #3b82f6; color: #fff; }
.btn-secondary { background: #64748b; color: #fff; }
.btn-danger { background: #ef4444; color: #fff; }
.modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: grid; place-items: center; }
.modal { background: #fff; border-radius: 10px; width: min(560px, 92vw); padding: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0.8rem 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
