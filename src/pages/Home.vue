<template>
  <div class="home-page">
    <!-- 移动端顶部栏 -->
    <header v-if="!isPC" class="top-bar">
      <NeuroFlexLogo />
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
    <main class="training-grid-container" :class="{ 'pc-layout': isPC }">
      <div ref="gridRef" class="training-grid">
        <div
          v-for="module in trainingModules"
          :key="module.id"
          class="training-card"
          @click="goToModule(module.route)"
        >
          <div class="card-icon" v-html="module.icon"></div>
          <h3 class="card-title">{{ module.title }}</h3>
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

const router = useRouter()
const gridRef = ref(null)

// 检测是否为PC端
const isPC = ref(false)

function detectPC() {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
  
  isPC.value = !isMobile && !isTablet && window.innerWidth > 1024
  console.log('Home - isPC:', isPC.value, 'width:', window.innerWidth)
}

function handleResize() {
  detectPC()
}

onMounted(() => {
  detectPC()
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
    icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
  },
  {
    id: 'stroop',
    title: 'Stroop 训练',
    description: '增强认知控制和多任务处理能力',
    route: '/stroop',
    icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
  },
  {
    id: 'sequence',
    title: '序列记忆',
    description: '提高工作记忆容量和信息编码能力',
    route: '/sequence',
    icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
  },
  {
    id: 'audio',
    title: '听觉注意',
    description: '增强抗干扰能力和听觉信息识别',
    route: '/audio',
    icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'
  },
  {
    id: 'mirror',
    title: '镜像协调',
    description: '提升左右脑配合和运动协调能力',
    route: '/mirror',
    icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>'
  },
  {
    id: 'categorize',
    title: '规则分类',
    description: '优化逻辑思维和快速决策能力',
    route: '/categorize',
    icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
  },
  {
    id: 'memory-story',
    title: '情景记忆',
    description: '增强记忆联想和语义整合能力',
    route: '/memory-story',
    icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
  }
]

// 导航方法
function goToModule(route) {
  router.push(route)
}

function goToSettings() {
  router.push('/settings')
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.home-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, $bg-primary 0%, $bg-secondary 100%);
  overflow: hidden;
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
  transition: all $transition-base;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media (min-width: 1200px) {
    padding: $spacing-2xl;
  }

  // 只在桌面端启用 hover 效果，移动端禁用以提升性能
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 212, 255, 0.2);
      border-color: rgba(0, 212, 255, 0.3);
    }
  }

  .card-icon {
    width: 48px;
    height: 48px;
    margin-bottom: $spacing-lg;
    border-radius: $radius-md;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 44, 191, 0.1));
    border: 1px solid rgba(0, 212, 255, 0.2);
    @include flex-center;

    @media (min-width: 1200px) {
      width: 56px;
      height: 56px;
    }

    svg {
      color: $accent-primary;
      filter: drop-shadow(0 2px 4px rgba(0, 212, 255, 0.3));
    }
  }

  .card-title {
    font-size: $font-lg;
    font-weight: $font-bold;
    color: $text-primary;
    margin-bottom: $spacing-sm;
    text-align: left;
    width: 100%;

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
    transition: all $transition-base;

    // 只在桌面端启用 hover 效果
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
      }
    }
  }
}
</style>
