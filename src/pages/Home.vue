<template>
  <div class="home-page">
    <!-- 移动端顶部栏 -->
    <header v-if="!isPCDevice" class="top-bar">
      <NeuroFlexLogo variant="horizontal" size="medium" :animated="true" />
      <div class="user-actions">
        <button class="icon-button" aria-label="设置" @click="goToSettings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m-6 0l-4.2 4.2"
            ></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- 训练模块网格 -->
    <main class="training-grid-container" :class="{ 'pc-layout': isPCDevice }">
      <div class="training-grid">
        <div
          v-for="module in trainingModules"
          :key="module.id"
          class="training-card"
          @click="goToModule(module.route)"
        >
          <div class="card-header">
            <div class="card-icon">
              <component :is="module.icon" />
            </div>
            <h3 class="card-title">{{ module.title }}</h3>
          </div>
          <p class="card-description">{{ module.description }}</p>
          <button class="enter-button">开始训练</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NeuroFlexLogo from '@/components/NeuroFlexLogo.vue'
import { isPC } from '@/utils/device'
import {
  SchulteIcon,
  StroopIcon,
  SequenceIcon,
  AudioIcon,
  MirrorIcon,
  CategorizeIcon,
  MemoryStoryIcon
} from '@/components/icons'

const router = useRouter()

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

// 训练模块数据
const trainingModules = [
  {
    id: 'schulte',
    title: '舒尔特方格',
    description: '提升视觉搜索和注意力，实现一目十行',
    route: '/schulte',
    icon: SchulteIcon
  },
  {
    id: 'stroop',
    title: 'Stroop 训练',
    description: '增强认知控制和多任务处理能力',
    route: '/stroop',
    icon: StroopIcon
  },
  {
    id: 'sequence',
    title: '序列记忆',
    description: '提高工作记忆容量和信息编码能力',
    route: '/sequence',
    icon: SequenceIcon
  },
  {
    id: 'audio',
    title: '听觉注意',
    description: '增强抗干扰能力和听觉信息识别',
    route: '/audio',
    icon: AudioIcon
  },
  {
    id: 'mirror',
    title: '镜像协调',
    description: '提升左右脑配合和运动协调能力',
    route: '/mirror',
    icon: MirrorIcon
  },
  {
    id: 'categorize',
    title: '规则分类',
    description: '优化逻辑思维和快速决策能力',
    route: '/categorize',
    icon: CategorizeIcon
  },
  {
    id: 'memory-story',
    title: '情景记忆',
    description: '增强记忆联想和语义整合能力',
    route: '/memory-story',
    icon: MemoryStoryIcon
  }
]

// 导航方法
function goToModule(route) {
  console.log('点击卡片，准备跳转到:', route)
  try {
    router.push(route)
    console.log('路由跳转已触发')
  } catch (error) {
    console.error('路由跳转失败:', error)
  }
}

function goToSettings() {
  console.log('点击设置按钮')
  router.push('/settings')
}
</script>

<style lang="scss" scoped>
@use "sass:color";

.home-page {
  height: 100%; // 填满父容器
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, $bg-primary 0%, $bg-secondary 100%);
  overflow: hidden; // 防止滚动条
}

.top-bar {
  @include safe-area-padding(top);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: $spacing-lg;
  padding-right: $spacing-lg;
  padding-bottom: $spacing-md;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .icon-button {
    @include button-reset;
    @include click-feedback;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;
    @include flex-center;
    transition: background $transition-base;

    // 只在桌面端启用 hover 效果
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

.training-grid-container {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-xl $spacing-lg;
  padding-bottom: calc($spacing-xl + 70px + env(safe-area-inset-bottom));
  @include custom-scrollbar;
  min-height: 0;
  
  // PC端布局调整
  &.pc-layout {
    padding: $spacing-2xl $spacing-lg;
  }
}

.training-grid {
  display: grid;
  gap: $spacing-md;
  max-width: 1800px;
  margin: 0 auto;
  grid-template-columns: 1fr;
  width: 100%;

  // 小屏手机：1列
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  // 平板：3列
  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  // PC：4列
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-xl;
  }
}

.training-card {
  @include glass-card;
  @include click-feedback;
  padding: $spacing-xl;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); // 更丝滑的缓动函数
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  overflow: hidden;

  @include mobile {
    padding: $spacing-lg;
  }

  @media (min-width: 1200px) {
    padding: $spacing-2xl;
  }
  
  // 添加光晕效果
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: width 0.6s ease, height 0.6s ease;
    pointer-events: none;
    z-index: 0;
  }

  // 只在桌面端启用 hover 效果，移动端禁用以提升性能
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 16px 40px rgba(0, 212, 255, 0.25);
      border-color: rgba(0, 212, 255, 0.4);
      
      &::before {
        width: 300px;
        height: 300px;
      }
      
      .card-icon {
        transform: scale(1.1) rotate(5deg);
      }
      
      .enter-button {
        background: linear-gradient(135deg, $accent-primary, color.adjust($accent-primary, $lightness: 10%));
        transform: translateX(4px);
      }
    }
  }
  
  // 移动端点击效果
  @include mobile {
    &:active {
      transform: scale(0.98);
    }
  }
  
  // CSS原生入场动画
  animation: cardFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
  
  // 为每个卡片设置不同的延迟，实现依次出现效果
  @for $i from 1 through 7 {
    &:nth-child(#{$i}) {
      animation-delay: #{($i - 1) * 0.08}s; // 每个卡片间隔80ms
    }
  }
}

  // 标题和图标一行布局
  .card-header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
    margin-bottom: $spacing-md;
    position: relative;
    z-index: 1; // 确保在光晕之上
    
    @include mobile {
      gap: $spacing-sm;
      margin-bottom: $spacing-sm;
    }
  }

  .card-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: $radius-md;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 44, 191, 0.1));
    border: 1px solid rgba(0, 212, 255, 0.2);
    @include flex-center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); // 丝滑的过渡

    @include mobile {
      width: 40px;
      height: 40px;
    }

    @media (min-width: 1200px) {
      width: 56px;
      height: 56px;
    }

    svg {
      color: $accent-primary;
      filter: drop-shadow(0 2px 4px rgba(0, 212, 255, 0.3));
      transition: filter 0.4s ease;
      
      @include mobile {
        width: 24px;
        height: 24px;
      }
    }
  }

  .card-title {
    font-size: $font-lg;
    font-weight: $font-bold;
    color: $text-primary;
    margin: 0;
    text-align: left;
    flex: 1;
    line-height: 1.2;
    position: relative;
    z-index: 1; // 确保在光晕之上

    @include mobile {
      font-size: $font-base;
    }

    @media (min-width: 1200px) {
      font-size: $font-xl;
    }
  }

  .card-description {
    font-size: $font-sm;
    color: $text-secondary;
    margin-bottom: $spacing-lg;
    line-height: 1.6;
    text-align: left;
    flex: 1;
    position: relative;
    z-index: 1; // 确保在光晕之上

    @include mobile {
      font-size: $font-xs;
      margin-bottom: $spacing-md;
      line-height: 1.5;
    }

    @media (min-width: 1200px) {
      font-size: $font-base;
    }
  }

  .enter-button {
    @include button-reset;
    width: 100%;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;
    font-weight: $font-semibold;
    font-size: $font-base;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); // 丝滑的过渡
    position: relative;
    z-index: 1;

    @include mobile {
      padding: $spacing-sm $spacing-md;
      font-size: $font-sm;
    }

    // 只在桌面端启用 hover 效果
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
      }
    }
  }

// 卡片入场动画关键帧
@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
