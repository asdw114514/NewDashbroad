<template>
  <div class="dashboard-wrapper">
    <!-- 戰情室頂部標題列 -->
    <header class="bg-dark text-white p-3 d-flex justify-content-between align-items-center shadow-sm">
      <h3 class="m-0 fw-bold">🏭 承揚工業 - Dashboard</h3>
      <div class="text-end">
        <div class="fs-5 fw-bold text-info">{{ currentTime }}</div>
        <small class="text-light">值班主管：盧承揚</small>
      </div>
    </header>

    <!-- 這裡會自動載入 DashboardHome.vue 的內容 -->
    <main class="p-3 dashboard-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
    const currentTime = ref('');
    let timeTimer = null;
  const updateTime = () => {
    const now = new Date();
    const dateObj = now.toISOString().split('T')[0];
    const timeObj = now.toTimeString().split(' ')[0];
    currentTime.value = `${dateObj} ${timeObj}`;
  };
  onMounted(() => {
    updateTime();
    timeTimer = setInterval(updateTime, 1000);
  });

  onUnmounted(() => {
    clearInterval(timeTimer);

  });
</script>

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