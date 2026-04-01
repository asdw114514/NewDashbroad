import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import DashboardHome from '../views/DashboardHome.vue'

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
      path: '/',
      redirect: '/dashboard'
    }
  ]
})

export default router