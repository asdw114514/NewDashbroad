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

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">📦</div>
          <div class="kpi-info">
            <div class="kpi-label">料件種類</div>
            <div class="kpi-value text-white">48</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-info">
            <div class="kpi-label">低庫存警示</div>
            <div class="kpi-value text-red">3</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🔄</div>
          <div class="kpi-info">
            <div class="kpi-label">今日領料次數</div>
            <div class="kpi-value text-cyan">18</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📥</div>
          <div class="kpi-info">
            <div class="kpi-label">今日入庫次數</div>
            <div class="kpi-value text-green">5</div>
          </div>
        </div>
      </section>

      <div class="bottom-grid">

        <!-- 庫存列表 -->
        <section class="card">
          <div class="card-header">
            <span>📦 料件庫存狀況</span>
            <input class="search-input" v-model="searchText" placeholder="搜尋料件..." />
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>料號</th>
                  <th>名稱</th>
                  <th>類別</th>
                  <th>現有庫存</th>
                  <th>安全庫存</th>
                  <th>單位</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mat in filteredMaterials" :key="mat.id">
                  <td class="id-cell">{{ mat.id }}</td>
                  <td>{{ mat.name }}</td>
                  <td><span class="cat-tag" :class="mat.catClass">{{ mat.category }}</span></td>
                  <td :class="mat.stock <= mat.safeStock ? 'text-red fw-bold' : 'text-dark'">{{ mat.stock.toLocaleString() }}</td>
                  <td class="text-muted-sm">{{ mat.safeStock.toLocaleString() }}</td>
                  <td class="text-muted-sm">{{ mat.unit }}</td>
                  <td>
                    <span class="status-badge" :class="getStockClass(mat.stock, mat.safeStock)">
                      {{ getStockLabel(mat.stock, mat.safeStock) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 右側：今日領料記錄 -->
        <section class="card">
          <div class="card-header">🔄 今日領料記錄</div>
          <div class="txn-list">
            <div class="txn-item" v-for="txn in transactions" :key="txn.id">
              <div class="txn-left">
                <span class="txn-time">{{ txn.time }}</span>
                <span class="txn-name">{{ txn.name }}</span>
              </div>
              <div class="txn-right">
                <span class="txn-qty" :class="txn.type === '領料' ? 'text-red' : 'text-green'">
                  {{ txn.type === '領料' ? '-' : '+' }}{{ txn.qty }} {{ txn.unit }}
                </span>
                <span class="txn-type-badge" :class="txn.type === '領料' ? 'badge-out' : 'badge-in'">{{ txn.type }}</span>
              </div>
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

const searchText = ref('')

const materials = ref([
  { id: 'MAT-001', name: 'ABS 塑膠粒',   category: '原料', catClass: 'cat-raw',   stock: 1500, safeStock: 500,  unit: 'kg' },
  { id: 'MAT-002', name: 'PC 塑膠粒',    category: '原料', catClass: 'cat-raw',   stock: 320,  safeStock: 400,  unit: 'kg' },
  { id: 'MAT-003', name: 'M3 螺絲',      category: '零件', catClass: 'cat-part',  stock: 8500, safeStock: 2000, unit: 'pcs' },
  { id: 'MAT-004', name: 'M5 螺絲',      category: '零件', catClass: 'cat-part',  stock: 3200, safeStock: 1000, unit: 'pcs' },
  { id: 'MAT-005', name: '銅嵌件 φ4',   category: '零件', catClass: 'cat-part',  stock: 150,  safeStock: 500,  unit: 'pcs' },
  { id: 'MAT-006', name: '潤滑油脂',     category: '耗材', catClass: 'cat-cons',  stock: 25,   safeStock: 10,   unit: 'L' },
  { id: 'MAT-007', name: '包裝紙箱(大)', category: '包材', catClass: 'cat-pack',  stock: 600,  safeStock: 200,  unit: 'pcs' },
  { id: 'MAT-008', name: '包裝紙箱(小)', category: '包材', catClass: 'cat-pack',  stock: 1200, safeStock: 300,  unit: 'pcs' },
  { id: 'MAT-009', name: 'PP 塑膠粒',    category: '原料', catClass: 'cat-raw',   stock: 880,  safeStock: 400,  unit: 'kg' },
  { id: 'MAT-010', name: '彈簧片 A型',   category: '零件', catClass: 'cat-part',  stock: 2400, safeStock: 800,  unit: 'pcs' },
])

const filteredMaterials = computed(() => {
  if (!searchText.value) return materials.value
  return materials.value.filter(m => m.id.includes(searchText.value) || m.name.includes(searchText.value))
})

const getStockClass = (stock, safe) => stock <= safe * 0.5 ? 'status-critical' : stock <= safe ? 'status-low' : 'status-ok'
const getStockLabel = (stock, safe) => stock <= safe * 0.5 ? '嚴重不足' : stock <= safe ? '低庫存' : '正常'

const transactions = ref([
  { id: 1,  time: '08:12', name: 'ABS 塑膠粒',     qty: 200,  unit: 'kg',  type: '領料' },
  { id: 2,  time: '08:35', name: 'M3 螺絲',        qty: 500,  unit: 'pcs', type: '領料' },
  { id: 3,  time: '09:10', name: 'PC 塑膠粒',      qty: 800,  unit: 'kg',  type: '入庫' },
  { id: 4,  time: '09:45', name: '銅嵌件 φ4',     qty: 100,  unit: 'pcs', type: '領料' },
  { id: 5,  time: '10:20', name: '包裝紙箱(大)',   qty: 100,  unit: 'pcs', type: '領料' },
  { id: 6,  time: '10:55', name: 'M5 螺絲',        qty: 1000, unit: 'pcs', type: '入庫' },
  { id: 7,  time: '11:30', name: 'PP 塑膠粒',      qty: 150,  unit: 'kg',  type: '領料' },
  { id: 8,  time: '13:00', name: '彈簧片 A型',     qty: 200,  unit: 'pcs', type: '領料' },
  { id: 9,  time: '13:40', name: '銅嵌件 φ4',     qty: 500,  unit: 'pcs', type: '入庫' },
  { id: 10, time: '14:15', name: '包裝紙箱(小)',   qty: 200,  unit: 'pcs', type: '領料' },
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
.bg-purple { background-color: #a855f7; }
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
.bottom-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.search-input { background: #334155; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; outline: none; }
.search-input::placeholder { color: #64748b; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.75rem 1rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.8rem; }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; }
.cat-tag { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.cat-raw  { background: #fef9c3; color: #a16207; }
.cat-part { background: #dbeafe; color: #1d4ed8; }
.cat-cons { background: #f3e8ff; color: #7e22ce; }
.cat-pack { background: #dcfce7; color: #15803d; }
.status-badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: bold; }
.status-ok       { background: #dcfce7; color: #16a34a; }
.status-low      { background: #fef9c3; color: #ca8a04; }
.status-critical { background: #fee2e2; color: #dc2626; }
.text-dark    { color: #1e293b; }
.text-muted-sm { color: #94a3b8; font-size: 0.85rem; }
.fw-bold { font-weight: bold; }
.txn-list { padding: 0.75rem 1.25rem; display: flex; flex-direction: column; gap: 0; }
.txn-item { display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 0; border-bottom: 1px solid #f1f5f9; }
.txn-item:last-child { border-bottom: none; }
.txn-left { display: flex; flex-direction: column; gap: 0.2rem; }
.txn-time { font-size: 0.75rem; color: #94a3b8; }
.txn-name { font-size: 0.88rem; font-weight: bold; color: #1e293b; }
.txn-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
.txn-qty { font-size: 0.9rem; font-weight: bold; }
.txn-type-badge { font-size: 0.72rem; font-weight: bold; padding: 0.15rem 0.5rem; border-radius: 999px; }
.badge-out { background: #fee2e2; color: #dc2626; }
.badge-in  { background: #dcfce7; color: #16a34a; }
.text-white  { color: white; }
.text-green  { color: #16a34a; }
.text-cyan   { color: #0891b2; }
.text-red    { color: #dc2626; }
</style>