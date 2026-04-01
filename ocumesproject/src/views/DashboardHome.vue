<template>
  <div class="row g-3 h-100" style="min-height: 0;">
    <!-- 左側：設備總覽 -->
    <div class="col-md-3 h-100">
      <div class="card h-100 p-3 shadow-sm border-0 rounded-3">
        <h5 class="fw-bold border-bottom pb-2">設備總覽</h5>
        
        <!-- 使用 v-for 迴圈產生機台列表 -->
        <!-- @click 綁定點擊事件，改變目前選中的機台 -->
        <!-- :class 動態判斷：如果被選中，就加上��色邊框跟灰底 -->
        <div 
          v-for="station in stations" 
          :key="station.id"
          class="station-item d-flex justify-content-between align-items-center p-2 rounded mb-2 border"
          :class="activeStationId === station.id ? 'border-primary bg-light border-2' : 'border-transparent'"
          @click="activeStationId = station.id"
        >
          <span class="fw-bold fs-5" :class="activeStationId === station.id ? 'text-primary' : 'text-secondary'">
            {{ station.id }}
          </span>
          <span class="badge" :class="station.statusClass">{{ station.status }}</span>
        </div>

      </div>
    </div>

    <!-- 中間：核心指標 (根據 activeStation 動態顯示) -->
    <div class="col-md-6 h-100">
      <div class="d-flex flex-column h-100 gap-3">
        <!-- 稼動率 -->
        <div class="card shadow-sm border-0 rounded-3" style="flex: 3;">
          <div class="bg-dark text-white p-2 text-center fw-bold rounded-top">
            {{ activeStation.id }} 設備稼動率
          </div>
          <div class="d-flex flex-column justify-content-center align-items-center h-100">
            <h5 class="text-muted fw-bold">整體設備稼動率 (OEE)</h5>
            <h1 class="display-1 fw-bold text-dark">
              {{ activeStation.oee }}<span class="fs-4 text-muted">%</span>
            </h1>
            <div class="progress mt-3 w-75" style="height: 20px;">
              <!-- 進度條長度與顏色動態綁定 -->
              <div 
                class="progress-bar progress-bar-striped progress-bar-animated" 
                :class="getOeeColor(activeStation.oee)"
                :style="{ width: activeStation.oee + '%' }"
              ></div>
            </div>
          </div>
        </div>
        <!-- 生產速度與良品率 -->
        <div class="d-flex gap-3" style="flex: 2;">
          <div class="card shadow-sm border-0 rounded-3 w-50 d-flex flex-column justify-content-center align-items-center">
            <h6 class="text-muted fw-bold">生產速度</h6>
            <h2 class="text-primary fw-bold">{{ activeStation.speed }} <small class="fs-6">pcs/min</small></h2>
          </div>
          <div class="card shadow-sm border-0 rounded-3 w-50 d-flex flex-column justify-content-center align-items-center">
            <h6 class="text-muted fw-bold">良品率</h6>
            <h2 class="text-success fw-bold">{{ activeStation.yieldRate }} <small class="fs-6">%</small></h2>
          </div>
        </div>
      </div>
    </div>

    <!-- 右側：即時動態 -->
    <div class="col-md-3 h-100">
      <div class="card h-100 shadow-sm border-0 rounded-3">
        <div class="bg-dark text-white p-2 text-center fw-bold rounded-top">即時動態</div>
        <div class="p-3">
          <div class="border-start border-3 ps-2 mb-3" :class="activeStation.oee < 50 ? 'border-danger' : 'border-info'">
            <small class="fw-bold" :class="activeStation.oee < 50 ? 'text-danger' : 'text-info'">最新狀態</small>
            <p class="mb-0 small">目前查看：{{ activeStation.id }}，狀態為{{ activeStation.status }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 1. 準備機台的假資料 (未來這些資料會從 Node-RED API 抓取)
const stations = ref([
  { id: 'ST-01', status: '運轉中', oee: 94.5, speed: 18.5, yieldRate: 99.8, statusClass: 'bg-success' },
  { id: 'ST-02', status: '待機中', oee: 45.0, speed: 0, yieldRate: 100, statusClass: 'bg-warning text-dark' },
  { id: 'ST-03', status: '異常', oee: 12.5, speed: 5.2, yieldRate: 85.4, statusClass: 'bg-danger' },
  { id: 'ST-04', status: '運轉中', oee: 88.0, speed: 15.0, yieldRate: 98.5, statusClass: 'bg-success' }
])

// 2. 紀錄目前被選中的機台 ID (預設選中 ST-01)
const activeStationId = ref('ST-01')

// 3. 自動計算出目前選中的「那一台」的完整資料
const activeStation = computed(() => {
  return stations.value.find(s => s.id === activeStationId.value)
})

// 4. 一個小函數：根據 OEE 數值決定進度條顏色
function getOeeColor(oee) {
  if (oee >= 85) return 'bg-success' // 綠色
  if (oee >= 50) return 'bg-warning' // 黃色
  return 'bg-danger'                 // 紅色
}
</script>

<style scoped>
/* 讓左邊的機台列表有滑鼠游標，並且有滑過變色的互動感 */
.station-item {
  cursor: pointer;
  transition: all 0.2s ease;
}
.station-item:hover {
  background-color: #f8f9fa;
  transform: translateX(5px);
}
.border-transparent {
  border-color: transparent !important;
}
</style>