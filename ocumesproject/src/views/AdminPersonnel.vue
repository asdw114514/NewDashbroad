<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-indigo">人員管理</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">系統管理員：王大明</div>
      </div>
    </header>

    <main class="main-content">

      <!-- Tab 切換 -->
      <div class="tab-group">
        <button :class="['tab-btn', { active: activeTab === 'employees' }]" @click="activeTab = 'employees'">
          👥 員工名單
        </button>
        <button :class="['tab-btn', { active: activeTab === 'shift' }]" @click="activeTab = 'shift'">
          📅 班次派工
        </button>
      </div>

      <!-- ── Tab 1：員工名單 ── -->
      <div v-if="activeTab === 'employees'" class="tab-content">

        <!-- 新增員工表單 -->
        <div class="card">
          <div class="card-header dark">➕ 新增員工</div>
          <div class="add-form">
            <div class="form-group">
              <label>員工工號</label>
              <input class="form-input" v-model="newEmp.empId" placeholder="EMP-XXXX">
            </div>
            <div class="form-group">
              <label>姓名</label>
              <input class="form-input" v-model="newEmp.name" placeholder="輸入姓名">
            </div>
            <div class="form-group">
              <label>熟練度</label>
              <div class="star-group">
                <span v-for="n in 5" :key="n" class="star"
                  :class="n <= newEmp.skill ? 'star-on' : 'star-off'"
                  @click="newEmp.skill = n">★</span>
              </div>
            </div>
            <div class="form-group form-action">
              <button class="btn btn-primary" @click="addEmployee" :disabled="addingEmp">
                {{ addingEmp ? '⏳ 新增中...' : '➕ 新增' }}
              </button>
            </div>
          </div>
          <div v-if="empStatusMsg" class="status-msg" :class="empStatusClass">{{ empStatusMsg }}</div>
        </div>

        <!-- 員工清單表格 -->
        <div class="card table-card">
          <div class="card-header dark flex-between">
            <span>員工名單</span>
            <span class="result-count">共 {{ employees.length }} 人</span>
          </div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>工號</th>
                  <th>姓名</th>
                  <th>熟練度</th>
                  <th>建立時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="employees.length === 0">
                  <td colspan="5" class="no-data">尚無員工資料</td>
                </tr>
                <tr v-for="e in employees" :key="e.empId">
                  <td><span class="emp-tag">{{ e.empId }}</span></td>
                  <td class="fw-bold">{{ e.name }}</td>
                  <td>
                    <span class="stars">{{ '★'.repeat(e.skill) }}{{ '☆'.repeat(5 - e.skill) }}</span>
                  </td>
                  <td class="text-gray font-mono">{{ e.createdAt?.split('T')[0] || '--' }}</td>
                  <td>
                    <button class="btn-delete" @click="deleteEmployee(e.empId)">🗑 刪除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── Tab 2：班次派工 ── -->
      <div v-if="activeTab === 'shift'" class="tab-content">

        <!-- 班次基本資訊 -->
        <div class="card">
          <div class="card-header dark">📅 班次基本資訊</div>
          <div class="top-body">
            <div class="form-group">
              <label>日期</label>
              <input type="date" class="form-input" v-model="form.date">
            </div>
            <div class="form-group">
              <label>班次</label>
              <select class="form-input" v-model="form.shift">
                <option>早班</option>
                <option>中班</option>
                <option>晚班</option>
              </select>
            </div>
            <div class="form-group">
              <label>總人數</label>
              <input type="number" class="form-input" v-model.number="form.totalCount" min="0">
            </div>
            <div class="form-group">
              <label>實際出勤</label>
              <input type="number" class="form-input" v-model.number="form.presentCount" min="0">
            </div>
            <div class="form-group">
              <label>請假人數</label>
              <input type="number" class="form-input" v-model.number="form.leaveCount" min="0">
            </div>
            <div class="form-group">
              <label>跨線支援</label>
              <input type="number" class="form-input" v-model.number="form.supportCount" min="0">
            </div>
          </div>
        </div>

        <!-- 工位派工表格 -->
        <div class="card table-card">
          <div class="card-header dark flex-between">
            <span>👷 工位派工設定</span>
            <span class="result-count">共 {{ form.stations.length }} 個工位</span>
          </div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>工位 ID</th>
                  <th>工位名稱</th>
                  <th>派駐員工</th>
                  <th>熟練度</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in form.stations" :key="s.id">
                  <td><span class="emp-tag">{{ s.id }}</span></td>
                  <td class="fw-bold text-dark">{{ s.name }}</td>
                  <td>
                    <select class="table-select" v-model="s.empId" @change="fillOperator(s)">
                      <option value="">-- 無人 --</option>
                      <option v-for="e in employees" :key="e.empId" :value="e.empId">
                        {{ e.empId }} - {{ e.name }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <span class="stars">
                      {{ s.skill > 0 ? '★'.repeat(s.skill) + '☆'.repeat(5 - s.skill) : '—' }}
                    </span>
                  </td>
                  <td>
                    <select class="table-select" v-model="s.status">
                      <option>正常作業</option>
                      <option>缺料呼叫</option>
                      <option>閒置中</option>
                      <option>設備異常</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 儲存按鈕 -->
        <div class="action-bar">
          <div class="save-status" :class="saveStatusClass">{{ saveStatusMsg }}</div>
          <div class="btn-group">
            <button class="btn btn-outline" @click="resetForm">🔄 重置</button>
            <button class="btn btn-primary" @click="savePersonnel" :disabled="saving">
              {{ saving ? '⏳ 儲存中...' : '💾 儲存班次資料' }}
            </button>
          </div>
        </div>
      </div>

    </main>
    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import NavDrawer from '@/components/NavDrawer.vue'

const EMP_API       = 'http://localhost:1880/employees'
const EMP_DEL_API   = 'http://localhost:1880/employees/delete'
const PERSONNEL_API = 'http://localhost:1880/personnel'

// 時間
const currentTime = ref('')
let timeTimer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

// Tab
const activeTab = ref('employees')

// ── 員工名單 ──────────────────────────────
const employees    = ref([])
const addingEmp    = ref(false)
const empStatusMsg = ref('')
const empStatusClass = ref('')

const newEmp = ref({ empId: '', name: '', skill: 0 })

const fetchEmployees = async () => {
  try {
    const res  = await fetch(EMP_API)
    const json = await res.json()
    employees.value = json.data || []
  } catch (e) {
    console.error('員工 API 失敗', e)
  }
}

const addEmployee = async () => {
  if (!newEmp.value.empId || !newEmp.value.name) {
    empStatusMsg.value   = '❌ 請填寫工號與姓名'
    empStatusClass.value = 'status-err'
    return
  }
  addingEmp.value = true
  try {
    await fetch(EMP_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(newEmp.value)
    })
    empStatusMsg.value   = `✅ ${newEmp.value.name} 新增成功！`
    empStatusClass.value = 'status-ok'
    newEmp.value         = { empId: '', name: '', skill: 0 }
    await fetchEmployees()
  } catch (e) {
    empStatusMsg.value   = '❌ API 連線失敗'
    empStatusClass.value = 'status-err'
  } finally {
    addingEmp.value = false
  }
}

