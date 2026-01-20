import { createRouter, createWebHistory } from 'vue-router'
import TabLayout from '@/layouts/TabLayout.vue'
import { useAuth } from '@/composables/useAuth.js'

const routes = [
  {
    path: '/',
    redirect: '/main/home'
  },
  // 认证相关路由
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { 
      title: '登录 - NeuroFlex',
      requiresGuest: true // 只有未登录用户可以访问
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue'),
    meta: { 
      title: '注册 - NeuroFlex',
      requiresGuest: true // 只有未登录用户可以访问
    }
  },
  {
    path: '/main',
    component: TabLayout,
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/pages/Home.vue'),
        meta: { title: 'NeuroFlex  科学认知训练', depth: 1 }
      },
      {
        path: 'record',
        name: 'Record',
        component: () => import('@/pages/Record.vue'),
        meta: { 
          title: '训练记录', 
          depth: 1,
          requiresAuth: true // 需要登录才能访问
        }
      },
      {
        path: 'leaderboard',
        name: 'Leaderboard',
        component: () => import('@/pages/Leaderboard.vue'),
        meta: { title: '排行榜', depth: 1 }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/pages/Profile.vue'),
        meta: { 
          title: '个人中心', 
          depth: 1,
          requiresAuth: true // 需要登录才能访问
        }
      }
    ]
  },
  {
    path: '/schulte',
    name: 'Schulte',
    component: () => import('@/pages/games/Schulte.vue'),
    meta: { title: '舒尔特方格训练', depth: 2 }
  },
  {
    path: '/stroop',
    name: 'Stroop',
    component: () => import('@/pages/games/Stroop.vue'),
    meta: { title: 'Stroop 训练', depth: 2 }
  },
  {
    path: '/sequence',
    name: 'Sequence',
    component: () => import('@/pages/games/Sequence.vue'),
    meta: { title: '序列工作记忆', depth: 2 }
  },
  {
    path: '/audio',
    name: 'Audio',
    component: () => import('@/pages/games/Audio.vue'),
    meta: { title: '听觉选择性注意', depth: 2 }
  },
  {
    path: '/mirror',
    name: 'Mirror',
    component: () => import('@/pages/games/Mirror.vue'),
    meta: { title: '双侧肢体镜像协调', depth: 2 }
  },
  {
    path: '/categorize',
    name: 'Categorize',
    component: () => import('@/pages/games/Categorize.vue'),
    meta: { title: '规则导向分类', depth: 2 }
  },
  {
    path: '/memory-story',
    name: 'MemoryStory',
    component: () => import('@/pages/games/MemoryStory.vue'),
    meta: { title: '情景联想记忆', depth: 2 }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { title: '设置', depth: 2 }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫 - 认证检查和页面标题更新
router.beforeEach(async (to, from, next) => {
  // 更新页面标题
  document.title = to.meta.title || 'NeuroFlex'
  
  // 初始化认证服务（如果还没有初始化）
  const { initialize, isLoggedIn, isInitialized } = useAuth()
  
  try {
    if (!isInitialized.value) {
      await initialize()
    }
    
    // 检查是否只允许访客访问（如登录、注册页面）
    if (to.meta.requiresGuest && isLoggedIn.value) {
      // 已登录用户访问登录/注册页面，重定向到首页
      next({ name: 'Home' })
      return
    }
    
    // 对于需要认证的页面，不强制跳转，而是在页面内显示登录提示
    // 这样用户可以以游客身份浏览大部分内容
    next()
  } catch (error) {
    console.error('Router guard error:', error)
    // 如果认证初始化失败，允许访问但记录错误
    next()
  }
})

export default router
