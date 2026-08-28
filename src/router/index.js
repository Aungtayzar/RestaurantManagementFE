import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/auth/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'dashboard' },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardIndexView.vue'),
        },
        {
          path: 'branches',
          name: 'branches',
          component: () => import('@/views/branches/BranchesView.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'staff',
          name: 'staff',
          component: () => import('@/views/staff/StaffListView.vue'),
          meta: { roles: ['admin', 'manager'] },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.token) {
    return { name: 'login' }
  }

  if (to.meta.requiresGuest && auth.token) {
    return { name: 'dashboard' }
  }

  if (to.meta.roles?.length && !auth.user?.roles?.some((role) => to.meta.roles.includes(role))) {
    return { name: 'dashboard' }
  }
})

export default router
