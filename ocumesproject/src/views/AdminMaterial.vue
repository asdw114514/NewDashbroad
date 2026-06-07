<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-purple">物料管理</span>
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
        <button class="add-btn" @click="showAddModal = true">➕ 新增物料</button>
      </div>

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">📦</div>
          <div class="kpi-info">
            <div class="kpi-label">總物料種類</div>
            <div class="kpi-value text-white">{{ materials.length }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-info">
            <div class="kpi-label">低庫存警示</div>
            <div class="kpi-value text-red">{{ lowStockCount }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <div class="kpi-label">庫存正常</div>
            <div class="kpi-value text-green">{{ materials.length - lowStockCount }}</div>
          </div>
        </div>
      </section>

      <!-- 物料列表 -->
      <section class="card">
        <div class="card-header">
          <span>📦 物料庫存狀況</span>
          <input class="search-input" v-model="searchText" placeholder="搜尋物料...">
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
                <th>庫存量</th>
                <th>最後更新</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="9" class="no-data">⏳ 載入中...</td>
              </tr>
              <tr v-else-if="filteredMaterials.length === 0">
                <td colspan="9" class="no-data">📭 尚無物料資料</td>
              </tr>
              <tr v-else v-for="mat in filteredMaterials" :key="mat._id">
                <td class="id-cell">{{ mat.materialId }}</td>
                <td class="fw-bold">{{ mat.name }}</td>
                <td class="text-muted">{{ mat.unit }}</td>
                <td :class="getQtyClass(mat.quantity, mat.minStock)">{{ mat.quantity.toLocaleString() }}</td>
                <td class="text-muted">{{ mat.minStock.toLocaleString() }}</td>
                <td>
                  <span class="status-badge" :class="getStockBadgeClass(mat.quantity, mat.minStock)">
                    {{ getStockLabel(mat.quantity, mat.minStock) }}
                  </span>
                </td>
                <td class="progress-cell">
                  <div class="progress-bg">
                    <div class="progress-fill" :class="getProgressClass(mat.quantity, mat.minStock)" :style="{ width: getProgressWidth(mat.quantity, mat.minStock) + '%' }"></div>
                  </div>
                </td>
                <td class="text-muted">{{ mat.updatedAt ? mat.updatedAt.split('T')[0] : '—' }}</td>
                <td class="action-cell">
                  <button class="edit-btn" @click="openAdjust(mat)">調整</button>
                  <button class="del-btn" @click="deleteMaterial(mat.materialId)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- 新增物料 Modal -->
    <Teleport to="body">
      <div class="material-modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
        <div class="material-modal">
          <div class="material-modal-header">➕ 新增物料</div>
          <div class="material-modal-body">
            <div class="material-form-group">
              <label>物料ID</label>
              <input class="material-form-input" v-model="addForm.materialId" placeholder="例：MAT-001">
            </div>
            <div class="material-form-group">
              <label>名稱</label>
              <input class="material-form-input" v-model="addForm.name" placeholder="例：ABS 塑料">
            </div>
            <div class="material-form-group">
              <label>單位</label>
              <input class="material-form-input" v-model="addForm.unit" placeholder="例：kg">
            </div>
            <div class="material-form-group">
              <label>初始數量</label>
              <input class="material-form-input" type="number" v-model="addForm.quantity" placeholder="例：1000">
            </div>
            <div class="material-form-group">
              <label>安全庫存量</label>
              <input class="material-form-input" type="number" v-model="addForm.minStock" placeholder="例：200">
            </div>
          </div>
          <div class="material-modal-footer">
            <button class="material-btn material-btn-outline" @click="showAddModal = false">取消</button>
            <button class="material-btn material-btn-primary" @click="addMaterial">確認新增</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 調整數量 Modal -->
    <Teleport to="body">
      <div class="material-modal-overlay" v-if="showAdjustModal" @click.self="showAdjustModal = false">
        <div class="material-modal">
          <div class="material-modal-header">🔄 調整庫存數量</div>
          <div class="material-modal-body">
            <p class="material-adjust-info">物料：<strong>{{ adjustTarget?.name }}</strong>（{{ adjustTarget?.materialId }}）</p>
            <p class="material-adjust-info">目前數量：<strong>{{ adjustTarget?.quantity }} {{ adjustTarget?.unit }}</strong></p>
            <div class="material-form-group">
              <label>新數量</label>
              <input class="material-form-input" type="number" v-model="newQuantity" placeholder="輸入新數量">
            </div>
          </div>
          <div class="material-modal-footer">
            <button class="material-btn material-btn-outline" @click="showAdjustModal = false">取消</button>
            <button class="material-btn material-btn-primary" @click="adjustQuantity">確認調整</button>
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
const materials = ref([])
const searchText = ref('')
const showAddModal = ref(false)
const showAdjustModal = ref(false)
const adjustTarget = ref(null)
const newQuantity = ref('')
const addForm = ref({ materialId:'', name:'', unit:'', quantity:'', minStock:'' })

const filteredMaterials = computed(() => {
  if (!searchText.value) return materials.value
  return materials.value.filter(m => m.materialId.includes(searchText.value) || m.name.includes(searchText.value))
})

const lowStockCount = computed(() => materials.value.filter(m => m.quantity <= m.minStock).length)

const getQtyClass      = (q, min) => q <= min * 0.5 ? 'text-red fw-bold' : q <= min ? 'text-orange fw-bold' : 'text-dark fw-bold'
const getStockBadgeClass = (q, min) => q <= min * 0.5 ? 'status-critical' : q <= min ? 'status-low' : 'status-ok'
const getStockLabel    = (q, min) => q <= min * 0.5 ? '🔴 危險' : q <= min ? '🟡 警示' : '🟢 正常'
const getProgressClass = (q, min) => q <= min * 0.5 ? 'bar-red' : q <= min ? 'bar-orange' : 'bar-green'
const getProgressWidth = (q, min) => Math.min((q / (min * 2)) * 100, 100)

const fetchMaterials = async () => {
  try {
    const res = await fetch(`${API}/materials`)
    const data = await res.json()
    materials.value = data.data || []
    apiConnected.value = true
  } catch {
    apiConnected.value = false
  } finally {
    loading.value = false
  }
}

const addMaterial = async () => {
  if (!addForm.value.materialId || !addForm.value.name) return alert('請填寫必填欄位')
  await fetch(`${API}/materials/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(addForm.value)
  })
  showAddModal.value = false
  addForm.value = { materialId:'', name:'', unit:'', quantity:'', minStock:'' }
  fetchMaterials()
}

const openAdjust = (mat) => {
  adjustTarget.value = mat
  newQuantity.value = mat.quantity
  showAdjustModal.value = true
}

const adjustQuantity = async () => {
  await fetch(`${API}/materials/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialId: adjustTarget.value.materialId, quantity: newQuantity.value })
  })
  showAdjustModal.value = false
  fetchMaterials()
}

