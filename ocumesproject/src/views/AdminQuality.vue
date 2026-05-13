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

      <!-- KPI -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">🔍</div>
          <div class="kpi-info">
            <div class="kpi-label">今日檢驗數</div>
            <div class="kpi-value text-white">1,240</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <div class="kpi-label">良品數</div>
            <div class="kpi-value text-green">1,198</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">❌</div>
          <div class="kpi-info">
            <div class="kpi-label">不良品數</div>
            <div class="kpi-value text-red">42</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📈</div>
          <div class="kpi-info">
            <div class="kpi-label">整體良品率</div>
            <div class="kpi-value text-green">96.6%</div>
          </div>
        </div>
      </section>

      <div class="bottom-grid">

        <!-- 檢驗記錄 -->
        <section class="card">
          <div class="card-header">
            <span>📋 檢驗記錄</span>
            <select class="filter-select" v-model="filterResult">
              <option value="">全部</option>
              <option value="合格">合格</option>
              <option value="不合格">不合格</option>
              <option value="待複檢">待複檢</option>
            </select>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>批號</th>
                  <th>產品</th>
                  <th>機台</th>
                  <th>檢驗數</th>
                  <th>良品</th>
                  <th>不良品</th>
                  <th>良品率</th>
                  <th>判定</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rec in filteredRecords" :key="rec.lot">
                  <td class="id-cell">{{ rec.lot }}</td>
                  <td>{{ rec.product }}</td>
                  <td><span class="machine-tag">{{ rec.machine }}</span></td>
                  <td>{{ rec.total }}</td>
                  <td class="text-green">{{ rec.pass }}</td>
                  <td class="text-red">{{ rec.fail }}</td>
                  <td>
                    <span :class="rec.rate >= 98 ? 'text-green' : rec.rate >= 95 ? 'text-yellow' : 'text-red'">
                      {{ rec.rate }}%
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" :class="rec.resultClass">{{ rec.result }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 右側：不良分析 -->
        <section class="card">
          <div class="card-header">📊 不良類型分析</div>
          <div class="defect-list">
            <div class="defect-item" v-for="d in defects" :key="d.type">
              <div class="defect-top">
                <span class="defect-type">{{ d.type }}</span>
                <span class="defect-count text-red">{{ d.count }} 件</span>
              </div>
              <div class="defect-bar-bg">
                <div class="defect-bar-fill" :style="{ width: (d.count / maxDefect * 100) + '%' }"></div>
              </div>
              <div class="defect-pct text-yellow">佔比 {{ d.pct }}%</div>
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

const filterResult = ref('')

const records = ref([
  { lot: 'LOT-20260513-001', product: '外殼 A型', machine: 'INJ-101', total: 200, pass: 198, fail: 2,  rate: 99.0, result: '合格',  resultClass: 'status-pass' },
  { lot: 'LOT-20260513-002', product: '齒輪組 B', machine: 'CNC-201', total: 150, pass: 138, fail: 12, rate: 92.0, result: '不合格', resultClass: 'status-fail' },
  { lot: 'LOT-20260513-003', product: '端蓋 C型', machine: 'INJ-102', total: 300, pass: 295, fail: 5,  rate: 98.3, result: '合格',  resultClass: 'status-pass' },
  { lot: 'LOT-20260513-004', product: '支架 D型', machine: 'ASM-301', total: 100, pass: 94,  fail: 6,  rate: 94.0, result: '待複檢', resultClass: 'status-review' },
  { lot: 'LOT-20260513-005', product: '底板 E型', machine: 'INJ-103', total: 80,  pass: 63,  fail: 17, rate: 78.8, result: '不合格', resultClass: 'status-fail' },
  { lot: 'LOT-20260513-006', product: '外殼 F型', machine: 'INJ-104', total: 250, pass: 248, fail: 2,  rate: 99.2, result: '合格',  resultClass: 'status-pass' },
  { lot: 'LOT-20260513-007', product: '轉子 G型', machine: 'CNC-202', total: 160, pass: 162, fail: 0,  rate: 100,  result: '合格',  resultClass: 'status-pass' },
])

const filteredRecords = computed(() => {
  if (!filterResult.value) return records.value
  return records.value.filter(r => r.result === filterResult.value)
})

const defects = ref([
  { type: '尺寸超差', count: 18, pct: 42.9 },
  { type: '表面刮傷', count: 10, pct: 23.8 },
  { type: '毛邊殘留', count: 8,  pct: 19.0 },
  { type: '缺料短射', count: 4,  pct: 9.5  },
  { type: '顏色異常', count: 2,  pct: 4.8  },
])

const maxDefect = computed(() => Math.max(...defects.value.map(d => d.count)))

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard-container { min-height: 100vh; background-color: #475569; font-family: sans-serif; display: flex; flex-direction: column; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-green { background-color: #22c55e; }
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
.bottom-grid { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; }
.card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { background-color: #1e293b; color: white; padding: 0.75rem 1.25rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.filter-select { background: #334155; border: none; color: white; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.data-table thead tr { background-color: #f1f5f9; }
.data-table th { padding: 0.7rem 0.85rem; text-align: left; color: #475569; font-weight: bold; font-size: 0.78rem; }
.data-table td { padding: 0.7rem 0.85rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.id-cell { font-family: monospace; font-weight: bold; color: #0ea5e9; font-size: 0.78rem; }
.machine-tag { background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; font-family: monospace; }
.status-badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: bold; }
.status-pass   { background: #dcfce7; color: #16a34a; }
.status-fail   { background: #fee2e2; color: #dc2626; }
.status-review { background: #fef9c3; color: #ca8a04; }
.defect-list { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
.defect-item { display: flex; flex-direction: column; gap: 0.3rem; }
.defect-top { display: flex; justify-content: space-between; }
.defect-type { font-size: 0.88rem; font-weight: bold; color: #1e293b; }
.defect-count { font-size: 0.85rem; font-weight: bold; }
.defect-bar-bg { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.defect-bar-fill { height: 100%; background: #ef4444; border-radius: 999px; transition: width 0.5s; }
.defect-pct { font-size: 0.75rem; }
.text-white  { color: white; }
.text-green  { color: #16a34a; }
.text-yellow { color: #ca8a04; }
.text-red    { color: #dc2626; }
</style>