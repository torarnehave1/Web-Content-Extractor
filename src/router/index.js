import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/ContentExtractor.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // Load user from storage if not already loaded
  if (!userStore.loggedIn) {
    userStore.loadFromStorage()
  }

  // Check if route requires auth
  if (to.meta.requiresAuth && !userStore.loggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.loggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
