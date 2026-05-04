<template>
  <div class="dashboard-container">
    
    <header class="header">
      <div class="header-left">
        <span class="title">🏭 兆豐工業 - 智慧製造戰情室</span>
        <span class="badge bg-blue">生產報表 - 趨勢圖分析 (CDN版)</span>
      </div>
      <div class="header-right">
        <div class="time">{{ currentTime }}</div>
        <div class="supervisor">值班主管：王大明</div>
      </div>
    </header>

    <main class="main-content">
      
      <div class="card control-panel">
        
        <div class="filter-row border-bottom flex-between">
          <div class="btn-group">
            <button 
              v-for="tab in reportTabs" :key="tab"
              :class="['tab-btn', { active: activeTab === tab }]"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>
          
          <div class="time-range-group" v-if="activeTab === '趨勢圖'">
            <button class="time-btn active">近 1 小時</button>
            <button class="time-btn">近 4 小時</button>
            <button class="time-btn">近 24 小時</button>
          </div>
        </div>

        <div class="filter-row">
          <div class="machine-list">
            <button 
              v-for="machine in machines" :key="machine"
              :class="['machine-btn', { selected: selectedMachine === machine }]"
              @click="switchMachine(machine)"
            >
              {{ machine }}
            </button>
          </div>
        </div>
      </div>

      <div class="card chart-card" v-show="activeTab === '趨勢圖'">
        <div class="chart-header">
          <span class="chart-title">📈 {{ selectedMachine }} - 關鍵製程參數走勢 (填充空重 vs 焊接溫度)</span>
          <div class="chart-legend-custom">
            <span class="legend-item"><span class="dot color-cyan"></span> 填充前空重 (g)</span>
            <span class="legend-item"><span class="dot color-orange"></span> 焊接溫度 (°C)</span>
          </div>
        </div>
        
        <div class="chart-body">
          <div ref="chartRef" class="echarts-container"></div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

// ❌ 已經移除原本的 import echarts 語法，改用 CDN 全域變數

// --- 系統時間 (保持不變) ---
const currentTime = ref('');
let timeTimer = null;
const updateTime = () => {
  const now = new Date();
  const dateObj = now.toISOString().split('T')[0];
  const timeObj = now.toTimeString().split(' ')[0];
  currentTime.value = `${dateObj} ${timeObj}`;
};

// --- 狀態管理 (保持不變) ---
const reportTabs = ['即時資訊', '歷史資訊', '趨勢圖'];
const activeTab = ref('趨勢圖'); 
const machines = ['ATD-101', 'ATD-102', 'ATD-103', 'ATD-104', 'ATD-105', 'ATD-106'];
const selectedMachine = ref('ATD-101');

// --- ECharts 圖表實體與參考 ---
const chartRef = ref(null);
let myChart = null;

// 生成模擬數據 (保持不變)
const generateMockData = () => {
  let baseTime = new Date('2026-04-20T13:00:00').getTime();
  const timeData = [];
  const weightData = [];
  const tempData = [];
  for (let i = 0; i < 60; i++) {
    const timeStr = new Date(baseTime).toLocaleTimeString('zh-TW', { hour12: false });
    timeData.push(timeStr);
    weightData.push((266 + Math.random() * 2 - 1).toFixed(2));
    let temp = 120 + Math.random() * 5;
    if (i === 45) temp = 145; // 故意製造一個異常高峰
    tempData.push(temp.toFixed(1));
    baseTime += 60000;
  }
  return { timeData, weightData, tempData };
};

// 1. 初始化圖表 (修改點：加上 window.)
const initChart = () => {
  if (!chartRef.value) return;
  
  // ✅ 檢查全域變數是否存在，防止 CDN 載入失敗時報錯
  if (typeof window.echarts === 'undefined') {
    console.error('ECharts CDN 載入失敗，請檢查 index.html 設定。');
    return;
  }
  
  // ✅ 改用 window.echarts.init
  myChart = window.echarts.init(chartRef.value); 
  updateChartData();
  
  // 監聽視窗縮放
  window.addEventListener('resize', () => {
    myChart && myChart.resize();
  });
};

