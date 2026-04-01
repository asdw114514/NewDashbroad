<template>
  <div class="dashboard-wrapper">
    <!-- 戰情室頂部標題列 -->
    <header class="bg-dark text-white p-3 d-flex justify-content-between align-items-center shadow-sm">
      <h3 class="m-0 fw-bold">🏭 兆豐工業 - 智慧製造戰情室</h3>
      <div class="text-end">
        <div class="fs-5 fw-bold text-info">2023-10-25 14:30:00</div>
        <small class="text-light">值班主管：王大明</small>
      </div>
    </header>

    <!-- 這裡會自動載入 DashboardHome.vue 的內容 -->
    <main class="p-3 dashboard-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dashboard-content {
  flex-grow: 1;
  overflow: hidden;
}
</style>