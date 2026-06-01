<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/admin')">← 返回</button>
        <span class="title">⚙️ 系統維護</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="api-status" :class="apiStatusClass">API：{{ apiStatus }}</div>
      </div>
    </header>

    <main class="main-content">
      <section class="card role-card">
        <div class="role-row">
          <label for="roleSwitcher">目前登入身份</label>
          <select id="roleSwitcher" v-model="currentIdentity" class="input small">
            <option value="admin">admin</option>
            <option value="operator">operator</option>
          </select>
          <span v-if="currentIdentity === 'operator'" class="hint">目前模擬使用者：{{ operatorUserId || '無 operator 帳號' }}</span>
        </div>
      </section>

      <section class="kpi-grid two">
        <div class="kpi-card"><div class="kpi-label">管理員人數</div><div class="kpi-value text-blue">{{ adminCount }}</div></div>
        <div class="kpi-card"><div class="kpi-label">一般員工人數</div><div class="kpi-value text-green">{{ operatorCount }}</div></div>
      </section>
      <p v-if="operationError" class="error-message">{{ operationError }}</p>

      <section class="card">
        <div class="card-header">
          <span>👥 使用者列表</span>
          <button v-if="isAdmin" class="btn btn-primary" @click="openAddModal">➕ 新增使用者</button>
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
              <tr v-for="user in visibleUsers" :key="user.userId">
                <td>{{ user.userId }}</td>
                <td>{{ user.name }}</td>
                <td>
                  <span class="badge" :class="user.role === 'admin' ? 'badge-admin' : 'badge-operator'">
                    {{ user.role }}
                  </span>
                </td>
                <td>{{ user.updatedAt || '-' }}</td>
                <td>
                  <button class="btn btn-secondary" @click="openEditModal(user)">
                    {{ isAdmin ? '✏️ 編輯' : '✏️ 編輯個人資料' }}
                  </button>
                  <button v-if="isAdmin" class="btn btn-danger" @click="deleteUser(user)">🗑️ 刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="showAddModal" class="modal-mask" @click.self="showAddModal = false">
        <div class="modal">
          <h3>新增使用者</h3>
          <div class="form-grid">
            <input v-model.trim="addForm.userId" class="input" placeholder="使用者ID" />
            <input v-model.trim="addForm.name" class="input" placeholder="姓名" />
            <select v-model="addForm.role" class="input">
              <option value="admin">admin</option>
              <option value="operator">operator</option>
            </select>
            <input v-model="addForm.password" class="input" type="password" placeholder="初始密碼" />
          </div>
          <div class="modal-actions">
            <button class="btn" @click="showAddModal = false">取消</button>
            <button class="btn btn-primary" @click="addUser">儲存</button>
          </div>
        </div>
      </div>

      <div v-if="showEditModal" class="modal-mask" @click.self="showEditModal = false">
        <div class="modal">
          <h3>編輯使用者</h3>
          <div class="form-grid">
            <input v-model="editForm.userId" class="input" disabled />
            <input v-model.trim="editForm.name" class="input" placeholder="姓名" />
            <select v-if="isAdmin" v-model="editForm.role" class="input">
              <option value="admin">admin</option>
              <option value="operator">operator</option>
            </select>
            <input v-model="editForm.password" class="input" type="password" placeholder="新密碼（可留空）" />
          </div>
          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          <div class="modal-actions">
            <button class="btn" @click="showEditModal = false">取消</button>
            <button class="btn btn-primary" @click="updateUser">更新</button>
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
const users = ref([])
const currentIdentity = ref('admin')
const showAddModal = ref(false)
const showEditModal = ref(false)
const currentTime = ref('')
const apiStatus = ref('檢查中')
const apiStatusClass = ref('api-warn')
const errorMessage = ref('')
const operationError = ref('')
const addForm = ref({ userId: '', name: '', role: 'operator', password: '' })
const editForm = ref({ userId: '', name: '', role: 'operator', password: '' })

let timer

