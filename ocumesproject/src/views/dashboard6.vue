<template>
  <div class="dashboard-container">
    
    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-purple">人員工位與出勤監控</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">早班領班：林志明</div>
      </div>
    </header>

    <main class="main-content">
      
      <section class="summary-row">
        <div class="summary-card">
          <div class="sum-title">今日早班總人數</div>
          <div class="sum-value">42 <span class="sum-unit">人</span></div>
        </div>
        <div class="summary-card">
          <div class="sum-title">實際出勤</div>
          <div class="sum-value text-green">40 <span class="sum-unit">人</span></div>
        </div>
        <div class="summary-card">
          <div class="sum-title">請假 / 缺席</div>
          <div class="sum-value text-red">2 <span class="sum-unit">人</span></div>
        </div>
        <div class="summary-card">
          <div class="sum-title">跨線支援</div>
          <div class="sum-value text-blue">3 <span class="sum-unit">人</span></div>
        </div>
        <div class="summary-card highlight-card">
          <div class="sum-title text-white">整體人力稼動率</div>
          <div class="sum-value text-white">95.2 <span class="sum-unit">%</span></div>
        </div>
      </section>

      <section class="station-grid">
        
        <div class="card station-card" v-for="station in stations" :key="station.id" :class="{ 'alert-pulse': station.status === '缺料呼叫' }">
          
          <div class="card-header dark flex-between">
            <span class="station-name">{{ station.id }} - {{ station.name }}</span>
            <span :class="['status-badge', getStatusColor(station.status)]">
              {{ station.status }}
            </span>
          </div>

          <div class="operator-info">
            <div class="avatar" :class="station.operator ? 'bg-cyan' : 'bg-gray'">
              {{ station.operator ? station.operator.charAt(0) : '?' }}
            </div>
            <div class="operator-details">
              <div class="op-name">{{ station.operator || '無人派駐' }}</div>
              <div class="op-emp-id" v-if="station.empId">工號: {{ station.empId }}</div>
              <div class="op-skill" v-if="station.skill">
                技能考核：<span class="stars">{{ '★'.repeat(station.skill) }}{{ '☆'.repeat(5 - station.skill) }}</span>
              </div>
            </div>
          </div>

          <div class="performance-section" v-if="station.operator">
            <div class="perf-row">
              <span class="perf-label">當前工單</span>
              <span class="perf-value font-mono">{{ station.currentOrder }}</span>
            </div>
            <div class="perf-row">
              <span class="perf-label">直通良率</span>
              <span class="perf-value text-green font-bold">{{ station.yield }}%</span>
            </div>
            
            <div class="perf-progress-area">
              <div class="flex-between text-sm mb-1">
                <span>產量進度</span>
                <span>{{ station.actual }} / {{ station.target }} pcs</span>
              </div>
              <div class="progress-container">
                <div class="progress-bar" 
                     :class="getProgressBarColor(station.actual, station.target)"
                     :style="{ width: (station.actual / station.target * 100) + '%' }">
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" v-else>
            <p>目前無安排人員於此工位</p>
            <button class="btn-assign">派駐支援人員</button>
          </div>

        </div>

      </section>
    </main>
    <NavDrawer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import NavDrawer from '@/components/NavDrawer.vue'
// --- 時鐘邏輯 ---
const currentTime = ref('');
let timer = null;
let mockDataTimer = null;

const updateTime = () => {
  const now = new Date();
  const dateObj = now.toISOString().split('T')[0];
  const timeObj = now.toTimeString().split(' ')[0];
  currentTime.value = `${dateObj} ${timeObj}`;
};

// --- 工位與人員模擬資料 ---
// skill 代表熟練度 1~5 星
const stations = ref([
  { id: 'WS-01', name: '前段組裝', status: '正常作業', operator: '李大華', empId: 'EMP-1021', skill: 5, currentOrder: 'WO-260420', target: 500, actual: 480, yield: 99.5 },
  { id: 'WS-02', name: '馬達校正', status: '正常作業', operator: '張維哲', empId: 'EMP-1145', skill: 4, currentOrder: 'WO-260420', target: 500, actual: 420, yield: 98.2 },
  { id: 'WS-03', name: '機殼鎖固', status: '缺料呼叫', operator: '王建民', empId: 'EMP-0899', skill: 3, currentOrder: 'WO-260420', target: 500, actual: 310, yield: 100.0 },
  { id: 'WS-04', name: '外觀檢驗', status: '正常作業', operator: '陳靜宜', empId: 'EMP-1302', skill: 5, currentOrder: 'WO-260420', target: 500, actual: 450, yield: 97.8 },
  { id: 'WS-05', name: '包裝出貨', status: '正常作業', operator: '林宥嘉', empId: 'EMP-1455', skill: 2, currentOrder: 'WO-260420', target: 500, actual: 200, yield: 99.9 },
  { id: 'WS-06', name: '重工維修', status: '閒置中', operator: '', empId: '', skill: 0, currentOrder: '', target: 0, actual: 0, yield: 0 },
]);

