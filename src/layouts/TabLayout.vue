<template>
  <div class="tab-layout">
    <!-- PC端顶部导航栏 -->
    <nav v-if="isPC" class="top-nav">
      <div class="nav-container">
        <NeuroFlexLogo />
        
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
        
        <!-- 移动端设置按钮 -->
        <button v-if="!isPC" class="settings-button" @click="goToSettings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m-6 0l-4.2 4.2"
            ></path>
          </svg>
        </button>
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
    <nav v-if="!isPC" class="bottom-nav">
      <router-link to="/main/home" class="nav-item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>首页</span>
      </router-link>

      <router-link to="/main/record" class="nav-item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>记录</span>
      </router-link>

      <router-link to="/main/leaderboard" class="nav-item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          />
        </svg>
        <span>排行榜</span>
      </router-link>

      <router-link to="/main/profile" class="nav-item">
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

const route = useRoute()
const router = useRouter()
const transitionName = ref('fade')
const isPC = ref(false)

function detectPC() {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
  
  // 如果不是移动设备，且屏幕宽度大于1024px，认为是PC
  isPC.value = !isMobile && !isTablet && window.innerWidth > 1024
}

function handleResize() {
  detectPC()
}

function goToSettings() {
  router.push('/settings')
}

onMounted(() => {
  detectPC()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Tab页面之间切换使用淡入淡出
watch(
  () => route.path,
  () => {
    transitionName.value = 'fade'
  }
)
</script>

<style lang="scss" scoped>
.tab-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-primary;
  
  // PC端添加顶部导航栏的padding
  &:has(.top-nav) {
    padding-top: 64px;
  }
}

.page-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 0; // 强制flex子元素正确计算高度
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

// PC端顶部导航栏
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: $z-fixed;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  .nav-container {
    width: 100%;
    padding: $spacing-md $spacing-2xl;
    display: flex;
    align-items: center;
    position: relative;
  }

  .nav-links {
    display: flex;
    gap: $spacing-lg;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .settings-button {
    @include button-reset;
    @include click-feedback;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;
    @include flex-center;
    transition: all $transition-base;
    margin-left: auto;

    svg {
      stroke-width: 2;
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-lg;
    border-radius: $radius-md;
    color: $text-secondary;
    text-decoration: none;
    transition: all $transition-base;
    font-weight: $font-medium;

    svg {
      stroke-width: 2;
      transition: all $transition-base;
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

    // 激活状态 - 只使用精确匹配
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

    // 悬停效果（仅桌面端）
    @media (hover: hover) and (pointer: fine) {
      &:hover:not(.router-link-exact-active) {
        color: rgba(0, 212, 255, 0.7);
        background: rgba(0, 212, 255, 0.05);

        svg {
          transform: translateY(-2px);
        }
      }
    }

    // 点击效果
    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