const isAdmin = computed(() => currentIdentity.value === 'admin')
const adminCount = computed(() => users.value.filter((item) => item.role === 'admin').length)
const operatorCount = computed(() => users.value.filter((item) => item.role === 'operator').length)
const operatorUserId = computed(() => users.value.find((item) => item.role === 'operator')?.userId || '')
const visibleUsers = computed(() => {
  if (isAdmin.value) return users.value
  return users.value.filter((item) => item.userId === operatorUserId.value)
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

async function fetchUsers() {
  try {
    const result = await request('/users')
    users.value = Array.isArray(result.data) ? result.data : []
    apiStatus.value = '正常'
    apiStatusClass.value = 'api-ok'
  } catch {
    users.value = []
    apiStatus.value = '異常'
    apiStatusClass.value = 'api-error'
  }
}

function openAddModal() {
  showAddModal.value = true
  errorMessage.value = ''
}

function openEditModal(user) {
  if (!isAdmin.value && user.userId !== operatorUserId.value) return
  errorMessage.value = ''
  editForm.value = { userId: user.userId, name: user.name, role: user.role, password: '' }
  showEditModal.value = true
}

async function addUser() {
  if (!addForm.value.userId || !addForm.value.name || !addForm.value.password) return
  operationError.value = ''
  try {
    await request('/users/add', {
      method: 'POST',
      body: JSON.stringify(addForm.value),
    })
    showAddModal.value = false
    addForm.value = { userId: '', name: '', role: 'operator', password: '' }
    await fetchUsers()
  } catch {
    operationError.value = '新增失敗，請稍後再試'
  }
}

async function updateUser() {
  errorMessage.value = ''
  operationError.value = ''

  if (!isAdmin.value) {
    editForm.value.role = users.value.find((item) => item.userId === editForm.value.userId)?.role || 'operator'
  }

  if (
    isAdmin.value
    && editForm.value.role !== 'admin'
    && users.value.find((item) => item.userId === editForm.value.userId)?.role === 'admin'
    && adminCount.value <= 1
  ) {
    errorMessage.value = '至少需保留一位 admin'
    window.alert(errorMessage.value)
    return
  }

  const payload = {
    userId: editForm.value.userId,
    name: editForm.value.name,
    role: editForm.value.role,
  }

  if (editForm.value.password) payload.password = editForm.value.password

  try {
    await request('/users/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    showEditModal.value = false
    await fetchUsers()
  } catch {
    operationError.value = '更新失敗，請稍後再試'
  }
}

async function deleteUser(user) {
  errorMessage.value = ''
  operationError.value = ''
  if (user.role === 'admin' && adminCount.value <= 1) {
    errorMessage.value = '至少需保留一位 admin'
    window.alert(errorMessage.value)
    return
  }
  if (!window.confirm(`確定刪除 ${user.userId}？`)) return

  try {
    await request('/users/delete', {
      method: 'POST',
      body: JSON.stringify({ userId: user.userId }),
    })
    await fetchUsers()
  } catch {
    operationError.value = '刪除失敗，請稍後再試'
  }
}

onMounted(async () => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  await fetchUsers()
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
.card { background: #fff; border-radius: 10px; overflow: hidden; }
.role-card { padding: 0.9rem 1rem; }
.role-row { display: flex; align-items: center; gap: 0.7rem; }
.hint { color: #64748b; font-size: 0.85rem; }
.kpi-grid { display: grid; gap: 1rem; }
.kpi-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.kpi-card { background: #fff; border-radius: 10px; padding: 1rem; }
.kpi-label { color: #64748b; font-size: 0.85rem; }
.kpi-value { font-size: 1.8rem; font-weight: 700; color: #0f172a; }
.error-message { margin: 0; color: #fee2e2; background: #7f1d1d; border-radius: 8px; padding: 0.55rem 0.75rem; }
.text-green { color: #16a34a; }
.text-blue { color: #2563eb; }
.card-header { background: #0f172a; color: #fff; padding: 0.7rem 1rem; display: flex; justify-content: space-between; align-items: center; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
.badge { border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.78rem; font-weight: 700; }
.badge-admin { background: #dbeafe; color: #1d4ed8; }
.badge-operator { background: #dcfce7; color: #166534; }
.input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.45rem 0.6rem; }
.small { min-width: 130px; }
.btn { border: none; border-radius: 6px; padding: 0.42rem 0.72rem; cursor: pointer; }
.btn-primary { background: #3b82f6; color: #fff; }
.btn-secondary { background: #64748b; color: #fff; }
.btn-danger { background: #ef4444; color: #fff; margin-left: 0.45rem; }
.error { margin-top: 0.5rem; color: #dc2626; }
.modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: grid; place-items: center; }
.modal { background: #fff; border-radius: 10px; width: min(560px, 92vw); padding: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0.8rem 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
