<template>
  <div class="dashboard-container">

    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-indigo">MES 後台管理系統</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">系統管理員：王大明</div>
      </div>
    </header>

    <main class="main-content">

      <!-- 頂部歡迎區 -->
      <div class="welcome-banner">
        <div class="welcome-left">
          <h2 class="welcome-title">⚙️ MES 後台核心管理功能</h2>
          <p class="welcome-sub">Manufacturing Execution System — 請選擇要管理的功能模組</p>
        </div>
        <div class="welcome-right">
          <div class="sys-info">
            <span class="sys-dot"></span>
            系統運作正常
          </div>
        </div>
      </div>

      <!-- 六大模組卡片 -->
      <section class="module-grid">

        <div
          class="module-card"
          v-for="module in modules"
          :key="module.path"
          @click="navigate(module.path)"
        >
          <div class="module-icon-wrap" :class="module.colorClass">
            <span class="module-icon">{{ module.icon }}</span>
          </div>
          <div class="module-body">
            <div class="module-name">{{ module.name }}</div>
            <div class="module-en">{{ module.en }}</div>
            <p class="module-desc">{{ module.desc }}</p>
          </div>
          <div class="module-footer">
            <span class="module-status" :class="module.done ? 'status-done' : 'status-wip'">
              {{ module.done ? '✅ 已實作' : '🚧 開發中' }}
            </span>
            <span class="module-arrow">進入 →</span>
          </div>
        </div>

      </section>

    </main>

    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NavDrawer from '@/components/NavDrawer.vue'

const router = useRouter()

// ── 系統時間 ──────────────────────────────
const currentTime = ref('')
let timeTimer = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`
}

// ── 六大模組 ──────────────────────────────
const modules = ref([
  {
    path: '/admin/scheduling',
    icon: '📅',
    name: '生產排程與派工',
    en: 'Scheduling & Dispatching',
    desc: '將 ERP 訂單轉化為具體生產任務，優化機台排程，即時調整生產順序。',
    colorClass: 'color-blue',
    done: false
  },
  {
    path: '/admin/wip',
    icon: '📊',
    name: '生產追蹤與看板',
    en: 'WIP Tracking & Dashboard',
    desc: '即時顯示在製品 (WIP) 位置、生產狀態、設備效率 (OEE)。',
    colorClass: 'color-cyan',
    done: false
  },
  {
    path: '/admin/quality',
    icon: '🔍',
    name: '品質管理',
    en: 'Quality Management',
    desc: '記錄生產過程中的檢測數據，實現產品追溯（系譜管理），確保產品符合規格。',
    colorClass: 'color-green',
    done: false
  },
  {
    path: '/admin/asset',
    icon: '🏭',
    name: '設備管理',
    en: 'Asset Management',
    desc: '監控設備運行狀況，預測保養需求，減少無預警停機。',
    colorClass: 'color-orange',
    done: false
  },
  {
    path: '/admin/material',
    icon: '📦',
    name: '物料管理',
    en: 'Material Tracking',
    desc: '追蹤物料投入、消耗和庫存情況，實現精細化管理。',
    colorClass: 'color-purple',
    done: false
  },
  {
    path: '/admin/system',
    icon: '🔐',
    name: '權限與系統維護',
    en: 'System Administration',
    desc: '管理操作人員權限、生產參數設定及系統配置。',
    colorClass: 'color-red',
    done: false
  },
  {
  path: '/admin/personnel',
  icon: '👷',
  name: '人員管理',
  en: 'Personnel Management',
  desc: '管理員工名單、熟練度，以及每班次的工位派工設定。',
  colorClass: 'color-teal',
  done: true   // ✅ 已實作
  }
])

const navigate = (path) => {
  router.push(path)
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timeTimer)
})
</script>
<style scoped>
.dashboard-container {
  height: 100vh;
  background-color: #475569;
  color: #1e293b;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background-color: #0f172a;
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; }
.bg-indigo { background-color: #6366f1; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; }
.color-teal { background-color: #f0fdfa; border-bottom: 4px solid #14b8a6; }

/* Main */
.main-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 歡迎橫幅 */
.welcome-banner {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 0.75rem;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}
.welcome-title { color: white; font-size: 1.5rem; font-weight: bold; margin: 0 0 0.5rem; }
.welcome-sub { color: #94a3b8; margin: 0; font-size: 0.95rem; }
.sys-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #22d3ee;
  font-weight: bold;
  font-size: 0.9rem;
}
.sys-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 模組卡片網格 */
.module-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 1200px) { .module-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px)  { .module-grid { grid-template-columns: 1fr; } }

/* 單一模組卡片 */
.module-card {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-bottom: 4px solid transparent;
}
.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

/* 圖示區 */
.module-icon-wrap {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.module-icon { font-size: 3rem; }

.color-blue   { background-color: #eff6ff; border-bottom: 4px solid #3b82f6; }
.color-cyan   { background-color: #ecfeff; border-bottom: 4px solid #06b6d4; }
.color-green  { background-color: #f0fdf4; border-bottom: 4px solid #22c55e; }
.color-orange { background-color: #fff7ed; border-bottom: 4px solid #f97316; }
.color-purple { background-color: #faf5ff; border-bottom: 4px solid #a855f7; }
.color-red    { background-color: #fef2f2; border-bottom: 4px solid #ef4444; }

/* 文字區 */
.module-body { padding: 0 1.5rem 1rem; flex: 1; }
.module-name { font-size: 1.15rem; font-weight: bold; color: #0f172a; margin-bottom: 0.25rem; }
.module-en   { font-size: 0.8rem; color: #94a3b8; font-style: italic; margin-bottom: 0.75rem; }
.module-desc { font-size: 0.9rem; color: #475569; line-height: 1.6; margin: 0; }

/* 底部 */
.module-footer {
  padding: 0.75rem 1.5rem;
  background-color: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.module-status { font-size: 0.8rem; font-weight: bold; }
.status-done { color: #16a34a; }
.status-wip  { color: #f97316; }
.module-arrow { font-size: 0.85rem; color: #94a3b8; font-weight: bold; transition: color 0.2s; }
.module-card:hover .module-arrow { color: #0ea5e9; }
</style>