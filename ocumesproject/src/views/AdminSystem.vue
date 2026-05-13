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

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">👤</div>
          <div class="kpi-info">
            <div class="kpi-label">系統帳號數</div>
            <div class="kpi-value text-white">12</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🟢</div>
          <div class="kpi-info">
            <div class="kpi-label">目前在線</div>
            <div class="kpi-value text-green">4</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🔒</div>
          <div class="kpi-info">
            <div class="kpi-label">停用帳號</div>
            <div class="kpi-value text-red">2</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📝</div>
          <div class="kpi-info">
            <div class="kpi-label">今日操作日誌</div>
            <div class="kpi-value text-cyan">38</div>
          </div>
        </div>
      </section>

      <div class="bottom-grid">

        <!-- 帳號管理 -->
        <section class="card">
          <div class="card-header">
            <span>👤 帳號管理</span>
            <select class="filter-select" v-model="filterRole">
              <option value="">全部角色</option>
              <option value="系統管理員">系統管理員</option>
              <option value="現場主管">現場主管</option>
              <option value="操作員">操作員</option>
              <option value="品管人員">品管人員</option>
            </select>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>帳號</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>部門</th>
                  <th>最後登入</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td class="id-cell">{{ user.account }}</td>
                  <td>{{ user.name }}</td>
                  <td><span class="role-tag" :class="user.roleClass">{{ user.role }}</span></td>
                  <td class="text-muted-sm">{{ user.dept }}</td>
                  <td class="text-muted-sm">{{ user.lastLogin }}</td>
                  <td>
                    <span class="status-badge" :class="user.statusClass">{{ user.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 右側：系統操作日誌 -->
        <section class="card">
          <div class="card-header">📝 系統操作日誌</div>
          <div class="log-list">
            <div class="log-item" v-for="log in logs" :key="log.id">
              <div class="log-time">{{ log.time }}</div>
              <div class="log-content">
                <span class="log-user">{{ log.user }}</span>
                <span class="log-action" :class="log.actionClass">{{ log.action }}</span>
              </div>
              <div class="log-detail">{{ log.detail }}</div>
            </div>
          </div>
        </section>

      </div>
    </main>

    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NavDrawer from '@/components/NavDrawer.vue'

const router = useRouter()
const currentTime = ref('')
let timer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

const filterRole = ref('')

const users = ref([
  { id: 1,  account: 'admin',    name: '王大明', role: '系統管理員', roleClass: 'role-admin',   dept: '資訊部', lastLogin: '2026-05-13 08:01', status: '在線',   statusClass: 'status-online' },
  { id: 2,  account: 'chen.mg',  name: '陳志明', role: '現場主管',   roleClass: 'role-manager', dept: '生產部', lastLogin: '2026-05-13 07:55', status: '在線',   statusClass: 'status-online' },
  { id: 3,  account: 'lin.op1',  name: '林小芳', role: '操作員',     roleClass: 'role-op',      dept: '生產部', lastLogin: '2026-05-13 08:10', status: '在線',   statusClass: 'status-online' },
  { id: 4,  account: 'wu.qc',    name: '吳建國', role: '品管人員',   roleClass: 'role-qc',      dept: '品管部', lastLogin: '2026-05-13 08:30', status: '在線',   statusClass: 'status-online' },
  { id: 5,  account: 'huang.op', name: '黃美麗', role: '操作員',     roleClass: 'role-op',      dept: '生產部', lastLogin: '2026-05-12 17:30', status: '離線',   statusClass: 'status-offline' },
  { id: 6,  account: 'chou.mg',  name: '周俊賢', role: '現場主管',   roleClass: 'role-manager', dept: '品管部', lastLogin: '2026-05-12 16:45', status: '離線',   statusClass: 'status-offline' },
  { id: 7,  account: 'liao.op',  name: '廖文雄', role: '操作員',     roleClass: 'role-op',      dept: '生產部', lastLogin: '2026-05-10 09:20', status: '停用',   statusClass: 'status-disabled' },
  { id: 8,  account: 'tsai.op',  name: '蔡雅惠', role: '操作員',     roleClass: 'role-op',      dept: '生產部', lastLogin: '2026-05-08 14:15', status: '停用',   statusClass: 'status-disabled' },
  { id: 9,  account: 'hsu.qc',   name: '許志豪', role: '品管人員',   roleClass: 'role-qc',      dept: '品管部', lastLogin: '2026-05-12 11:00', status: '離線',   statusClass: 'status-offline' },
  { id: 10, account: 'chang.op', name: '張淑娟', role: '操作員',     roleClass: 'role-op',      dept: '生產部', lastLogin: '2026-05-11 18:00', status: '離線',   statusClass: 'status-offline' },
])

const filteredUsers = computed(() => {
  if (!filterRole.value) return users.value
  return users.value.filter(u => u.role === filterRole.value)
})

const logs = ref([
  { id: 1,  time: '08:01', user: 'admin',    action: '登入',   actionClass: 'action-login',  detail: '系統管理員登入' },
  { id: 2,  time: '08:05', user: 'admin',    action: '修改',   actionClass: 'action-edit',   detail: '修改 INJ-101 保養週期參數' },
  { id: 3,  time: '08:10', user: 'lin.op1',  action: '登入',   actionClass: 'action-login',  detail: '操作員登入' },
  { id: 4,  time: '08:15', user: 'chen.mg',  action: '審核',   actionClass: 'action-approve',detail: '審核工單 WO-2026-004' },
  { id: 5,  time: '08:30', user: 'wu.qc',    action: '登入',   actionClass: 'action-login',  detail: '品管人員登入' },
  { id: 6,  time: '08:45', user: 'wu.qc',    action: '新增',   actionClass: 'action-add',    detail: '新增檢驗記錄 LOT-20260513-007' },
  { id: 7,  time: '09:10', user: 'admin',    action: '新增',   actionClass: 'action-add',    detail: '新增帳號 hsu.qc' },
  { id: 8,  time: '09:30', user: 'lin.op1',  action: '修改',   actionClass: 'action-edit',   detail: '更新生產數量 WO-2026-002' },
  { id: 9,  time: '10:00', user: 'chen.mg',  action: '刪除',   actionClass: 'action-delete', detail: '刪除已逾期工單 WO-2026-000' },
  { id: 10, time: '10:25', user: 'admin',    action: '停用',   actionClass: 'action-delete', detail: '停用帳號 liao.op' },
])

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { min-height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-red { background-color: #ef4444; }
.back-btn { background: #1e293b; color: #94a3b8; border: none; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: background 0.2s; }
.back-btn:hover { background: #334155; color: white; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.main-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; flex: 1; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.kpi-card { background-color: #1e293b; border-radius: 0.75rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.kpi-icon { font-size: 2rem; }
.kpi-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.25rem; }
.kpi-value { font-size: 2rem; font-weight: bold; }
.bottom-grid { display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.filter-select { background: #334155; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.75rem 1rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.8rem; }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; }
.role-tag { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.role-admin   { background: #fee2e2; color: #dc2626; }
.role-manager { background: #dbeafe; color: #1d4ed8; }
.role-op      { background: #f0fdf4; color: #16a34a; }
.role-qc      { background: #faf5ff; color: #7e22ce; }
.status-badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: bold; }
.status-online   { background: #dcfce7; color: #16a34a; }
.status-offline  { background: #f1f5f9; color: #64748b; }
.status-disabled { background: #fee2e2; color: #dc2626; }
.text-muted-sm { color: #94a3b8; font-size: 0.85rem; }
.log-list { padding: 0.75rem 1.25rem; display: flex; flex-direction: column; gap: 0; overflow-y: auto; max-height: 500px; }
.log-item { padding: 0.65rem 0; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 0.2rem; }
.log-item:last-child { border-bottom: none; }
.log-time { font-size: 0.72rem; color: #94a3b8; font-family: monospace; }
.log-content { display: flex; align-items: center; gap: 0.5rem; }
.log-user { font-size: 0.82rem; font-weight: bold; color: #0ea5e9; font-family: monospace; }
.log-action { font-size: 0.75rem; font-weight: bold; padding: 0.1rem 0.4rem; border-radius: 4px; }
.action-login   { background: #dcfce7; color: #16a34a; }
.action-edit    { background: #dbeafe; color: #1d4ed8; }
.action-add     { background: #f3e8ff; color: #7e22ce; }
.action-approve { background: #fef9c3; color: #a16207; }
.action-delete  { background: #fee2e2; color: #dc2626; }
.log-detail { font-size: 0.8rem; color: #64748b; }
.text-white { color: white; }
.text-green { color: #16a34a; }
.text-cyan  { color: #0891b2; }
.text-red   { color: #dc2626; }
</style>