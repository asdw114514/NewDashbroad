<template>
  <!-- 浮動選單按鈕 (右下角) -->
  <button class="fab-btn" @click="isOpen = !isOpen">
    <span class="fab-icon">{{ isOpen ? '✕' : '☰' }}</span>
    <span class="fab-label">{{ isOpen ? '關閉' : '選單' }}</span>
  </button>

  <!-- 背景遮罩 -->
  <Transition name="fade">
    <div class="overlay" v-if="isOpen" @click="isOpen = false"></div>
  </Transition>

  <!-- 側邊抽屜 -->
  <div class="drawer" :class="{ open: isOpen }">

    <!-- 抽屜標題 -->
    <div class="drawer-header">
      <span class="drawer-title">🏭 兆豐工業 MES</span>
      <span class="drawer-subtitle">系統功能導覽</span>
    </div>

    <!-- 目前所在頁面 -->
    <div class="current-page">
      <small class="label-small">目前位置</small>
      <div class="current-label">{{ currentPageLabel }}</div>
    </div>

    <!-- 導覽清單 -->
    <nav class="drawer-nav">
      <div class="nav-section-title">📁 後台管理功能</div>
      <div
        v-for="item in adminLinks"
        :key="item.path"
        class="drawer-item"
        :class="{ active: route.path === item.path }"
        @click="navigate(item.path)"
      >
        <span class="item-icon">{{ item.icon }}</span>
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-desc">{{ item.desc }}</span>
        </div>
        <span class="item-active-dot" v-if="route.path === item.path">◀</span>
        <span class="item-arrow" v-else>›</span>
      </div>
    </nav>

    <!-- 底部：切換回戰情室 -->
    <div class="drawer-footer">
      <button class="return-btn" @click="navigate('/dashboard')">
        📊 切換到監控戰情室
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isOpen = ref(false)

// 所有後台功能的導覽清單
const adminLinks = [
  { path: '/warings',           icon: '⚠️', name: '異常日誌',  desc: 'PLC / PC 錯誤訊息查詢' },
  { path: '/production-report', icon: '📋', name: '生產報表',  desc: '即時、歷史資訊與趨勢圖' },
  { path: '/da5',               icon: '🌱', name: '能源 ESG',  desc: '用電負載與碳排監控' },
  { path: '/da6',               icon: '👷', name: '人員工位',  desc: '工位派駐與產量追蹤' },
  { path: '/da7',               icon: '🔧', name: '模具壽命',  desc: '治具使用次數與保養管理' },
  { path: '/da8',               icon: '🏭', name: '射出成型機', desc: '製程參數、本班計數、異常紀錄' },
]

// 自動顯示目前頁面名稱
const currentPageLabel = computed(() => {
  const found = adminLinks.find(l => l.path === route.path)
  return found ? `${found.icon} ${found.name}` : '📊 監控戰情室'
})

// 點擊後關閉抽屜並跳轉
const navigate = (path) => {
  isOpen.value = false
  router.push(path)
}
</script>

<style scoped>
/* 浮動按鈕 */
.fab-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  background-color: #1e293b;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.35);
  transition: all 0.2s;
  font-weight: bold;
  font-size: 0.95rem;
}
.fab-btn:hover {
  background-color: #0f172a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.45);
}
.fab-icon { font-size: 1.1rem; }

/* 背景遮罩 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 1001;
  backdrop-filter: blur(2px);
}

/* 遮罩淡入淡出動畫 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 側邊抽屜 */
.drawer {
  position: fixed;
  top: 0;
  right: -340px;
  width: 320px;
  height: 100vh;
  background-color: #0f172a;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -4px 0 20px rgba(0,0,0,0.3);
}
.drawer.open { right: 0; }

/* 抽屜標題 */
.drawer-header {
  padding: 2rem 1.5rem 1.25rem;
  border-bottom: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.drawer-title { font-size: 1.1rem; font-weight: bold; color: white; }
.drawer-subtitle { font-size: 0.8rem; color: #64748b; }

/* 目前位置 */
.current-page {
  padding: 0.85rem 1.5rem;
  background-color: #1e293b;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.label-small { color: #475569; font-size: 0.75rem; }
.current-label { color: #22d3ee; font-weight: bold; font-size: 0.95rem; }

/* 導覽清單 */
.drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
}
.nav-section-title {
  padding: 0.5rem 1.5rem 0.75rem;
  font-size: 0.75rem;
  color: #475569;
  font-weight: bold;
  letter-spacing: 1px;
}
.drawer-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.15s;
  border-left: 3px solid transparent;
}
.drawer-item:hover { background-color: #1e293b; }
.drawer-item.active {
  background-color: #1e293b;
  border-left-color: #0ea5e9;
}
.item-icon { font-size: 1.2rem; width: 26px; text-align: center; }
.item-info { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
.item-name { color: white; font-weight: bold; font-size: 0.92rem; }
.item-desc { color: #64748b; font-size: 0.75rem; }
.item-arrow { color: #475569; font-size: 1.2rem; }
.item-active-dot { color: #0ea5e9; font-size: 0.8rem; }

/* 底部按鈕 */
.drawer-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #1e293b;
}
.return-btn {
  width: 100%;
  padding: 0.85rem;
  background-color: #166534;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.return-btn:hover { background-color: #15803d; }
</style>