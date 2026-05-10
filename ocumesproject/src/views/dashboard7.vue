<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-orange">治具與模具壽命監控</span>
      </div>
      <div class="header-right"><div class="time">{{ currentTime }}</div></div>
    </header>

    <main class="main-content">
      <div class="stat-row">
        <div class="stat-box">總在線模具 <span>24</span></div>
        <div class="stat-box text-orange">預警中 (壽命 < 10%) <span>3</span></div>
        <div class="stat-box text-red">需立即更換 <span>1</span></div>
      </div>

      <div class="tooling-grid">
        <div class="card" v-for="tool in toolings" :key="tool.id" :class="{'alert-border': getHealth(tool) < 5}">
          <div class="card-header dark flex-between">
            <span>{{ tool.id }} - {{ tool.name }}</span>
            <span class="status-badge" :class="getHealthColor(getHealth(tool))">
              剩餘 {{ getHealth(tool).toFixed(1) }}%
            </span>
          </div>
          <div class="card-body padding-1-5">
            <div class="info-row">
              <span class="label">掛載機台：</span>
              <span class="value font-mono">{{ tool.machine }}</span>
            </div>
            <div class="info-row">
              <span class="label">累積使用次數：</span>
              <span class="value font-bold">{{ tool.currentUses.toLocaleString() }} / {{ tool.maxLife.toLocaleString() }} 次</span>
            </div>
            
            <div class="life-bar-container">
              <div class="life-bar striped-bg" 
                   :style="{ width: getHealth(tool) + '%', backgroundColor: getHealthBarColor(getHealth(tool)) }">
              </div>
            </div>
            
            <div class="action-row">
              <span class="last-maint">上次保養: {{ tool.lastMaint }}</span>
              <button class="btn-maint" v-if="getHealth(tool) < 15" @click="resetTool(tool)">✅ 執行換線保養</button>
            </div>
          </div>
        </div>
      </div>
    </main>
    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import NavDrawer from '@/components/NavDrawer.vue'

const currentTime = ref('');
let timer = null;
let mockTimer = null;

const updateTime = () => {
  const now = new Date();
  currentTime.value = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
};

// 模具資料庫
const toolings = ref([
  { id: 'MOLD-A01', name: '上蓋射出模具', machine: 'ATD-101', currentUses: 48500, maxLife: 50000, lastMaint: '2026/03/15' },
  { id: 'MOLD-B02', name: '底座沖壓模', machine: 'ATD-104', currentUses: 98000, maxLife: 100000, lastMaint: '2026/02/10' },
  { id: 'TOOL-C11', name: '精密銑刀(鎢鋼)', machine: 'CNC-004', currentUses: 1980, maxLife: 2000, lastMaint: '2026/04/18' },
  { id: 'MOLD-A05', name: '側板射出模具', machine: 'ATD-102', currentUses: 12000, maxLife: 50000, lastMaint: '2026/04/01' },
]);

const getHealth = (tool) => Math.max(0, ((tool.maxLife - tool.currentUses) / tool.maxLife) * 100);

const getHealthColor = (health) => {
  if (health > 20) return 'bg-green';
  if (health > 5) return 'bg-orange';
  return 'bg-red pulse';
};

const getHealthBarColor = (health) => {
  if (health > 20) return '#10b981'; // 綠
  if (health > 5) return '#f97316'; // 橘
  return '#ef4444'; // 紅
};

// 模擬機台運作，模具壽命持續消耗
const simulateUsage = () => {
  toolings.value.forEach(tool => {
    if (tool.currentUses < tool.maxLife) {
      tool.currentUses += Math.floor(Math.random() * 10) + 1; // 隨機增加使用次數
    }
  });
};

// 一鍵重置保養
const resetTool = (tool) => {
  tool.currentUses = 0;
  tool.lastMaint = new Date().toISOString().split('T')[0].replace(/-/g, '/');
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  mockTimer = setInterval(simulateUsage, 1500);
});
onUnmounted(() => { clearInterval(timer); clearInterval(mockTimer); });
</script>

<style scoped>
/* 共用背景與 header 樣式略 (與之前戰情室風格完全相同) */
.dashboard-container { min-height: 100vh; background-color: #475569; color: #1e293b; font-family: sans-serif; display: flex; flex-direction: column; }
.header { background-color: #0f172a; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white;}
.bg-orange { background-color: #f97316; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }

.main-content { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; gap: 1.5rem; }

/* 頂部統計 */
.stat-row { display: flex; gap: 1rem; }
.stat-box { background: white; padding: 1rem 1.5rem; border-radius: 8px; flex: 1; font-weight: bold; display: flex; justify-content: space-between; font-size: 1.1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.stat-box span { font-size: 1.5rem; font-family: monospace; }
.text-orange { color: #f97316; }
.text-red { color: #ef4444; }

/* 網格 */
.tooling-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
.card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.card-header { padding: 1rem; font-weight: bold; font-size: 1.1rem; }
.card-header.dark { background-color: #1e293b; color: white; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.padding-1-5 { padding: 1.5rem; }

.info-row { margin-bottom: 0.75rem; display: flex; justify-content: space-between; }
.label { color: #64748b; }
.value { color: #0f172a; }
.font-mono { font-family: monospace; font-weight: bold; color: #2563eb; }
.font-bold { font-weight: bold; }

/* 壽命進度條 */
.life-bar-container { width: 100%; height: 1.2rem; background-color: #e2e8f0; border-radius: 999px; overflow: hidden; margin: 1rem 0; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); }
.life-bar { height: 100%; transition: width 0.3s linear, background-color 0.5s ease; }
.striped-bg { background-image: linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent); background-size: 1rem 1rem; }

.action-row { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; font-size: 0.85rem; color: #94a3b8; }
.btn-maint { background: #10b981; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-weight: bold; cursor: pointer; }

.status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.bg-green { background-color: #10b981; }
.alert-border { border: 2px solid #ef4444; animation: alert 1.5s infinite; }
@keyframes alert { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); } 100% { box-shadow: 0 0 0 10px rgba(239,68,68,0); } }
</style>