const deleteEmployee = async (empId) => {
  if (!confirm(`確定要刪除 ${empId}？`)) return
  try {
    await fetch(EMP_DEL_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ empId })
    })
    empStatusMsg.value   = `✅ ${empId} 已刪除`
    empStatusClass.value = 'status-ok'
    await fetchEmployees()
  } catch (e) {
    empStatusMsg.value   = '❌ 刪除失敗'
    empStatusClass.value = 'status-err'
  }
}

// ── 班次派工 ──────────────────────────────
const defaultStations = () => [
  { id: 'ST-01', name: '射出成型機 A', empId: '', operator: '', skill: 0, status: '正常作業' },
  { id: 'ST-02', name: '射出成型機 B', empId: '', operator: '', skill: 0, status: '正常作業' },
  { id: 'ST-03', name: 'CNC 加工機 A', empId: '', operator: '', skill: 0, status: '正常作業' },
  { id: 'ST-04', name: 'CNC 加工機 B', empId: '', operator: '', skill: 0, status: '正常作業' },
  { id: 'ST-05', name: '組裝產線 1',   empId: '', operator: '', skill: 0, status: '正常作業' },
  { id: 'ST-06', name: '組裝產線 2',   empId: '', operator: '', skill: 0, status: '閒置中'   },
]
const today = () => new Date().toISOString().split('T')[0]

const form = ref({
  date: today(), shift: '早班',
  totalCount: 0, presentCount: 0, leaveCount: 0, supportCount: 0,
  stations: defaultStations()
})

const saving          = ref(false)
const saveStatusMsg   = ref('')
const saveStatusClass = ref('')

// 選員工後自動帶入姓名與熟練度
const fillOperator = (station) => {
  const emp = employees.value.find(e => e.empId === station.empId)
  if (emp) {
    station.operator = emp.name
    station.skill    = emp.skill
  } else {
    station.operator = ''
    station.skill    = 0
  }
}

