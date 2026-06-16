<template>
  <div class="dashboard-container">
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

      <!-- API 狀態 -->
      <div class="api-bar">
        <span :class="apiConnected ? 'api-ok' : 'api-err'">
          {{ apiConnected ? '🟢 API 連線正常' : '🔴 API 連線失敗' }}
        </span>
        <button class="add-btn" @click="showModal = true">➕ 新增維修單</button>
      </div>

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-info">
            <div class="kpi-label">待維修</div>
            <div class="kpi-value text-red">{{ assets.filter(a=>a.status==='待維修').length }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🔧</div>
          <div class="kpi-info">
            <div class="kpi-label">維修中</div>
            <div class="kpi-value text-yellow">{{ assets.filter(a=>a.status==='維修中').length }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <div class="kpi-label">已完成</div>
            <div class="kpi-value text-green">{{ assets.filter(a=>a.status==='已完成').length }}</div>
          </div>
        </div>
      </section>

      <!-- 維修工單列表 -->
      <section class="card">
        <div class="card-header">
          <span>🔧 維修工單列表</span>
          <select class="filter-select" v-model="filterStatus">
            <option value="">全部</option>
            <option value="待維修">待維修</option>
            <option value="維修中">維修中</option>
            <option value="已完成">已完成</option>
          </select>
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
              <tr v-if="loading">
                <td colspan="7" class="no-data">⏳ 載入中...</td>
              </tr>
              <tr v-else-if="filteredAssets.length === 0">
                <td colspan="7" class="no-data">📭 尚無維修紀錄</td>
              </tr>
              <tr v-else v-for="asset in filteredAssets" :key="asset._id">
                <td class="id-cell">{{ asset.assetId }}</td>
                <td>{{ asset.name }}</td>
                <td class="text-muted">{{ asset.reportDate }}</td>
                <td class="issue-cell">{{ asset.issue }}</td>
                <td>
                  <select class="status-select" :class="getStatusSelectClass(asset.status)" :value="asset.status" @change="updateStatus(asset, $event.target.value)">
                    <option value="待維修">待維修</option>
                    <option value="維修中">維修中</option>
                    <option value="已完成">已完成</option>
                  </select>
                </td>
                <td class="text-muted">{{ asset.fixedDate || '—' }}</td>
                <td>
                  <button class="del-btn" @click="deleteAsset(asset)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- 新增 Modal -->
      <Teleport to="body">
        <div class="asset-modal-overlay" v-if="showModal" @click.self="showModal = false">
          <div class="asset-modal">
            <div class="asset-modal-header">➕ 新增維修單</div>
            <div class="asset-modal-body">
              <div class="asset-form-group">
                <label>設備ID</label>
                <input 
                  class="asset-form-input" 
                  v-model="form.assetId" 
                  placeholder="例：AST-001"
                >
                <!-- 找到設備時顯示提示 -->
                <span 
                  v-if="form.assetName" 
                  style="font-size:0.78rem; color:#22c55e; margin-top:3px;">
                  ✅ {{ form.assetName }}
                </span>
                <!-- 有輸入但找不到時顯示警告 -->
                <span 
                  v-else-if="form.assetId" 
                  style="font-size:0.78rem; color:#ef4444; margin-top:3px;">
                  ❌ 找不到此設備ID
                </span>
              </div>

              <div class="asset-form-group">
                <label>設備名稱</label>
                <input 
                  class="asset-form-input asset-form-input-disabled" 
                  v-model="form.assetName" 
                  placeholder="輸入設備ID後自動帶入"
                  readonly
                  >
              </div>
              <div class="asset-form-group">
                <label>通報日期</label>
                <input class="asset-form-input" type="date" v-model="form.reportDate">
              </div>
              <div class="asset-form-group">
                <label>問題描述</label>
                <input class="asset-form-input" v-model="form.issue" placeholder="例：油壓異常">
              </div>
            </div>
            <div class="asset-modal-footer">
              <button class="asset-btn asset-btn-outline" @click="showModal = false">取消</button>
              <button class="asset-btn asset-btn-primary" @click="addAsset">確認新增</button>
            </div>
          </div>
        </div>
      </Teleport>
    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'  // ✅ 加 watch
import { useRouter } from 'vue-router'
import NavDrawer from '@/components/NavDrawer.vue'

const router = useRouter()
const API = 'http://localhost:1880'
const currentTime = ref('')
let timer = null
const machines = ref([])

const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

const apiConnected = ref(false)
const loading = ref(true)
const assets = ref([])
const filterStatus = ref('')
const showModal = ref(false)
const form = ref({ assetId:'', assetName:'', reportDate:'', issue:'' })  // ✅ assetName

const filteredAssets = computed(() => {
  if (!filterStatus.value) return assets.value
  return assets.value.filter(a => a.status === filterStatus.value)
})

const getStatusSelectClass = (status) => {
  if (status === '待維修') return 'select-red'
  if (status === '維修中') return 'select-orange'
  return 'select-green'
}

const fetchAssets = async () => {
  try {
    const res = await fetch(`${API}/assets`)
    const data = await res.json()
    assets.value = data.data || []
    console.log('assets:', assets.value)
    apiConnected.value = true
  } catch {
    apiConnected.value = false
  } finally {
    loading.value = false
  }
}

const addAsset = async () => {
  if (!form.value.assetId || !form.value.assetName || !form.value.reportDate)
    return alert('請填寫必填欄位')

  await fetch(`${API}/assets/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId:   Date.now().toString(),  // ← 新增這個
      assetId:    form.value.assetId,
      name:       form.value.assetName,
      reportDate: form.value.reportDate,
      issue:      form.value.issue,
      status:     '待維修'
    })
  })
  showModal.value = false
  form.value = { assetId:'', assetName:'', reportDate:'', issue:'', autoFilled: false }
  fetchAssets()
}

const updateStatus = async (asset, status) => {
  const fixedDate = status === '已完成' ? new Date().toISOString().split('T')[0] : asset.fixedDate || ''
  await fetch(`${API}/assets/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetId: asset.assetId, status, fixedDate })
  })
  fetchAssets()
}

