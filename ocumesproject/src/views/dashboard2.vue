<template>
  <div class="dashboard-container">
    
    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-red">異常日誌查詢模式</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">值班主管：王大明</div>
      </div>
    </header>

    <main class="main-layout">
      
      <aside class="left-sidebar">
        
        <div class="tab-group mb-1-5">
          <button 
            :class="['tab-btn', { active: activeTab === 'PLC' }]"
            @click="activeTab = 'PLC'"
          >PLC 訊息</button>
          <button 
            :class="['tab-btn', { active: activeTab === 'PC' }]"
            @click="activeTab = 'PC'"
          >PC 訊息</button>
        </div>

        <div class="card h-full-sidebar">
          <div class="card-header dark">🔍 查詢過濾條件</div>
          <div class="card-body filter-section">
            
            <div class="form-group">
              <label>機台編號</label>
              <input type="text" v-model="searchQuery.machineId" class="form-input" placeholder="例如: WM045D">
            </div>

            <div class="form-group">
              <label>關鍵字搜尋</label>
              <input type="text" v-model="searchQuery.keyword" class="form-input" placeholder="輸入錯誤碼或關鍵字">
            </div>

            <div class="form-group">
              <label>開始時間</label>
              <input type="datetime-local" v-model="searchQuery.startTime" class="form-input">
            </div>

            <div class="form-group">
              <label>結束時間</label>
              <input type="datetime-local" v-model="searchQuery.endTime" class="form-input">
            </div>

            <div class="action-buttons">
              <button class="btn btn-primary w-full" @click="handleSearch">執行查詢</button>
              <button class="btn btn-outline w-full" @click="handleExport">匯出 CSV</button>
            </div>
          </div>
        </div>
      </aside>

      <section class="center-focus">
        <div class="card h-full">
          <div class="card-header dark flex-between">
            <span>📋 {{ activeTab }} 異常訊息清單</span>
            <span class="result-count">共找到 {{ filteredLogs.length }} 筆記錄</span>
          </div>
          
          <div class="card-body p-0 table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th width="15%">機台名稱</th>
                  <th width="20%">發生時間</th>
                  <th width="20%">Station (站點)</th>
                  <th width="10%">類型</th>
                  <th width="35%">詳細訊息 (Message)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in filteredLogs" :key="log.id" class="table-row">
                  <td class="font-bold text-dark">{{ log.machine }}</td>
                  <td class="text-gray">{{ log.time }}</td>
                  <td>{{ log.station }}</td>
                  <td>
                    <span :class="['type-badge', log.type === 'ERROR' ? 'bg-red' : 'bg-blue']">
                      {{ log.type }}
                    </span>
                  </td>
                  <td class="message-cell">{{ log.message }}</td>
                </tr>
                <tr v-if="filteredLogs.length === 0">
                  <td colspan="5" class="no-data">✅ 查無符合條件的異常訊息</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 處理時鐘
const currentTime = ref('');
let timer = null;

const updateTime = () => {
  const now = new Date();
  const dateObj = now.toISOString().split('T')[0];
  const timeObj = now.toTimeString().split(' ')[0];
  currentTime.value = `${dateObj} ${timeObj}`;
};

// 狀態管理
const activeTab = ref('PC');
const searchQuery = ref({
  machineId: '',
  keyword: '',
  startTime: '',
  endTime: ''
});

// 模擬資料庫
const allLogs = ref([
  { id: 1, tab: 'PC', machine: 'WM045D', time: '2022/11/03 17:55:28', station: 'WM045D_Station', type: 'ERROR', message: '[2022/11/03 17:55:28][error][WM045D_Station][14] Data timeout occurred.' },
  { id: 2, tab: 'PC', machine: 'WM045D', time: '2022/11/03 17:55:28', station: 'WM045D_Station', type: 'info', message: 'System state check passed.' },
  { id: 3, tab: 'PC', machine: 'ATD-101', time: '2026/04/20 14:01:42', station: 'ATD_Main', type: 'ERROR', message: 'Motor Speed Overlimit Warning.' },
  { id: 4, tab: 'PLC', machine: 'ATD-101', time: '2026/04/20 13:40:00', station: 'PLC_Node_1', type: 'info', message: 'Register D1024 synced.' },
  { id: 5, tab: 'PLC', machine: 'ST-03', time: '2026/04/20 10:15:00', station: 'PLC_Node_3', type: 'ERROR', message: 'Emergency Stop Triggered.' }
]);