const savePersonnel = async () => {
  saving.value = true
  saveStatusMsg.value = ''
  try {
    const res = await fetch(PERSONNEL_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form.value)
    })
    if (res.ok) {
      saveStatusMsg.value   = '✅ 班次資料儲存成功！'
      saveStatusClass.value = 'status-ok'
    } else {
      saveStatusMsg.value   = '❌ 儲存失敗'
      saveStatusClass.value = 'status-err'
    }
  } catch (e) {
    saveStatusMsg.value   = '❌ API 連線失敗，請確認 Node-RED'
    saveStatusClass.value = 'status-err'
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  form.value = {
    date: today(), shift: '早班',
    totalCount: 0, presentCount: 0, leaveCount: 0, supportCount: 0,
    stations: defaultStations()
  }
  saveStatusMsg.value = ''
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  fetchEmployees()
})
onUnmounted(() => clearInterval(timeTimer))
</script>

<style scoped>
.dashboard-container { height: 100vh; background-color: #475569; color: #1e293b; font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-indigo { background-color: #6366f1; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }

.main-content { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; flex: 1; overflow: hidden; min-height: 0; }

/* Tab */
.tab-group { display: flex; background: #334155; border-radius: 0.5rem; overflow: hidden; flex-shrink: 0; }
.tab-btn { flex: 1; padding: 0.75rem; border: none; background: transparent; color: #94a3b8; font-weight: bold; cursor: pointer; font-size: 0.95rem; transition: all 0.2s; }
.tab-btn.active { background-color: #6366f1; color: white; }

/* Tab 內容 */
.tab-content { display: flex; flex-direction: column; gap: 1rem; flex: 1; overflow-y: auto; min-height: 0; padding-bottom: 0.5rem; }

/* 卡片 */
.card { background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; }
.table-card { flex: 1; min-height: 0; }
.card-header { background: #1e293b; color: white; padding: 0.65rem 1.1rem; font-weight: bold; font-size: 0.9rem; flex-shrink: 0; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.result-count { font-size: 0.78rem; color: #94a3b8; font-weight: normal; }

/* 新增員工表單 */
.add-form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 1rem; padding: 1rem 1.25rem; align-items: end; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.75rem; font-weight: bold; color: #64748b; }
.form-input { padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; outline: none; }
.form-input:focus { border-color: #6366f1; }
.form-action { justify-content: flex-end; }

/* 班次基本資訊 */
.top-body { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; padding: 1rem 1.25rem; }

/* 表格 */
.table-wrapper { overflow-y: auto; flex: 1; min-height: 0; }
.data-table { width: 100%; border-collapse: collapse; white-space: nowrap; }
.data-table th { background: #f8fafc; padding: 0.6rem 1rem; color: #334155; font-size: 0.8rem; font-weight: bold; position: sticky; top: 0; border-bottom: 2px solid #e2e8f0; z-index: 1; }
.data-table td { padding: 0.55rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 0.85rem; }
.data-table tbody tr:hover td { background: #f8fafc; }
.no-data { text-align: center; padding: 2rem !important; color: #94a3b8; }

.emp-tag { background: #e0f2fe; color: #0284c7; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.78rem; font-weight: bold; font-family: monospace; }
.fw-bold { font-weight: bold; }
.text-dark { color: #1e293b; }
.text-gray { color: #64748b; }
.font-mono { font-family: monospace; }
.stars { color: #f59e0b; letter-spacing: 2px; font-size: 0.9rem; }

.star-group { display: flex; gap: 2px; }
.star { font-size: 1.2rem; cursor: pointer; transition: color 0.1s; }
.star-on  { color: #f59e0b; }
.star-off { color: #e2e8f0; }

.table-select { padding: 0.35rem 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.83rem; outline: none; background: #f8fafc; cursor: pointer; min-width: 160px; }
.table-select:focus { border-color: #6366f1; }

.btn-delete { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.75rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; }
.btn-delete:hover { background: #fecaca; }

/* 儲存列 */
.action-bar { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 0.75rem; padding: 0.85rem 1.25rem; flex-shrink: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.btn-group { display: flex; gap: 0.75rem; }
.btn { padding: 0.55rem 1.5rem; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; font-size: 0.9rem; transition: all 0.15s; }
.btn-primary { background: #6366f1; color: white; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; }
.btn-outline:hover { background: #f1f5f9; }

.save-status { font-weight: bold; font-size: 0.9rem; }
.status-msg  { padding: 0.5rem 1.25rem; font-size: 0.85rem; font-weight: bold; }
.status-ok  { color: #16a34a; }
.status-err { color: #dc2626; }
</style>