import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import DashboardHome from '../views/DashboardHome.vue'
import Dashboard2 from '../views/dashboard2.vue'
import dashboard3 from '../views/dashboard3.vue'
import dashboard4 from '@/views/dashboard4.vue'
import dashboard5 from '@/views/dashboard5.vue'

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
      path: '/da2',
      children: [
        { path: '', component: Dashboard2 }
      ]
    },
    {
      path: '/da3',
      children: [
        { path: '', component: dashboard3 }
      ]
    },
    {
      path: '/da4',
      children: [
        { path: '', component: dashboard4 }
      ]
    },
    {
      path: '/da5',
      children: [
        { path: '', component: dashboard5 }
      ]
    },
    {
      path: '/',
      redirect: '/dashboard'
    }
  ]
})

export default router