// 即時過濾邏輯
const filteredLogs = computed(() => {
  return allLogs.value.filter(log => {
    const matchTab = log.tab === activeTab.value;
    const matchMachine = searchQuery.value.machineId ? log.machine.includes(searchQuery.value.machineId) : true;
    const matchKeyword = searchQuery.value.keyword ? log.message.toLowerCase().includes(searchQuery.value.keyword.toLowerCase()) : true;
    return matchTab && matchMachine && matchKeyword;
  });
});

const handleSearch = () => {
  console.log('查詢條件送出:', searchQuery.value);
};

const handleExport = () => {
  alert('匯出 CSV 功能開發中...');
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
/* 基礎變數與重置 (延續戰情室風格) */
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
.bg-red { background-color: #ef4444; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; margin-top: 0.2rem; }

/* 核心佈局 (左側過濾 300px，右側自適應 1fr) */
.main-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  flex: 1; /* 填滿剩餘高度 */
  overflow: hidden; /* 防止整個畫面滾動 */
}

@media (max-width: 1024px) {
  .main-layout { grid-template-columns: 1fr; overflow: auto; }
}

/* 卡片共用樣式 */
.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.h-full { height: 100%; max-height: calc(100vh - 120px); }
.h-full-sidebar { height: calc(100% - 3rem); }
.mb-1-5 { margin-bottom: 1.5rem; }
.p-0 { padding: 0; }

.card-header {
  padding: 1rem 1.5rem;
  font-weight: bold;
  border-bottom: 1px solid #e5e7eb;
}
.card-header.dark {
  background-color: #1e293b;
  color: white;
  border-bottom: none;
}
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.result-count { font-size: 0.875rem; color: #94a3b8; font-weight: normal; }

/* 左側：頁籤與過濾器 */
.tab-group {
  display: flex;
  background-color: #334155;
  border-radius: 0.5rem;
  overflow: hidden;
}
.tab-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.active {
  background-color: #0ea5e9; /* 亮藍色 */
  color: white;
}

.filter-section {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
  overflow-y: auto;
}
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.875rem; font-weight: bold; color: #475569; }
.form-input {
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: #0ea5e9; outline: none; }

.action-buttons { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.btn { padding: 0.75rem; border-radius: 4px; font-weight: bold; cursor: pointer; border: none; font-size: 0.95rem; }
.w-full { width: 100%; }
.btn-primary { background-color: #0ea5e9; color: white; }
.btn-primary:hover { background-color: #0284c7; }
.btn-outline { background-color: transparent; border: 1px solid #cbd5e1; color: #475569; }
.btn-outline:hover { background-color: #f1f5f9; }

/* 右側：資料表設計 */
.table-wrapper {
  overflow-y: auto; /* 表格內容滾動 */
  flex: 1;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.data-table th {
  background-color: #f8fafc;
  padding: 1rem 1.5rem;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: bold;
  position: sticky;
  top: 0;
  border-bottom: 2px solid #e2e8f0;
  z-index: 1;
}
.data-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
  font-size: 0.95rem;
}
.table-row:hover td { background-color: #f8fafc; }

/* 表格內文字與標籤排版 */
.font-bold { font-weight: bold; }
.text-dark { color: #0f172a; }
.text-gray { color: #64748b; font-family: monospace; }
.message-cell { font-family: monospace; color: #334155; line-height: 1.4; word-break: break-all;}
.no-data { text-align: center; padding: 3rem !important; color: #94a3b8; font-size: 1.1rem; }

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
  font-weight: bold;
  letter-spacing: 0.5px;
}
.bg-blue { background-color: #3b82f6; }
</style>