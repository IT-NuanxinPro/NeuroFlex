<template>
  <div class="tab-layout">
    <div class="page-content">
      <router-view v-slot="{ Component, route }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </div>

    <nav class="bottom-nav">
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
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const transitionName = ref('fade')

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
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-md;
    color: $text-secondary;
    text-decoration: none;
    transition: all $transition-base;
    position: relative;
    min-width: 70px;

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
