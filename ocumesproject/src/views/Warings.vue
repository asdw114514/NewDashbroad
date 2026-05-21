<template>
  <div class="dashboard-container">

    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-red">異常日誌</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">值班主管：王大明</div>
      </div>
    </header>

    <main class="main-layout">

      <!-- 左側過濾 -->
      <aside class="left-sidebar">

        <!-- 統計卡 -->
        <div class="stat-grid">
          <div class="stat-card stat-danger">
            <div class="stat-num">{{ dangerCount }}</div>
            <div class="stat-label">🔴 異常</div>
          </div>
          <div class="stat-card stat-warning">
            <div class="stat-num">{{ warningCount }}</div>
            <div class="stat-label">🟡 警告</div>
          </div>
        </div>

        <!-- 過濾條件 -->
        <div class="card filter-card">
          <div class="card-header dark">🔍 過濾條件</div>
          <div class="filter-body">

            <div class="form-group">
              <label>等級</label>
              <div class="level-btns">
                <button
                  v-for="lv in levelOptions" :key="lv.value"
                  :class="['level-btn', { active: filterLevel === lv.value }, lv.cls]"
                  @click="filterLevel = lv.value"
                >{{ lv.label }}</button>
              </div>
            </div>

            <div class="form-group">
              <label>機台</label>
              <select class="form-select" v-model="filterStation">
                <option value="">全部機台</option>
                <option v-for="s in stationOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>警告類型</label>
              <select class="form-select" v-model="filterType">
                <option value="">全部類型</option>
                <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>關鍵字</label>
              <input class="form-input" v-model="filterKeyword" placeholder="輸入關鍵字...">
            </div>

            <button class="btn btn-outline w-full" @click="resetFilter">🔄 重置過濾</button>
            <button class="btn btn-primary w-full" @click="exportCSV">📥 匯出 CSV</button>

            <!-- API 狀態 -->
            <div class="api-status" :class="apiConnected ? 'api-ok' : 'api-err'">
              {{ apiConnected ? '🟢 API 正常' : '🔴 API 失敗' }}
              <span class="api-sub">{{ apiConnected ? `共 ${allWarnings.length} 筆` : '請確認 Node-RED' }}</span>
            </div>

          </div>
        </div>
      </aside>

      <!-- 右側：日誌表格 -->
      <section class="main-panel">
        <div class="card h-full">
          <div class="card-header dark flex-between">
            <span>📋 異常日誌清單</span>
            <div class="header-right-actions">
              <span class="result-count">顯示 {{ filteredWarnings.length }} / {{ allWarnings.length }} 筆</span>
              <button class="refresh-btn" @click="fetchWarnings">🔃 重新整理</button>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>機台</th>
                  <th>類型</th>
                  <th>等級</th>
                  <th>詳細訊息</th>
                  <th>數值</th>
                  <th>門檻</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="7" class="no-data">⏳ 資料載入中...</td>
                </tr>
                <tr v-else-if="filteredWarnings.length === 0">
                  <td colspan="7" class="no-data">✅ 查無符合條件的異常紀錄</td>
                </tr>
                <tr
                  v-else
                  v-for="(w, i) in filteredWarnings"
                  :key="w._id || i"
                  :class="w.level === 'danger' ? 'row-danger' : 'row-warning'"
                >
                  <td class="text-gray font-mono">{{ w.time }}</td>
                  <td>
                    <span class="station-tag">{{ w.stationId }}</span>
                    <div class="station-name">{{ w.stationName }}</div>
                  </td>
                  <td><span class="type-badge">{{ w.type }}</span></td>
                  <td>
                    <span :class="['level-badge', w.level === 'danger' ? 'badge-danger' : 'badge-warning']">
                      {{ w.level === 'danger' ? '🔴 異常' : '🟡 警告' }}
                    </span>
                  </td>
                  <td class="message-cell">{{ w.message }}</td>
                  <td class="fw-bold" :class="w.level === 'danger' ? 'text-red' : 'text-yellow'">
                    {{ w.value }}%
                  </td>
                  <td class="text-gray">{{ w.threshold }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </main>

    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavDrawer from '@/components/NavDrawer.vue'

const API_URL = 'http://localhost:1880/warnings'
const POLL_INTERVAL = 10000 // 10 秒更新一次

// 時間
const currentTime = ref('')
let timeTimer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

// API
const apiConnected  = ref(false)
const loading       = ref(true)
const allWarnings   = ref([])

const fetchWarnings = async () => {
  try {
    const res  = await fetch(API_URL)
    const data = await res.json()
    if (data.data) {
      allWarnings.value = data.data
      apiConnected.value = true
    }
  } catch (e) {
    apiConnected.value = false
    console.error('warnings API 失敗', e)
  } finally {
    loading.value = false
  }
}

// 統計
const dangerCount  = computed(() => allWarnings.value.filter(w => w.level === 'danger').length)
const warningCount = computed(() => allWarnings.value.filter(w => w.level === 'warning').length)

// 過濾選項
const stationOptions = computed(() => [...new Set(allWarnings.value.map(w => w.stationId))])
const typeOptions    = computed(() => [...new Set(allWarnings.value.map(w => w.type))])

const levelOptions = [
  { label: '全部', value: '',        cls: 'lv-all'  },
  { label: '🔴 異常', value: 'danger',  cls: 'lv-danger'  },
  { label: '🟡 警告', value: 'warning', cls: 'lv-warning' },
]

// 過濾條件
const filterLevel   = ref('')
const filterStation = ref('')
const filterType    = ref('')
const filterKeyword = ref('')

const filteredWarnings = computed(() => {
  return allWarnings.value.filter(w => {
    const matchLevel   = filterLevel.value   ? w.level     === filterLevel.value   : true
    const matchStation = filterStation.value ? w.stationId === filterStation.value : true
    const matchType    = filterType.value    ? w.type      === filterType.value    : true
    const matchKeyword = filterKeyword.value
      ? w.message.includes(filterKeyword.value) || w.stationId.includes(filterKeyword.value)
      : true
    return matchLevel && matchStation && matchType && matchKeyword
  })
})

const resetFilter = () => {
  filterLevel.value   = ''
  filterStation.value = ''
  filterType.value    = ''
  filterKeyword.value = ''
}

// 匯出 CSV
const exportCSV = () => {
  const headers = ['時間', '機台ID', '機台名稱', '類型', '等級', '訊息', '數值', '門檻']
  const rows = filteredWarnings.value.map(w => [
    w.time, w.stationId, w.stationName, w.type,
    w.level === 'danger' ? '異常' : '警告',
    w.message, w.value, w.threshold
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `warnings_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 生命週期
let pollTimer = null
onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  fetchWarnings()
  pollTimer = setInterval(fetchWarnings, POLL_INTERVAL)
})
onUnmounted(() => {
  clearInterval(timeTimer)
  clearInterval(pollTimer)
})
</script>

<style scoped>
.dashboard-container {
  height: 100vh;           /* 改 min-height → height */
  background-color: #475569;
  color: #1e293b;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;        /* 新增 */
}
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-red { background-color: #ef4444; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }

.main-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.25rem;
  padding: 1.25rem;
  flex: 1;
  overflow: hidden;
  min-height: 0;           /* 關鍵 */
}

/* 左側 */
.left-sidebar { display: flex; flex-direction: column; gap: 0.75rem; min-height: 0; }

.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; flex-shrink: 0; }
.stat-card { border-radius: 0.75rem; padding: 0.85rem 1rem; text-align: center; }
.stat-danger  { background: #fee2e2; border: 1px solid #fca5a5; }
.stat-warning { background: #fef9c3; border: 1px solid #fde047; }
.stat-num { font-size: 2rem; font-weight: bold; }
.stat-danger  .stat-num { color: #dc2626; }
.stat-warning .stat-num { color: #ca8a04; }
.stat-label { font-size: 0.78rem; color: #64748b; margin-top: 0.2rem; }

.filter-card { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.filter-body { padding: 0.85rem; display: flex; flex-direction: column; gap: 0.85rem; overflow-y: auto; flex: 1; }

.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.78rem; font-weight: bold; color: #64748b; }
.form-select, .form-input { padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; outline: none; }
.form-select:focus, .form-input:focus { border-color: #0ea5e9; }

.level-btns { display: flex; gap: 0.35rem; }
.level-btn { flex: 1; padding: 0.35rem 0.4rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.72rem; font-weight: bold; cursor: pointer; background: white; color: #64748b; transition: all 0.15s; }
.level-btn.active.lv-all     { background: #1e293b; color: white; border-color: #1e293b; }
.level-btn.active.lv-danger  { background: #fee2e2; color: #dc2626; border-color: #ef4444; }
.level-btn.active.lv-warning { background: #fef9c3; color: #ca8a04; border-color: #eab308; }

.btn { padding: 0.55rem; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; font-size: 0.82rem; transition: all 0.15s; }
.w-full { width: 100%; }
.btn-primary { background-color: #0ea5e9; color: white; }
.btn-primary:hover { background-color: #0284c7; }
.btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; }
.btn-outline:hover { background: #f1f5f9; }

.api-status { display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0.75rem; border-radius: 6px; font-size: 0.78rem; font-weight: bold; }
.api-ok  { background: #dcfce7; color: #16a34a; }
.api-err { background: #fee2e2; color: #dc2626; }
.api-sub { font-size: 0.72rem; font-weight: normal; }

/* 右側 */
.main-panel { min-height: 0; height: 100%; }
.card { background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; }
.h-full {
  height: 100%;
}
.card-header { background-color: #1e293b; color: white; padding: 0.65rem 1.1rem; font-weight: bold; font-size: 0.9rem; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.header-right-actions { display: flex; align-items: center; gap: 0.75rem; }
.result-count { font-size: 0.78rem; color: #94a3b8; font-weight: normal; }
.refresh-btn { background: #334155; color: #94a3b8; border: none; padding: 0.3rem 0.65rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
.refresh-btn:hover { background: #475569; color: white; }

.table-wrapper { overflow-y: auto; flex: 1; min-height: 0; }
.data-table { width: 100%; border-collapse: collapse; white-space: nowrap; }
.data-table th { background: #f8fafc; padding: 0.65rem 1rem; color: #334155; font-size: 0.8rem; font-weight: bold; position: sticky; top: 0; border-bottom: 2px solid #e2e8f0; z-index: 1; }
.data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; vertical-align: middle; }
.row-danger:hover td  { background: #fff5f5; }
.row-warning:hover td { background: #fffbeb; }
.row-danger  td:first-child { border-left: 3px solid #ef4444; }
.row-warning td:first-child { border-left: 3px solid #eab308; }

.no-data { text-align: center; padding: 3rem !important; color: #94a3b8; font-size: 1rem; }
.font-mono { font-family: monospace; }
.fw-bold { font-weight: bold; }
.text-gray   { color: #64748b; }
.text-red    { color: #dc2626; }
.text-yellow { color: #ca8a04; }

.station-tag  { background: #e0f2fe; color: #0284c7; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; font-family: monospace; }
.station-name { font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem; }

.type-badge { background: #f1f5f9; color: #475569; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }

.level-badge { padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.75rem; font-weight: bold; }
.badge-danger  { background: #fee2e2; color: #dc2626; }
.badge-warning { background: #fef9c3; color: #ca8a04; }

.message-cell { white-space: normal; max-width: 300px; color: #334155; line-height: 1.4; }
</style>