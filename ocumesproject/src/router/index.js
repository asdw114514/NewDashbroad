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
import AdminAsset from '@/views/AdminAsset.vue'
import AdminScheduling from '@/views/AdminScheduling.vue'
import AdminWip from '@/views/AdminWip.vue'
import AdminQuality from '@/views/AdminQuality.vue'
import AdminMaterial from '@/views/AdminMaterial.vue'
import AdminSystem from '@/views/AdminSystem.vue'
import AdminPersonnel from '@/views/AdminPersonnel.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/dashboard',
      component: DashboardLayout,
      children: [{ path: '', component: DashboardHome }]
    },
    { path: '/warings',           component: Warings },
    { path: '/production-report', component: ProductionReport },
    { path: '/da5',               component: dashboard5 },
    { path: '/da6',               component: dashboard6 },
    { path: '/da7',               component: dashboard7 },
    { path: '/da8',               component: dashboard8 },
    { path: '/admin',             component: AdminHome },
    { path: '/admin/asset',       component: AdminAsset },
    { path: '/admin/scheduling',  component: AdminScheduling },
    { path: '/admin/wip',         component: AdminWip },
    { path: '/admin/quality',     component: AdminQuality },
    { path: '/admin/material',    component: AdminMaterial },
    { path: '/admin/system',      component: AdminSystem },
    { path: '/admin/personnel',   component: AdminPersonnel },
    { path: '/', redirect: '/dashboard' }
  ]
})

export default router