// 更新圖表設定與資料 (修改點：加上 window.)
const updateChartData = () => {
  const data = generateMockData();

  const option = {
    // (圖表視覺設定保留，與之前一致)
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      axisPointer: { type: 'cross', label: { backgroundColor: '#334155' } }
    },
    grid: { top: '10%', left: '3%', right: '3%', bottom: '12%', containLabel: true },
    yAxis: [
      {
        type: 'value',
        name: '重量 (g)',
        nameTextStyle: { color: '#64748b' },
        min: 260,
        max: 270,
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } }
      },
      {
        type: 'value',
        name: '溫度 (°C)',
        nameTextStyle: { color: '#64748b' },
        min: 100,
        max: 160,
        axisLabel: { color: '#64748b' },
        splitLine: { show: false }
      }
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.timeData,
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#cbd5e1' } }
    },
    dataZoom: [
      { type: 'slider', show: true, start: 0, end: 100, bottom: '2%', borderColor: '#cbd5e1', textStyle: { color: '#64748b' } }
    ],
    series: [
      {
        name: '填充前空重',
        type: 'line',
        yAxisIndex: 0,
        data: data.weightData,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: '#0ea5e9' }, // Cyan
        areaStyle: {
          // ✅ 這裡的漸層設定也需要改用 window.echarts
          color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(14, 165, 233, 0.3)' },
            { offset: 1, color: 'rgba(14, 165, 233, 0.05)' }
          ])
        }
      },
      {
        name: '焊接溫度',
        type: 'line',
        yAxisIndex: 1,
        data: data.tempData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#f97316' }, // Orange
        itemStyle: { color: '#f97316' },
        markLine: {
          symbol: ['none', 'none'],
          label: { formatter: '警戒值 140°C', position: 'insideStartTop', color: '#ef4444' },
          lineStyle: { color: '#ef4444', type: 'solid', width: 2 },
          data: [{ yAxis: 140 }]
        }
      }
    ]
  };

  myChart.setOption(option);
};

// 切換機台 (保持不變)
const switchMachine = (machine) => {
  selectedMachine.value = machine;
  if (activeTab.value === '趨勢圖' && myChart) {
    myChart.showLoading({ text: '資料讀取中...', color: '#0ea5e9', textColor: '#64748b', maskColor: 'rgba(255, 255, 255, 0.8)' });
    setTimeout(() => {
      updateChartData();
      myChart.hideLoading();
    }, 500);
  }
};

onMounted(() => {
  updateTime();
  timeTimer = setInterval(updateTime, 1000);
  nextTick(() => {
    initChart(); // 確保 DOM 渲染後初始化
  });
});

onUnmounted(() => {
  clearInterval(timeTimer);
  if (myChart) {
    window.removeEventListener('resize', myChart.resize);
    myChart.dispose(); // 銷毀圖表實體，釋放記憶體
  }
});
</script>

<style scoped>
/* 基礎戰情室背景與字型 (與之前完全一致，純 CSS) */
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
.badge.bg-blue { background-color: #3b82f6; }
.header-right { text-align: right; }
.time { color: #22d3ee; font-family: monospace; font-size: 1.25rem; }
.supervisor { font-size: 0.875rem; color: #9ca3af; margin-top: 0.2rem; }

/* 內容區佈局 */
.main-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  overflow: hidden;
}

/* 卡片共用樣式 */
.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

/* 區塊 1: 控制面板 */
.control-panel { display: flex; flex-direction: column; }
.filter-row { padding: 1rem 1.5rem; }
.border-bottom {
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
  border-radius: 0.5rem 0.5rem 0 0;
}
.flex-between { display: flex; justify-content: space-between; align-items: center; }

/* 按鈕群組 */
.btn-group { display: flex; gap: 0.5rem; }
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
.tab-btn.active { background-color: #1e293b; color: white; }

/* 快速時間篩選按鈕 */
.time-range-group { display: flex; gap: 0.5rem; }
.time-btn {
  padding: 0.4rem 1rem;
  background: transparent;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  color: #64748b;
  font-size: 0.85rem;
  cursor: pointer;
}
.time-btn.active { border-color: #0ea5e9; color: #0ea5e9; font-weight: bold; background-color: #f0f9ff; }

/* 機台選擇列表 */
.machine-list { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.machine-btn {
  padding: 0.5rem 1.25rem;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  color: #334155;
  font-weight: bold;
  cursor: pointer;
}
.machine-btn.selected {
  background-color: #0ea5e9;
  color: white;
  border-color: #0ea5e9;
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
}

/* 區塊 2: 趨勢圖表區塊 */
.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 450px; 
}
.chart-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}
.chart-title { font-weight: bold; font-size: 1.1rem; color: #1e293b; }

/* 自訂圖例 */
.chart-legend-custom { display: flex; gap: 1rem; }
.legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #64748b; font-weight: bold; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.color-cyan { background-color: #0ea5e9; }
.color-orange { background-color: #f97316; }

/* ECharts 容器 */
.chart-body { flex: 1; padding: 1rem; position: relative; }
.echarts-container { width: 100%; height: 100%; min-height: 350px; }
</style>