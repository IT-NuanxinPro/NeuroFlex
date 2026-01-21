<template>
  <div id="app" class="app-container">
    <router-view v-slot="{ Component, route }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="getRouteKey(route)" />
      </transition>
    </router-view>

    <!-- 版本更新弹窗 -->
    <UpdateDialog
      :show="showUpdateDialog"
      :current-version="currentVersion"
      :latest-version="latestVersion"
      :update-info="updateInfo"
      @close="showUpdateDialog = false"
      @update="handleUpdate"
      @later="handleLater"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isPC } from '@/utils/device'
import { useVersionCheck } from '@/composables/useVersionCheck'
import UpdateDialog from '@/components/UpdateDialog.vue'

const router = useRouter()
const route = useRoute()
const transitionName = ref('none')

// 版本检测
const { currentVersion, latestVersion, hasUpdate, updateInfo, checkForUpdates } = useVersionCheck()
const showUpdateDialog = ref(false)

// 获取路由key，对于/main下的路由使用固定key以避免TabLayout重新渲染
function getRouteKey(route) {
  if (route.path.startsWith('/main')) {
    return '/main'
  }
  return route.path
}

// 处理版本更新
function handleUpdate() {
  showUpdateDialog.value = false
  // 跳转到下载页面
  window.open('/download', '_blank')
}

function handleLater() {
  showUpdateDialog.value = false
  // 可以设置一个延迟，比如24小时后再提醒
  localStorage.setItem('updateRemindLater', Date.now().toString())
}

// 监听版本更新
watch(hasUpdate, (newValue) => {
  if (newValue) {
    // 检查是否设置了稍后提醒
    const remindLater = localStorage.getItem('updateRemindLater')
    if (remindLater) {
      const lastRemind = parseInt(remindLater)
      const now = Date.now()
      // 如果距离上次提醒不到24小时，不显示弹窗
      if (now - lastRemind < 24 * 60 * 60 * 1000) {
        return
      }
    }
    
    // 延迟显示更新弹窗，避免与页面加载冲突
    setTimeout(() => {
      showUpdateDialog.value = true
    }, 2000)
  }
})

// 监听路由变化，根据depth判断动画方向
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 如果两个路由都在 /main 下（Tab页面之间切换），不使用动画（由TabLayout处理）
    if (newPath.startsWith('/main') && oldPath.startsWith('/main')) {
      transitionName.value = 'none'
      return
    }

    // PC端不使用滑动动画
    if (isPC()) {
      transitionName.value = 'fade'
      return
    }

    const newRoute = router.resolve(newPath)
    const oldRoute = router.resolve(oldPath)

    const newDepth = newRoute.meta?.depth
    const oldDepth = oldRoute.meta?.depth

    // 如果是首次加载（没有oldPath），不使用动画
    if (!oldPath || oldPath === '/') {
      transitionName.value = 'none'
      return
    }

    // 如果两个路由都有depth
    if (newDepth && oldDepth) {
      if (oldDepth < newDepth) {
        // 进入更深层级：从右滑入
        transitionName.value = 'slide-left'
      } else if (oldDepth > newDepth) {
        // 返回上层：从左滑入
        transitionName.value = 'slide-right'
      } else {
        // 同级切换：淡入淡出
        transitionName.value = 'fade'
      }
    } else {
      // 没有depth信息：淡入淡出
      transitionName.value = 'fade'
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 移除加载屏幕
  const loadingScreen = document.querySelector('.loading-screen')
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.opacity = '0'
      setTimeout(() => loadingScreen.remove(), 300)
    }, 500)
  }
})
</script>

<style lang="scss" scoped>
.app-container {
  @include min-viewport-height(dynamic);
  width: 100%;
  max-width: 100vw;
  background-color: var(--bg-primary);
  position: relative;
  overflow-x: hidden;
  
  // 移动端优化
  @include mobile {
    // 确保在移动端使用动态视口高度
    @include min-viewport-height(small);
  }
}

// 从右滑入（进入子页面）
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30%);
}

// 从左滑入（返回上级）
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30%);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

// 淡入淡出（同级页面）
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 无动画（首次加载）
.none-enter-active,
.none-leave-active {
  transition: none;
}
</style>
