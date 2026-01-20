<template>
  <div class="leaderboard-page">
    <!-- 移动端标题栏 -->
    <header v-if="!isPCDevice" class="page-header">
      <h1 class="page-title">排行榜</h1>
    </header>

    <div class="coming-soon-container" :class="{ 'pc-layout': isPCDevice }">
      <div class="coming-soon-card">
        <div class="icon-wrapper">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            />
          </svg>
        </div>

        <h2 class="title">排行榜</h2>
        <p class="subtitle">敬请期待</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { isPC } from '@/utils/device'

// 检测是否为PC端
const isPCDevice = ref(isPC())

function handleResize() {
  isPCDevice.value = isPC()
}

onMounted(() => {
  isPCDevice.value = isPC()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.leaderboard-page {
  height: 100%; // 填满父容器
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  overflow: hidden; // 防止滚动条
}

.page-header {
  @include safe-area-padding(top);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .page-title {
    font-size: $font-xl;
    font-weight: $font-semibold;
    margin: 0;
    text-align: center;
  }
}

.coming-soon-container {
  flex: 1; // 填充剩余空间
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-lg;
  padding-bottom: calc($spacing-lg + 70px + env(safe-area-inset-bottom));
  overflow: hidden;
  min-height: 0; // 重要：让flex子元素可以收缩
  
  // PC端布局调整
  &.pc-layout {
    padding: $spacing-lg;
  }
}

.coming-soon-card {
  @include glass-card;
  padding: $spacing-2xl;
  max-width: 400px;
  width: 100%;
  text-align: center;
  max-height: 100%;
  overflow-y: auto;
  @include custom-scrollbar;

  @include mobile {
    padding: $spacing-xl;
  }

  .icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto $spacing-lg;
    border-radius: $radius-full;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 44, 191, 0.1));
    border: 2px solid rgba(0, 212, 255, 0.3);
    @include flex-center;

    @include mobile {
      width: 64px;
      height: 64px;
      margin-bottom: $spacing-md;
    }

    svg {
      color: $accent-primary;
      stroke-width: 1.5;
      filter: drop-shadow(0 4px 8px rgba(0, 212, 255, 0.4));
    }
  }

  .title {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $text-primary;
    margin-bottom: $spacing-sm;

    @include mobile {
      font-size: $font-xl;
    }
  }

  .subtitle {
    font-size: $font-lg;
    color: $accent-primary;
    margin-bottom: 0;
    font-weight: $font-medium;

    @include mobile {
      font-size: $font-base;
    }
  }
}
</style>