const deleteAsset = async (asset) => {
  if (!confirm(`確定刪除設備 ${asset.assetId} 的維修單？`)) return
  
  // 沒有 reportId 就阻止刪除
  if (!asset.reportId) {
    alert('此筆舊資料請先刪除後重新新增')
    return
  }

  await fetch(`${API}/assets/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId: asset.reportId })
  })
  fetchAssets()
}

const fetchMachines = async () => {
  try {
    const res = await fetch(`${API}/machines`)
    const data = await res.json()
    machines.value = data.data || []
  } catch {
    console.error('機台資料載入失敗')
  }
}

// ✅ watch 監聽 assetId 自動帶入設備名稱
watch(() => form.value.assetId, (val) => {
  const found = machines.value.find(m => m.assetId === val)  // ← 改查 machines
  if (found) {
    form.value.assetName = found.name
    form.value.autoFilled = true
  } else {
    form.value.assetName = ''
    form.value.autoFilled = false
  }
})

// ✅ 只保留一個 onMounted
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  fetchAssets()
  fetchMachines()
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-orange { background-color: #f97316; }
.back-btn { background: #1e293b; color: #94a3b8; border: none; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.back-btn:hover { background: #334155; color: white; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; overflow-y: auto; min-height: 0; }
.api-bar { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: bold; flex-shrink: 0; }
.api-ok { color: #16a34a; }
.api-err { color: #dc2626; }
.add-btn { background: #f97316; color: white; border: none; padding: 0.45rem 1rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
.add-btn:hover { background: #ea580c; }
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; flex-shrink: 0; }
.kpi-card { background-color: #1e293b; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.kpi-icon { font-size: 2rem; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
.kpi-value { font-size: 2rem; font-weight: bold; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.filter-select { background: #334155; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.75rem 1rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.8rem; }
.data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; }
.issue-cell { max-width: 200px; color: #475569; font-size: 0.85rem; }
.text-muted { color: #64748b; font-size: 0.85rem; }
.status-select { border: 2px solid; border-radius: 6px; padding: 0.3rem 0.5rem; font-size: 0.82rem; font-weight: bold; outline: none; cursor: pointer; background: white; }
.select-red    { border-color: #ef4444; color: #dc2626; }
.select-orange { border-color: #f97316; color: #ea580c; }
.select-green  { border-color: #22c55e; color: #16a34a; }
.del-btn { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.del-btn:hover { background: #fca5a5; }
.no-data { text-align: center; padding: 2rem; color: #94a3b8; }
/* Modal */
</style>
<style>
.asset-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.asset-modal {
  background: white !important;
  border-radius: 0.75rem;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}
.asset-modal-header {
  background: #1e293b !important;
  color: white !important;
  padding: 1rem 1.5rem;
  font-weight: bold;
  font-size: 1rem;
}
.asset-modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: white;
}
.asset-modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
  background: white;
}
.asset-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.asset-form-group label {
  font-size: 0.8rem;
  font-weight: bold;
  color: #475569;
}
.asset-form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1 !important;
  border-radius: 6px;
  font-size: 0.88rem;
  outline: none;
  background: white !important;
  color: #1e293b !important;
  width: 100%;
  box-sizing: border-box;
}
.asset-form-input:focus {
  border-color: #f97316 !important;
}
.asset-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.88rem;
  border: none;
}
.asset-btn-primary {
  background: #f97316 !important;
  color: white !important;
}
.asset-btn-primary:hover {
  background: #ea580c !important;
}
.asset-btn-outline {
  background: white !important;
  border: 1px solid #cbd5e1 !important;
  color: #475569 !important;
}
.asset-btn-outline:hover {
  background: #f1f5f9 !important;
}
.asset-form-input-disabled {
  background: #f1f5f9 !important;
  color: #64748b !important;
  cursor: not-allowed;
}
</style>