// --- 狀態顏色判斷 ---
const getStatusColor = (status) => {
  const colors = {
    '正常作業': 'bg-green',
    '缺料呼叫': 'bg-red',
    '閒置中': 'bg-gray'
  };
  return colors[status] || 'bg-gray';
};

const getProgressBarColor = (actual, target) => {
  const percent = actual / target;
  if (percent >= 0.9) return 'bg-green';
  if (percent >= 0.6) return 'bg-blue';
  return 'bg-yellow';
};

// --- 純前端模擬產量增加 ---
const simulateProduction = () => {
  stations.value.forEach(station => {
    if (station.status === '正常作業' && station.actual < station.target) {
      // 依據熟練度(skill)決定生產速度的機率
      const boost = Math.random() < (station.skill * 0.2) ? 2 : 0; 
      station.actual += Math.floor(Math.random() * 3) + boost;
      if (station.actual > station.target) station.actual = station.target;
    }
  });
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  mockDataTimer = setInterval(simulateProduction, 2000); // 每2秒模擬產出增加
});

onUnmounted(() => {
  clearInterval(timer);
  clearInterval(mockDataTimer);
});
</script>

<style scoped>
/* 基礎設定 */
.dashboard-container {
  min-height: 100vh;
  background-color: #475569;
  color: #1e293b;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
}

/* 頂部導覽列 */
.header {
  background-color: #0f172a;
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 10;
}
.header-left { display: flex; align-items: center; gap: 1rem; }
.title { font-size: 1.5rem; font-weight: bold; }
.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white;}
.bg-purple { background-color: #8b5cf6; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; margin-top: 0.2rem; }

/* 主要內容區 */
.main-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

/* 頂部 Summary 區塊 */
.summary-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
}
@media (max-width: 1024px) { .summary-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }

.summary-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  text-align: center;
  border-bottom: 4px solid #cbd5e1;
}
.summary-card:nth-child(2) { border-bottom-color: #10b981; }
.summary-card:nth-child(3) { border-bottom-color: #ef4444; }
.highlight-card {
  background-color: #3b82f6; /* 藍色突顯塊 */
  border-bottom-color: #1d4ed8;
}
.sum-title { font-size: 0.9rem; color: #64748b; font-weight: bold; margin-bottom: 0.5rem; }
.sum-value { font-size: 2.5rem; font-weight: bold; line-height: 1; }
.sum-unit { font-size: 1rem; font-weight: normal; color: #94a3b8; }

/* 主要網格 (工位卡片) */
.station-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* 單一工位卡片 */
.card { background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; }
.card-header { padding: 0.75rem 1.25rem; font-weight: bold; font-size: 1.1rem; }
.card-header.dark { background-color: #1e293b; color: white; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }

/* 狀態標籤 */
.status-badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; color: white; font-weight: bold; }
.bg-green { background-color: #10b981; }
.bg-red { background-color: #ef4444; }
.bg-gray { background-color: #94a3b8; }
.bg-blue { background-color: #3b82f6; }
.bg-yellow { background-color: #f59e0b; }
.bg-cyan { background-color: #06b6d4; }

/* 作業員資訊區塊 */
.operator-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  background-color: #f8fafc;
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}
.operator-details { display: flex; flex-direction: column; gap: 0.2rem; }
.op-name { font-size: 1.1rem; font-weight: bold; color: #0f172a; }
.op-emp-id { font-size: 0.8rem; color: #64748b; font-family: monospace; }
.op-skill { font-size: 0.85rem; color: #475569; }
.stars { color: #f59e0b; letter-spacing: 2px; }

/* 生產績效區塊 */
.performance-section { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
.perf-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; }
.perf-label { color: #475569; }
.perf-value { font-weight: bold; color: #1e293b; }

.perf-progress-area { margin-top: 0.5rem; }
.progress-container { width: 100%; height: 0.75rem; background-color: #e2e8f0; border-radius: 999px; overflow: hidden; }
.progress-bar { height: 100%; transition: width 0.5s ease-out; }

/* 空狀態 (閒置工位) */
.empty-state { padding: 2rem 1.25rem; text-align: center; color: #94a3b8; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 1rem; }
.btn-assign { padding: 0.5rem 1rem; border: 1px dashed #cbd5e1; border-radius: 4px; background: transparent; color: #64748b; cursor: pointer; transition: all 0.2s; }
.btn-assign:hover { background-color: #f1f5f9; border-color: #94a3b8; color: #475569; }

/* 文字輔助 */
.text-green { color: #10b981; }
.text-red { color: #ef4444; }
.text-blue { color: #3b82f6; }
.text-white { color: white; }
.font-mono { font-family: monospace; }
.font-bold { font-weight: bold; }
.text-sm { font-size: 0.85rem; color: #64748b; }
.mb-1 { margin-bottom: 0.25rem; }

/* 安燈警報動畫 (邊框閃爍紅光) */
.alert-pulse {
  animation: border-pulse 1.5s infinite;
  border: 2px solid #ef4444;
}
@keyframes border-pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>