const deleteMaterial = async (materialId) => {
  if (!confirm(`確定刪除物料 ${materialId}？`)) return
  await fetch(`${API}/materials/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialId })
  })
  fetchMaterials()
}

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000); fetchMaterials() })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-purple { background-color: #a855f7; }
.back-btn { background: #1e293b; color: #94a3b8; border: none; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.back-btn:hover { background: #334155; color: white; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; overflow-y: auto; min-height: 0; }
.api-bar { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: bold; flex-shrink: 0; }
.api-ok { color: #16a34a; }
.api-err { color: #dc2626; }
.add-btn { background: #a855f7; color: white; border: none; padding: 0.45rem 1rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
.add-btn:hover { background: #9333ea; }
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; flex-shrink: 0; }
.kpi-card { background-color: #1e293b; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.kpi-icon { font-size: 2rem; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
.kpi-value { font-size: 2rem; font-weight: bold; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.search-input { background: #334155; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; outline: none; }
.search-input::placeholder { color: #64748b; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.75rem 1rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.8rem; }
.data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; }
.status-badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: bold; }
.status-ok       { background: #dcfce7; color: #16a34a; }
.status-low      { background: #fef9c3; color: #ca8a04; }
.status-critical { background: #fee2e2; color: #dc2626; }
.progress-cell { min-width: 100px; }
.progress-bg { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; width: 100px; }
.progress-fill { height: 100%; border-radius: 999px; transition: width 0.5s; }
.bar-green  { background: #22c55e; }
.bar-orange { background: #f97316; }
.bar-red    { background: #ef4444; }
.action-cell { display: flex; gap: 0.5rem; }
.edit-btn { background: #dbeafe; color: #1d4ed8; border: none; padding: 0.3rem 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; }
.edit-btn:hover { background: #bfdbfe; }
.del-btn { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.del-btn:hover { background: #fca5a5; }
.no-data { text-align: center; padding: 2rem; color: #94a3b8; }
.adjust-info { font-size: 0.9rem; color: #475569; margin: 0; }
</style>
<style>
.material-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.material-modal { background: white !important; border-radius: 0.75rem; width: 420px; max-width: 90vw; box-shadow: 0 20px 40px rgba(0,0,0,0.3); overflow: hidden; }
.material-modal-header { background: #1e293b !important; color: white !important; padding: 1rem 1.5rem; font-weight: bold; font-size: 1rem; }
.material-modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; background: white; }
.material-modal-footer { padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; background: white; }
.material-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.material-form-group label { font-size: 0.8rem; font-weight: bold; color: #475569; }
.material-form-input { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1 !important; border-radius: 6px; font-size: 0.88rem; outline: none; background: white !important; color: #1e293b !important; width: 100%; box-sizing: border-box; }
.material-form-input:focus { border-color: #a855f7 !important; }
.material-adjust-info { font-size: 0.9rem; color: #475569; margin: 0; }
.material-btn { padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.88rem; border: none; }
.material-btn-primary { background: #a855f7 !important; color: white !important; }
.material-btn-primary:hover { background: #9333ea !important; }
.material-btn-outline { background: white !important; border: 1px solid #cbd5e1 !important; color: #475569 !important; }
.material-btn-outline:hover { background: #f1f5f9 !important; }
</style>