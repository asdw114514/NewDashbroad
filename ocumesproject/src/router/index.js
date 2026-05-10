import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import DashboardHome from '../views/DashboardHome.vue'
import Warings from '../views/Warings.vue'
import ProductionReport from '../views/ProductionReport.vue'
import dashboard5 from '@/views/dashboard5.vue'
import dashboard6 from '@/views/dashboard6.vue'
import dashboard7 from '@/views/dashboard7.vue'
import dashboard8 from '@/views/dashboard8.vue'



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/dashboard',
      component: DashboardLayout,
      children: [
        { path: '', component: DashboardHome }
      ]
    },
    {
      path: '/warings',
      children: [
        { path: '', component: Warings }
      ]
    },
    {
      path: '/production-report',
      children: [
        { path: '', component: ProductionReport }
      ]
    },
    {
      path: '/da5',
      children: [
        { path: '', component: dashboard5 }
      ]
    },
    
    {
      path: '/da6',
      children: [
        { path: '', component:  dashboard6 }
      ]
    },
    {
      path: '/da7',
      children: [
        { path: '', component:  dashboard7 }
      ]
    },
    {
      path: '/da8',
      children: [
        { path: '', component: dashboard8 }
      ]
    },
    {
      path: '/',
      redirect: '/dashboard'
    }
  ]
})

export default router