import { createRouter, createWebHistory } from 'vue-router'
import TabLayout from '@/layouts/TabLayout.vue'

const routes = [
  {
    path: '/',
    redirect: '/main/home'
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
        meta: { title: '训练记录', depth: 1 }
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
        meta: { title: '个人中心', depth: 1 }
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

// 路由守卫 - 更新页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'NeuroFlex'
  next()
})

export default router
