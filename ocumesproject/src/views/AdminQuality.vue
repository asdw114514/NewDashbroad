<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-green">品質管理</span>
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
        <button class="add-btn" @click="showModal = true">➕ 新增品質紀錄</button>
      </div>

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">🔍</div>
          <div class="kpi-info">
            <div class="kpi-label">總批次數</div>
            <div class="kpi-value text-white">{{ records.length }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📦</div>
          <div class="kpi-info">
            <div class="kpi-label">總生產數</div>
            <div class="kpi-value text-white">{{ totalProduced }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <div class="kpi-label">總良品數</div>
            <div class="kpi-value text-green">{{ totalOk }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📈</div>
          <div class="kpi-info">
            <div class="kpi-label">平均良品率</div>
            <div class="kpi-value text-green">{{ avgOkRate }}%</div>
          </div>
        </div>
      </section>

      <div class="bottom-grid">

        <!-- 品質紀錄表 -->
        <section class="card">
          <div class="card-header">
            <span>📋 品質檢驗紀錄</span>
            <select class="filter-select" v-model="filterMachine">
              <option value="">全部機台</option>
              <option v-for="m in machines" :key="m" :value="m">{{ m }}</option>
            </select>
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
                <tr v-if="loading">
                  <td colspan="9" class="no-data">⏳ 載入中...</td>
                </tr>
                <tr v-else-if="filteredRecords.length === 0">
                  <td colspan="9" class="no-data">📭 尚無品質紀錄</td>
                </tr>
                <tr v-else v-for="rec in filteredRecords" :key="rec._id">
                  <td class="text-muted">{{ rec.date }}</td>
                  <td><span class="machine-tag">{{ rec.machine }}</span></td>
                  <td class="id-cell">{{ rec.batchId }}</td>
                  <td>{{ rec.total }}</td>
                  <td class="text-green fw-bold">{{ rec.ok }}</td>
                  <td class="text-red fw-bold">{{ rec.ng }}</td>
                  <td>
                    <span :class="getNgRateClass(rec.ngRate)">{{ rec.ngRate }}%</span>
                  </td>
                  <td class="text-muted">{{ rec.ngReason || '—' }}</td>
                  <td>
                    <button class="del-btn" @click="deleteRecord(rec.batchId)">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- NG分析 -->
        <section class="card">
          <div class="card-header">📊 NG原因分析</div>
          <div class="defect-list">
            <div v-if="ngAnalysis.length === 0" class="no-data-sm">✅ 尚無 NG 紀錄</div>
            <div class="defect-item" v-for="d in ngAnalysis" :key="d.reason">
              <div class="defect-top">
                <span class="defect-type">{{ d.reason }}</span>
                <span class="defect-count text-red">{{ d.count }} 件</span>
              </div>
              <div class="defect-bar-bg">
                <div class="defect-bar-fill" :style="{ width: (d.count / maxNg * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>

      <!-- 新增 Modal -->
      <Teleport to="body">
        <div class="quality-modal-overlay" v-if="showModal" @click.self="showModal = false">
          <div class="quality-modal">
            <div class="quality-modal-header">➕ 新增品質紀錄</div>
            <div class="quality-modal-body">
              <div class="quality-form-group">
                <label>日期</label>
                <input class="quality-form-input" type="date" v-model="form.date">
              </div>
              <div class="quality-form-group">
                <label>機台</label>
                <select class="quality-form-input" v-model="form.machine">
                  <option value="">請選擇機台</option>
                  <option v-for="m in machines" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
              <div class="quality-form-group">
                <label>批次號</label>
                <input class="quality-form-input" v-model="form.batchId" placeholder="例：BATCH-001">
              </div>
              <div class="quality-form-group">
                <label>總數</label>
                <input class="quality-form-input" type="number" v-model="form.total" placeholder="例：100">
              </div>
              <div class="quality-form-group">
                <label>良品數</label>
                <input class="quality-form-input" type="number" v-model="form.ok" placeholder="例：95">
              </div>
              <div class="quality-form-group">
                <label>NG原因（選填）</label>
                <input class="quality-form-input" v-model="form.ngReason" placeholder="例：尺寸偏差">
              </div>
            </div>
            <div class="quality-modal-footer">
              <button class="quality-btn quality-btn-outline" @click="showModal = false">取消</button>
              <button class="quality-btn quality-btn-primary" @click="addRecord">確認新增</button>
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
const records = ref([])
const filterMachine = ref('')
const showModal = ref(false)
const machines = ['INJ-101','INJ-102','INJ-103','INJ-104','INJ-105','INJ-106']
const form = ref({ date:'', machine:'', batchId:'', total:'', ok:'', ngReason:'' })

const filteredRecords = computed(() => {
  if (!filterMachine.value) return records.value
  return records.value.filter(r => r.machine === filterMachine.value)
})

const totalProduced = computed(() => records.value.reduce((s, r) => s + (r.total || 0), 0))
const totalOk       = computed(() => records.value.reduce((s, r) => s + (r.ok || 0), 0))
const avgOkRate     = computed(() => {
  if (!totalProduced.value) return '0.00'
  return ((totalOk.value / totalProduced.value) * 100).toFixed(2)
})

const ngAnalysis = computed(() => {
  const map = {}
  records.value.forEach(r => {
    if (r.ng > 0 && r.ngReason) {
      map[r.ngReason] = (map[r.ngReason] || 0) + r.ng
    }
  })
  return Object.entries(map).map(([reason, count]) => ({ reason, count })).sort((a,b) => b.count - a.count)
})
const maxNg = computed(() => Math.max(...ngAnalysis.value.map(d => d.count), 1))

const getNgRateClass = (rate) => rate >= 10 ? 'text-red fw-bold' : rate >= 5 ? 'text-orange fw-bold' : 'text-green'

const fetchRecords = async () => {
  try {
    const res = await fetch(`${API}/quality`)
    const data = await res.json()
    records.value = data.data || []
    apiConnected.value = true
  } catch {
    apiConnected.value = false
  } finally {
    loading.value = false
  }
}

const addRecord = async () => {
  if (!form.value.date || !form.value.machine || !form.value.batchId) return alert('請填寫必填欄位')
  await fetch(`${API}/quality/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form.value)
  })
  showModal.value = false
  form.value = { date:'', machine:'', batchId:'', total:'', ok:'', ngReason:'' }
  fetchRecords()
}

const deleteRecord = async (batchId) => {
  if (!confirm(`確定刪除批次 ${batchId}？`)) return
  await fetch(`${API}/quality/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchId })
  })
  fetchRecords()
}

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000); fetchRecords() })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-green { background-color: #22c55e; }
.back-btn { background: #1e293b; color: #94a3b8; border: none; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.back-btn:hover { background: #334155; color: white; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; overflow-y: auto; min-height: 0; }
.api-bar { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 0.5rem; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: bold; flex-shrink: 0; }
.api-ok { color: #16a34a; }
.api-err { color: #dc2626; }
.add-btn { background: #22c55e; color: white; border: none; padding: 0.45rem 1rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
.add-btn:hover { background: #16a34a; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; flex-shrink: 0; }
.kpi-card { background-color: #1e293b; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.kpi-icon { font-size: 2rem; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
.kpi-value { font-size: 2rem; font-weight: bold; }
.bottom-grid { display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.filter-select { background: #334155; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.7rem 0.85rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.78rem; }
.data-table td { padding: 0.65rem 0.85rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; font-size: 0.78rem; }
.machine-tag { background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; font-family: monospace; }
.del-btn { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.del-btn:hover { background: #fca5a5; }
.no-data { text-align: center; padding: 2rem; color: #94a3b8; }
.no-data-sm { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.9rem; }
.defect-list { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
.defect-item { display: flex; flex-direction: column; gap: 0.3rem; }
.defect-top { display: flex; justify-content: space-between; }
.defect-type { font-size: 0.88rem; font-weight: bold; color: #1e293b; }
.defect-count { font-size: 0.85rem; font-weight: bold; }
.defect-bar-bg { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.defect-bar-fill { height: 100%; background: #ef4444; border-radius: 999px; }
</style>
<style>
.quality-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.quality-modal { background: white !important; border-radius: 0.75rem; width: 420px; max-width: 90vw; box-shadow: 0 20px 40px rgba(0,0,0,0.3); overflow: hidden; }
.quality-modal-header { background: #1e293b !important; color: white !important; padding: 1rem 1.5rem; font-weight: bold; font-size: 1rem; }
.quality-modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; background: white; }
.quality-modal-footer { padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; background: white; }
.quality-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.quality-form-group label { font-size: 0.8rem; font-weight: bold; color: #475569; }
.quality-form-input { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1 !important; border-radius: 6px; font-size: 0.88rem; outline: none; background: white !important; color: #1e293b !important; width: 100%; box-sizing: border-box; }
.quality-form-input:focus { border-color: #22c55e !important; }
.quality-btn { padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.88rem; border: none; }
.quality-btn-primary { background: #22c55e !important; color: white !important; }
.quality-btn-primary:hover { background: #16a34a !important; }
.quality-btn-outline { background: white !important; border: 1px solid #cbd5e1 !important; color: #475569 !important; }
.quality-btn-outline:hover { background: #f1f5f9 !important; }
</style>