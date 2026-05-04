<template>
  <div class="dashboard-container">
    
    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-blue">生產報表</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">值班主管：王大明</div>
      </div>
    </header>

    <main class="main-content">
      
      <div class="card control-panel">
        
        <div class="filter-row border-bottom">
          <div class="btn-group">
            <button 
              v-for="tab in reportTabs" :key="tab"
              :class="['tab-btn', { active: activeTab === tab }]"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <div class="filter-row">
          <div class="machine-list">
            <button 
              v-for="machine in machines" :key="machine"
              :class="['machine-btn', { selected: selectedMachine === machine }]"
              @click="selectedMachine = machine"
            >
              {{ machine }}
            </button>
          </div>
        </div>

      </div>


      <div class="card table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>生產日期</th>
                <th>產品 QR Code</th>
                <th>CCD1<br>點火角度檢查</th>
                <th>CCD2<br>焊接檢查</th>
                <th>電焊開始時間點</th>
                <th>焊接檢查</th>
                <th>是否焊接檢查</th>
                <th>填充前空重(公克)</th>
                <th>是否ok</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in tableData" :key="index">
                <td class="text-gray">{{ row.date }}</td>
                <td class="font-mono text-dark">{{ row.qrCode }}</td>
                <td :class="row.ccd1 === 'ok' ? 'text-green' : 'text-red'">{{ row.ccd1 }}</td>
                <td :class="row.ccd2 === 'ok' ? 'text-green' : 'text-red'">{{ row.ccd2 }}</td>
                <td class="text-gray">{{ row.weldTime }}</td>
                <td :class="row.weldCheck === 'NG' ? 'text-red' : 'text-green'">{{ row.weldCheck }}</td>
                <td>{{ row.isWeldChecked }}</td>
                <td class="text-dark">{{ row.weight }}</td>
                <td>{{ row.isOk }}</td>
              </tr>
              <tr v-if="tableData.length === 1">
                <td colspan="9" class="no-data">-- 歷史資料載入中 --</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 系統時間
const currentTime = ref('');
let timer = null;

const updateTime = () => {
  const now = new Date();
  const dateObj = now.toISOString().split('T')[0];
  const timeObj = now.toTimeString().split(' ')[0];
  currentTime.value = `${dateObj} ${timeObj}`;
};

// 控制狀態
const reportTabs = ['即時資訊', '歷史資訊', '趨勢圖'];
const activeTab = ref('即時資訊');

const machines = [
  'ATD-101', 'ATD-102', 'ATD-103', 'ATD-104', 'ATD-105', 'ATD-106',
  'ATD-107', 'ATD-108', 'ATD-109', 'ATD-110', 'ATD-111', 'ATD-112'
];
const selectedMachine = ref('ATD-101');
const currentQrCode = ref('C2122324');

// 狀態燈號資料
const currentStatus = ref([
  { name: 'CDD1', isOk: true },
  { name: 'CDD2', isOk: true },
  { name: '雷焊-SR', isOk: true },
  { name: '焊道檢查', isOk: false },
  { name: '填充前秤', isOk: true },
]);

// 表格資料
const tableData = ref([
  {
    date: '2022/11/03 17:55:28',
    qrCode: 'C2122324',
    ccd1: 'ok',
    ccd2: 'ok',
    weldTime: '2022/11/03 17:55:28',
    weldCheck: 'NG',
    isWeldChecked: '',
    weight: '266.46',
    isOk: ''
  }
]);

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
/* 基礎戰情室背景與字型 */
.dashboard-container {
  min-height: 100vh;
  background-color: #475569; /* 深灰藍背景 */
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
.bg-blue { background-color: #3b82f6; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; margin-top: 0.2rem; }

/* 內容區佈局 (單欄) */
.main-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  overflow: hidden; /* 防止整頁滾動 */
}

/* 卡片共用樣式 */
.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

/* 區塊 1: 控制面板 */
.control-panel {
  display: flex;
  flex-direction: column;
}
.filter-row {
  padding: 1rem 1.5rem;
}
.border-bottom {
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc; /* 輕微區隔上半部 */
  border-radius: 0.5rem 0.5rem 0 0;
}

/* 報表類型按鈕 */
.btn-group {
  display: flex;
  gap: 0.5rem;
}
.tab-btn {
  padding: 0.5rem 1.5rem;
  background-color: #e2e8f0;
  border: none;
  border-radius: 4px;
  color: #475569;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover { background-color: #cbd5e1; }
.tab-btn.active {
  background-color: #1e293b;
  color: white;
}

/* 機台選擇列表 */
.machine-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.machine-btn {
  padding: 0.5rem 1.25rem;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 999px; /* 膠囊形狀，還原原圖 */
  color: #334155;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}
.machine-btn:hover { background-color: #e2e8f0; }
.machine-btn.selected {
  background-color: #0ea5e9; /* 亮藍色選中狀態 */
  color: white;
  border-color: #0ea5e9;
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
}

/* 區塊 2: 狀態燈號 (綠紅藥丸) */
.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.status-pill {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  color: white;
  font-size: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.pill-title { font-weight: normal; }
.pill-result { font-weight: bold; font-size: 1.1rem; }

.bg-green { background-color: #16a34a; }
.bg-red { background-color: #dc2626; }

/* 區塊 3: 表格 */
.table-card {
  flex: 1; /* 佔滿剩餘高度 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.table-wrapper {
  overflow: auto; /* 表格內容滾動 */
  flex: 1;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
}
.data-table th {
  background-color: #e2e8f0;
  padding: 1rem;
  color: #334155;
  font-size: 0.85rem;
  font-weight: bold;
  position: sticky;
  top: 0;
  border-bottom: 2px solid #cbd5e1;
  z-index: 1;
  line-height: 1.4;
}
.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
}
.data-table tbody tr:hover td { background-color: #f8fafc; }

/* 文字輔助樣式 */
.font-mono { font-family: monospace; font-size: 0.95rem; }
.text-gray { color: #64748b; }
.text-dark { color: #0f172a; font-weight: bold; }
.text-green { color: #16a34a; }
.text-red { color: #dc2626; }
.no-data { text-align: center; padding: 2rem !important; color: #94a3b8; }

/* 警示動畫 */
.pulse-anim { animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
</style>