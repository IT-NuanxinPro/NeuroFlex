<template>
  <div class="tab-layout keyboard-adaptive">
    <!-- PC端侧边导航栏 -->
    <nav v-if="isPCDevice" class="side-nav">
      <div class="nav-header">
        <NeuroFlexLogo variant="horizontal" size="medium" :animated="true" />
      </div>
      
      <div class="nav-links">
        <router-link to="/main/home" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>首页</span>
        </router-link>

        <router-link to="/main/record" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>训练记录</span>
        </router-link>

        <router-link to="/main/leaderboard" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            />
          </svg>
          <span>排行榜</span>
        </router-link>

        <router-link to="/main/profile" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>个人中心</span>
        </router-link>
      </div>
    </nav>

    <div class="page-content">
      <router-view v-slot="{ Component, route }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </div>

    <!-- 移动端底部导航栏 -->
    <nav v-if="!isPCDevice" class="bottom-nav" @click="handleNavClick">
      <router-link to="/main/home" class="nav-item" @click.native="forceNavigation('/main/home')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>首页</span>
      </router-link>

      <router-link to="/main/record" class="nav-item" @click.native="forceNavigation('/main/record')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>记录</span>
      </router-link>

      <router-link to="/main/leaderboard" class="nav-item" @click.native="forceNavigation('/main/leaderboard')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          />
        </svg>
        <span>排行榜</span>
      </router-link>

      <router-link to="/main/profile" class="nav-item" @click.native="forceNavigation('/main/profile')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NeuroFlexLogo from '@/components/NeuroFlexLogo.vue'
import { isPC } from '@/utils/device'

const route = useRoute()
const router = useRouter()
const transitionName = ref('fade')
const isPCDevice = ref(isPC())

function handleResize() {
  isPCDevice.value = isPC()
}

function goToSettings() {
  router.push('/settings')
}

// 强制导航（修复覆盖安装后的路由问题）
function forceNavigation(path) {
  console.log('🔄 强制导航到:', path)
  if (route.path !== path) {
    router.push(path).catch(err => {
      console.error('导航失败，尝试替换:', err)
      router.replace(path)
    })
  }
}

// 处理导航栏点击（调试用）
function handleNavClick(event) {
  console.log('🖱️ 导航栏点击事件:', event.target)
}

const navCheckTimer = ref(null)

onMounted(() => {
  isPCDevice.value = isPC()
  window.addEventListener('resize', handleResize)
  
  // 调试信息：检查标签栏点击事件
  console.log('🔍 TabLayout 挂载完成')
  console.log('  isPCDevice:', isPCDevice.value)
  console.log('  当前路由:', route.path)
  
  // 检测并修复覆盖安装后的点击事件问题
  navCheckTimer.value = setTimeout(() => {
    const navItems = document.querySelectorAll('.nav-item, .nav-link')
    console.log(`  找到 ${navItems.length} 个导航项`)
    
    // 为每个导航项添加备用点击事件
    navItems.forEach((item, index) => {
      const href = item.getAttribute('href') || item.getAttribute('to')
      console.log(`  导航项 ${index}: ${href}`)
      
      // 添加原生点击事件作为备用
      item.addEventListener('click', (e) => {
        console.log('🖱️ 导航项点击:', href)
        
        // 如果 router-link 失效，使用原生导航
        const checkTimer = setTimeout(() => {
          if (route.path !== href) {
            console.log('🔄 router-link 可能失效，使用强制导航')
            e.preventDefault()
            router.push(href).catch(() => {
              router.replace(href)
            })
          }
        }, 100)
        
        // 清理检查定时器
        setTimeout(() => clearTimeout(checkTimer), 200)
      }, true) // 使用捕获阶段确保事件触发
    })
    navCheckTimer.value = null
  }, 200)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 清理定时器
  if (navCheckTimer.value) {
    clearTimeout(navCheckTimer.value)
    navCheckTimer.value = null
  }
})

// Tab页面之间切换动画控制
watch(
  () => route.path,
  () => {
    // PC端不使用动画，移动端使用淡入淡出
    transitionName.value = isPCDevice.value ? 'none' : 'fade'
  }
)
</script>

<style lang="scss" scoped>
.tab-layout {
  height: 100vh;
  display: flex;
  background: $bg-primary;
  overflow: hidden;
  
  // PC端使用侧边导航布局
  @media (min-width: $breakpoint-lg) {
    flex-direction: row;
  }
  
  // 移动端使用垂直布局
  @media (max-width: 1023px) {
    flex-direction: column;
  }
}

.page-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

// Tab页面之间的淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// PC端侧边导航栏
.side-nav {
  width: 240px;
  flex-shrink: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  z-index: $z-fixed;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);

  .nav-header {
    padding: $spacing-xl $spacing-lg;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-links {
    flex: 1;
    padding: $spacing-lg 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    overflow-y: auto;
    @include custom-scrollbar;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    margin: 0 $spacing-sm;
    border-radius: $radius-md;
    color: $text-secondary;
    text-decoration: none;
    transition: all $transition-base;
    font-weight: $font-medium;
    font-size: $font-base;

    svg {
      stroke-width: 2;
      transition: all $transition-base;
      flex-shrink: 0;
    }

    span {
      flex: 1;
    }

    &.router-link-exact-active {
      color: $accent-primary;
      background: rgba(0, 212, 255, 0.1);

      svg {
        filter: drop-shadow(0 0 6px rgba(0, 212, 255, 0.6));
      }
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(.router-link-exact-active) {
        color: rgba(0, 212, 255, 0.8);
        background: rgba(0, 212, 255, 0.05);
        transform: translateX(4px);
      }
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: $spacing-sm $spacing-lg;
  padding-bottom: calc($spacing-sm + env(safe-area-inset-bottom));
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  z-index: $z-fixed;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  
  // 防止虚拟键盘推动导航栏
  @include mobile {
    // 确保导航栏始终固定在底部，不受键盘影响
    bottom: 0 !important;
    
    // 键盘弹出时保持位置
    @supports (bottom: env(keyboard-inset-height)) {
      bottom: 0 !important;
    }
    
    // iOS Safari 特殊处理
    @supports (-webkit-appearance: none) {
      padding-bottom: calc($spacing-sm + env(safe-area-inset-bottom));
    }
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-xs;
    border-radius: $radius-md;
    color: $text-secondary;
    text-decoration: none;
    transition: all $transition-base;
    position: relative;
    flex: 1;
    max-width: 80px;

    @include mobile {
      padding: $spacing-sm 4px;
      max-width: 70px;
    }

    svg {
      width: 24px;
      height: 24px;
      stroke-width: 2;
      transition: all $transition-base;
    }

    span {
      font-size: $font-xs;
      font-weight: $font-medium;
      transition: all $transition-base;
    }

    &.router-link-exact-active {
      color: $accent-primary;

      svg {
        transform: translateY(-2px);
        filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.6));
      }

      span {
        font-weight: $font-semibold;
      }
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(.router-link-exact-active) {
        color: rgba(0, 212, 255, 0.7);
        background: rgba(0, 212, 255, 0.05);

        svg {
          transform: translateY(-2px);
        }
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
