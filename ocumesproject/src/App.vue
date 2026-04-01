<template>
  <!-- RouterView 是一個魔法切換區，它會根據網址自動載入我們的戰情室 -->
  <RouterView />
</template>

<style>
/* 放入我們戰情室的全域基礎設定 */
body {
  margin: 0;
  padding: 0;
  background-color: #e9ecef; /* 戰情室的底色 */
  font-family: 'Noto Sans TC', sans-serif;
}
</style>