import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import DashboardHome from '../views/DashboardHome.vue'
import Warings from '../views/Warings.vue'
import ProductionReport from '../views/ProductionReport.vue'
import dashboard5 from '@/views/dashboard5.vue'
import dashboard6 from '@/views/dashboard6.vue'
import dashboard7 from '@/views/dashboard7.vue'
import dashboard8 from '@/views/dashboard8.vue'
import AdminHome from '@/views/AdminHome.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 監控戰情室
    {
      path: '/dashboard',
      component: DashboardLayout,
      children: [
        { path: '', component: DashboardHome }
      ]
    },

    // 後台功能（對應 NavDrawer 路徑）
    { path: '/admin/alerts',    component: Warings },
    { path: '/admin/reports',   component: ProductionReport },
    { path: '/admin/esg',       component: dashboard5 },
    { path: '/admin/workforce', component: dashboard6 },
    { path: '/admin/tooling',   component: dashboard7 },
    { path: '/admin/injection', component: dashboard8 },
    { path: '/admin', component: AdminHome },
    // { path: '/admin/scheduling', component: AdminScheduling },

    // 舊路徑相容（避免直接輸入舊網址壞掉）
    { path: '/warings',           redirect: '/admin/alerts' },
    { path: '/production-report', redirect: '/admin/reports' },
    { path: '/da5', redirect: '/admin/esg' },
    { path: '/da6', redirect: '/admin/workforce' },
    { path: '/da7', redirect: '/admin/tooling' },
    { path: '/da8', redirect: '/admin/injection' },

    // 預設跳轉
    { path: '/', redirect: '/dashboard' }
  ]
})

export default router