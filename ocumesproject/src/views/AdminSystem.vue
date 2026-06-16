<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-red">權限與系統維護</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">系統管理員：王大明</div>
      </div>
    </header>

    <main class="main-content">

      <!-- 身份切換 + API 狀態 -->
      <div class="top-bar">
        <div class="identity-bar">
          <span class="identity-label">🔑 目前登入身份（Demo）：</span>
          <select class="identity-select" v-model="currentRole">
            <option value="admin">管理員 (admin)</option>
            <option value="operator">一般員工 (operator)</option>
          </select>
          <span v-if="currentRole === 'operator'" class="identity-hint">
            ⚠️ 一般員工只能編輯個人資料
          </span>
        </div>
        <span :class="apiConnected ? 'api-ok' : 'api-err'" class="api-status">
          {{ apiConnected ? '🟢 API 連線正常' : '🔴 API 連線失敗' }}
        </span>
      </div>

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">👑</div>
          <div class="kpi-info">
            <div class="kpi-label">管理員人數</div>
            <div class="kpi-value text-red">{{ users.filter(u=>u.role==='admin').length }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">👤</div>
          <div class="kpi-info">
            <div class="kpi-label">一般員工人數</div>
            <div class="kpi-value text-cyan">{{ users.filter(u=>u.role==='operator').length }}</div>
          </div>
        </div>
      </section>

      <!-- 使用者列表 -->
      <section class="card">
        <div class="card-header">
          <span>👤 使用者管理</span>
          <button v-if="currentRole === 'admin'" class="add-btn" @click="openAddModal">➕ 新增使用者</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>使用者ID</th>
                <th>姓名</th>
                <th>角色</th>
                <th>最後更新</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="no-data">⏳ 載入中...</td>
              </tr>
              <tr v-else-if="visibleUsers.length === 0">
                <td colspan="5" class="no-data">📭 尚無使用者資料</td>
              </tr>
              <tr v-else v-for="user in visibleUsers" :key="user.userId">
                <td class="id-cell">{{ user.userId }}</td>
                <td class="fw-bold">{{ user.name }}</td>
                <td>
                  <span class="role-badge" :class="user.role === 'admin' ? 'role-admin' : 'role-op'">
                    {{ user.role === 'admin' ? '👑 管理員' : '👤 一般員工' }}
                  </span>
                </td>
                <td class="text-muted">{{ user.updatedAt ? user.updatedAt.split('T')[0] : '—' }}</td>
                <td class="action-cell">
                  <button class="edit-btn" @click="openEditModal(user)">✏️ 編輯</button>
                  <button
                    v-if="currentRole === 'admin'"
                    class="del-btn"
                    @click="deleteUser(user.userId)"
                  >🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 錯誤提示 -->
      <div v-if="errorMsg" class="error-alert">⚠️ {{ errorMsg }}</div>

    </main>

      <Teleport to="body">
        <div class="system-modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
          <div class="system-modal">
            <div class="system-modal-header">➕ 新增使用者</div>
            <div class="system-modal-body">
              <div class="system-form-group">
                <label>使用者ID</label>
                <input class="system-form-input" v-model="addForm.userId" placeholder="例：USR-003">
              </div>
              <div class="system-form-group">
                <label>姓名</label>
                <input class="system-form-input" v-model="addForm.name" placeholder="例：林小明">
              </div>
              <div class="system-form-group">
                <label>角色</label>
                <select class="system-form-input" v-model="addForm.role">
                  <option value="operator">一般員工</option>
                  <option value="admin">管理員</option>
                </select>
              </div>
              <div class="system-form-group">
                <label>初始密碼</label>
                <input class="system-form-input" type="password" v-model="addForm.password" placeholder="請輸入密碼">
              </div>
            </div>
            <div class="system-modal-footer">
              <button class="system-btn system-btn-outline" @click="showAddModal = false">取消</button>
              <button class="system-btn system-btn-primary" @click="addUser">確認新增</button>
            </div>
          </div>
        </div>
      </Teleport>
      <Teleport to="body">
        <div class="system-modal-overlay" v-if="showEditModal" @click.self="showEditModal = false">
          <div class="system-modal">
            <div class="system-modal-header">✏️ 編輯使用者</div>
            <div class="system-modal-body">
              <div class="system-form-group">
                <label>使用者ID</label>
                <input class="system-form-input system-form-input-disabled" :value="editForm.userId" disabled>
              </div>
              <div class="system-form-group">
                <label>姓名</label>
                <input class="system-form-input" v-model="editForm.name">
              </div>
              <div class="system-form-group" v-if="currentRole === 'admin'">
                <label>角色</label>
                <select class="system-form-input" v-model="editForm.role">
                  <option value="operator">一般員工</option>
                  <option value="admin">管理員</option>
                </select>
              </div>
              <div class="system-form-group">
                <label>新密碼（留空則不修改）</label>
                <input class="system-form-input" type="password" v-model="editForm.password" placeholder="留空則不變更">
              </div>
            </div>
            <div class="system-modal-footer">
              <button class="system-btn system-btn-outline" @click="showEditModal = false">取消</button>
              <button class="system-btn system-btn-primary" @click="updateUser">確認儲存</button>
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

// Demo 身份切換（假設目前登入的是第一位 admin）
const currentRole = ref('admin')
const currentUserId = ref('USR-001') // Demo 用，假設目前登入者

const apiConnected = ref(false)
const loading = ref(true)
const users = ref([])
const errorMsg = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const addForm = ref({ userId:'', name:'', role:'operator', password:'' })
const editForm = ref({ userId:'', name:'', role:'', password:'' })

// operator 只能看到自己
const visibleUsers = computed(() => {
  if (currentRole.value === 'admin') return users.value
  return users.value.filter(u => u.userId === currentUserId.value)
})

const fetchUsers = async () => {
  try {
    const res = await fetch(`${API}/users`)
    const data = await res.json()
    users.value = data.data || []
    apiConnected.value = true
  } catch {
    apiConnected.value = false
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  addForm.value = { userId:'', name:'', role:'operator', password:'' }
  showAddModal.value = true
}

const addUser = async () => {
  if (!addForm.value.userId || !addForm.value.name) return alert('請填寫必填欄位')
  await fetch(`${API}/users/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(addForm.value)
  })
  showAddModal.value = false
  fetchUsers()
}

const openEditModal = (user) => {
  editForm.value = { userId: user.userId, name: user.name, role: user.role, password:'' }
  showEditModal.value = true
}

const updateUser = async () => {
  const body = { userId: editForm.value.userId, name: editForm.value.name }
  if (currentRole.value === 'admin') body.role = editForm.value.role
  if (editForm.value.password) body.password = editForm.value.password
  await fetch(`${API}/users/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  showEditModal.value = false
  fetchUsers()
}

const deleteUser = async (userId) => {
  // 確認至少保留一位 admin
  const targetUser = users.value.find(u => u.userId === userId)
  if (targetUser?.role === 'admin') {
    const adminCount = users.value.filter(u => u.role === 'admin').length
    if (adminCount <= 1) {
      errorMsg.value = '至少需要保留一位管理員，無法刪除！'
      setTimeout(() => { errorMsg.value = '' }, 3000)
      return
    }
  }
  if (!confirm(`確定刪除使用者 ${userId}？`)) return
  await fetch(`${API}/users/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  fetchUsers()
}

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000); fetchUsers() })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-red { background-color: #ef4444; }
.back-btn { background: #1e293b; color: #94a3b8; border: none; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.back-btn:hover { background: #334155; color: white; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; overflow-y: auto; min-height: 0; }
.top-bar { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 0.5rem; padding: 0.65rem 1rem; flex-shrink: 0; }
.identity-bar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.identity-label { font-size: 0.85rem; font-weight: bold; color: #334155; }
.identity-select { border: 2px solid #0ea5e9; border-radius: 6px; padding: 0.3rem 0.6rem; font-size: 0.85rem; font-weight: bold; color: #0ea5e9; outline: none; cursor: pointer; }
.identity-hint { font-size: 0.78rem; color: #f97316; font-weight: bold; }
.api-status { font-size: 0.85rem; font-weight: bold; }
.api-ok { color: #16a34a; }
.api-err { color: #dc2626; }
.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; flex-shrink: 0; }
.kpi-card { background-color: #1e293b; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.kpi-icon { font-size: 2rem; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
.kpi-value { font-size: 2rem; font-weight: bold; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.add-btn { background: #ef4444; color: white; border: none; padding: 0.35rem 0.85rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.82rem; }
.add-btn:hover { background: #dc2626; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.75rem 1rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.8rem; }
.data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; }
.role-badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: bold; }
.role-admin { background: #fee2e2; color: #dc2626; }
.role-op    { background: #dbeafe; color: #1d4ed8; }
.action-cell { display: flex; gap: 0.5rem; }
.edit-btn { background: #dbeafe; color: #1d4ed8; border: none; padding: 0.3rem 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; }
.edit-btn:hover { background: #bfdbfe; }
.del-btn { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.del-btn:hover { background: #fca5a5; }
.no-data { text-align: center; padding: 2rem; color: #94a3b8; }
.error-alert { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 0.5rem; padding: 0.75rem 1rem; font-weight: bold; font-size: 0.88rem; }
</style>
<style>
.system-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.system-modal { background: white !important; border-radius: 0.75rem; width: 420px; max-width: 90vw; box-shadow: 0 20px 40px rgba(0,0,0,0.3); overflow: hidden; }
.system-modal-header { background: #1e293b !important; color: white !important; padding: 1rem 1.5rem; font-weight: bold; font-size: 1rem; }
.system-modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; background: white; }
.system-modal-footer { padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #f1f5f9; background: white; }
.system-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.system-form-group label { font-size: 0.8rem; font-weight: bold; color: #475569; }
.system-form-input { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1 !important; border-radius: 6px; font-size: 0.88rem; outline: none; background: white !important; color: #1e293b !important; width: 100%; box-sizing: border-box; }
.system-form-input:focus { border-color: #ef4444 !important; }
.system-form-input-disabled { background: #f1f5f9 !important; color: #94a3b8 !important; cursor: not-allowed; }
.system-btn { padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.88rem; border: none; }
.system-btn-primary { background: #ef4444 !important; color: white !important; }
.system-btn-primary:hover { background: #dc2626 !important; }
.system-btn-outline { background: white !important; border: 1px solid #cbd5e1 !important; color: #475569 !important; }
.system-btn-outline:hover { background: #f1f5f9 !important; }
</style>