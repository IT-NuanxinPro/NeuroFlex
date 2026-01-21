<template>
  <div class="neuroflex-logo" :class="{ compact, animated, [variant]: true }">
    <!-- 图标+文字组合 -->
    <div v-if="variant === 'horizontal' || variant === 'vertical'" class="logo-with-text">
      <div class="logo-icon" :style="{ width: iconSize + 'px', height: iconSize + 'px' }">
        <img :src="'/favicon.svg'" :width="iconSize - 8" :height="iconSize - 8" alt="NeuroFlex Logo" />
      </div>
      
      <h1 class="logo-title" :class="titleClass">{{ title }}</h1>
    </div>

    <!-- 纯图标版本 -->
    <div v-else-if="variant === 'icon'" class="logo-icon" :style="{ width: iconSize + 'px', height: iconSize + 'px' }">
      <img :src="'/favicon.svg'" :width="iconSize - 8" :height="iconSize - 8" alt="NeuroFlex Logo" />
    </div>

    <!-- 纯文字版本 -->
    <h1 v-else-if="variant === 'text'" class="logo-title" :class="titleClass">{{ title }}</h1>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'icon', // icon, horizontal, vertical, text
    validator: value => ['icon', 'horizontal', 'vertical', 'text'].includes(value)
  },
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: value => ['small', 'medium', 'large'].includes(value)
  },
  title: {
    type: String,
    default: 'NeuroFlex'
  },
  compact: {
    type: Boolean,
    default: false
  },
  titleClass: {
    type: String,
    default: ''
  },
  animated: {
    type: Boolean,
    default: true
  }
})

const iconSize = computed(() => {
  const sizes = {
    small: 32,
    medium: 48,
    large: 64
  }
  return sizes[props.size]
})

const logoHeight = computed(() => {
  const heights = {
    small: 32,
    medium: 48,
    large: 64
  }
  return heights[props.size]
})

const gradientId = computed(() => Math.random().toString(36).substring(2, 11))
</script>

<style lang="scss" scoped>
.neuroflex-logo {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  &.compact {
    gap: $spacing-sm;
  }

  // 不同变体的布局
  &.horizontal {
    .logo-with-text {
      display: flex;
      align-items: center;
      gap: $spacing-md;
    }
  }

  &.vertical {
    .logo-with-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: $spacing-sm;
    }
  }

  &.text {
    justify-content: center;
  }
}

.logo-with-text {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  .neuroflex-logo.compact & {
    gap: $spacing-sm;
  }
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    display: block;
  }
}

.logo-title {
  font-weight: $font-bold;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(123, 44, 191, 0.9));
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: 0.05em;
  font-size: $font-xl;
  position: relative;
  white-space: nowrap;

  .neuroflex-logo.compact & {
    font-size: $font-lg;
  }

  .neuroflex-logo.animated & {
    animation: gradientShift 6s ease-in-out infinite;
  }

  @media (max-width: $breakpoint-sm) {
    font-size: $font-lg;
    letter-spacing: 0.02em;
  }
}

// 响应式尺寸调整
.neuroflex-logo {
  // PC端侧边栏
  .side-nav & {
    .logo-icon {
      width: 40px;
      height: 40px;
    }
    
    .logo-title {
      font-size: $font-lg;
    }
  }

  // 移动端顶部导航
  .top-bar & {
    .logo-icon {
      width: 32px;
      height: 32px;
    }
    
    .logo-title {
      font-size: $font-base;
    }
  }

  // 页面头部
  .page-header & {
    .logo-icon {
      width: 48px;
      height: 48px;
    }
    
    .logo-title {
      font-size: $font-xl;
    }
  }

  // 登录页面
  .mobile-title-section &,
  .pc-title-section & {
    .logo-icon {
      width: 64px;
      height: 64px;
    }
    
    .logo-title {
      font-size: $font-2xl;
    }
  }
}

// 动画效果
.neuroflex-logo.animated {
  .logo-icon svg {
    animation: float 6s ease-in-out infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-2px);
  }
}
</style>
