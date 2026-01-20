<template>
  <div class="mobile-test-page">
    <div class="test-header mobile-safe-area">
      <h1>移动端适配测试</h1>
      <p>测试视口高度和按钮适配</p>
    </div>

    <div class="test-content">
      <div class="viewport-info">
        <h3>视口信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">宽度:</span>
            <span class="value">{{ viewportInfo.width }}px</span>
          </div>
          <div class="info-item">
            <span class="label">高度:</span>
            <span class="value">{{ viewportInfo.height }}px</span>
          </div>
          <div class="info-item">
            <span class="label">设备:</span>
            <span class="value">{{ deviceType }}</span>
          </div>
          <div class="info-item">
            <span class="label">浏览器:</span>
            <span class="value">{{ browserType }}</span>
          </div>
        </div>
      </div>

      <div class="button-tests">
        <h3>按钮测试</h3>
        
        <div class="test-section">
          <h4>游戏结果按钮测试</h4>
          <div class="mobile-button-group">
            <button class="action-button secondary button mobile-touch-target long-text">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              <span>再试一次</span>
            </button>
            <button class="action-button primary button mobile-touch-target long-text">
              <span>返回首页</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div class="test-section">
          <h4>长文字按钮测试</h4>
          <div class="mobile-button-group">
            <button class="action-button secondary button mobile-touch-target long-text">
              <span>这是一个很长的按钮文字测试</span>
            </button>
            <button class="action-button primary button mobile-touch-target long-text">
              <span>返回到主页面继续游戏</span>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-tests">
        <h3>模态框测试</h3>
        <button class="test-button" @click="showGameResult = true">
          显示游戏结果
        </button>
        <button class="test-button" @click="showModal = true">
          显示普通模态框
        </button>
      </div>
    </div>

    <!-- 游戏结果测试 -->
    <GameResult
      :visible="showGameResult"
      type="success"
      title="恭喜完成！"
      subtitle="你的反应速度很棒"
      :stats="[
        { label: '用时', value: '5.2s', highlight: true },
        { label: '准确率', value: '95%' },
        { label: '得分', value: '850', highlight: true },
        { label: '排名', value: 'Top 10%' }
      ]"
      :show-retry="true"
      close-text="返回首页"
      @close="showGameResult = false"
      @retry="handleRetry"
    />

    <!-- 普通模态框测试 -->
    <Modal
      v-model:visible="showModal"
      title="测试模态框"
      confirm-text="确定"
      cancel-text="取消"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    >
      <p>这是一个测试模态框，用于验证移动端适配效果。</p>
      <p>请检查按钮是否正常显示，文字是否会换行。</p>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getViewportInfo } from '@/utils/viewport'
import GameResult from './GameResult.vue'
import Modal from './Modal.vue'

const showGameResult = ref(false)
const showModal = ref(false)
const viewportInfo = ref({
  width: 0,
  height: 0,
  isMobile: false,
  isIOS: false,
  isAndroid: false,
  isWeChat: false
})

const deviceType = computed(() => {
  const info = viewportInfo.value
  if (info.isIOS) return 'iOS'
  if (info.isAndroid) return 'Android'
  if (info.isMobile) return '移动设备'
  return '桌面设备'
})

const browserType = computed(() => {
  const info = viewportInfo.value
  if (info.isWeChat) return '微信浏览器'
  
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('chrome')) return 'Chrome'
  if (userAgent.includes('safari')) return 'Safari'
  if (userAgent.includes('firefox')) return 'Firefox'
  if (userAgent.includes('edge')) return 'Edge'
  return '其他浏览器'
})

function updateViewportInfo() {
  viewportInfo.value = getViewportInfo()
}

function handleRetry() {
  showGameResult.value = false
  console.log('重试游戏')
}

function handleConfirm() {
  console.log('确认')
}

function handleCancel() {
  console.log('取消')
}

onMounted(() => {
  updateViewportInfo()
  window.addEventListener('resize', updateViewportInfo)
  window.addEventListener('orientationchange', updateViewportInfo)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportInfo)
  window.removeEventListener('orientationchange', updateViewportInfo)
})
</script>

<style lang="scss" scoped>
.mobile-test-page {
  @include min-viewport-height(dynamic);
  background: $bg-primary;
  color: $text-primary;
  
  @include mobile {
    @include min-viewport-height(small);
  }
}

.test-header {
  padding: $spacing-xl $spacing-lg;
  text-align: center;
  background: linear-gradient(135deg, $bg-secondary, $bg-tertiary);
  
  h1 {
    font-size: $font-3xl;
    margin-bottom: $spacing-sm;
    
    @include mobile {
      font-size: $font-2xl;
    }
  }
  
  p {
    color: $text-secondary;
    margin: 0;
  }
}

.test-content {
  padding: $spacing-lg;
  max-width: 800px;
  margin: 0 auto;
  
  @include mobile {
    padding: $spacing-md;
  }
}

.viewport-info {
  margin-bottom: $spacing-2xl;
  
  h3 {
    margin-bottom: $spacing-lg;
    color: $accent-primary;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  
  @include mobile {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: $spacing-md;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-md;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  .label {
    color: $text-secondary;
    font-weight: $font-medium;
  }
  
  .value {
    color: $text-primary;
    font-weight: $font-semibold;
  }
}

.button-tests, .modal-tests {
  margin-bottom: $spacing-2xl;
  
  h3 {
    margin-bottom: $spacing-lg;
    color: $accent-primary;
  }
  
  h4 {
    margin-bottom: $spacing-md;
    color: $text-secondary;
    font-size: $font-base;
  }
}

.test-section {
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.action-button {
  @include button-reset;
  @include mobile-button;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-lg $spacing-xl;
  border-radius: $radius-md;
  font-size: $font-base;
  font-weight: $font-semibold;
  transition: all $transition-base;
  position: relative;
  overflow: hidden;
  
  // 防止文字换行
  white-space: nowrap;
  text-overflow: ellipsis;

  @include mobile {
    padding: $spacing-md $spacing-lg;
    font-size: $font-sm;
    gap: $spacing-xs;
    
    // 移动端文字优化
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    // 超小屏幕进一步优化
    @media (max-width: 360px) {
      padding: $spacing-sm;
      font-size: $font-xs;
      min-width: 0; // 允许flex收缩
      
      span {
        font-size: 11px;
      }
      
      svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
    }
  }

  svg {
    transition: transform $transition-base;
    flex-shrink: 0; // 防止图标被压缩
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: $text-primary;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    @include mobile {
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      &:active {
        background: rgba(255, 255, 255, 0.15);
      }
    }
  }

  &.primary {
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    border: none;
    color: $text-primary;
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);

    &:hover {
      box-shadow: 0 12px 32px rgba(0, 212, 255, 0.6);
    }
    
    @include mobile {
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
      }
      
      &:active {
        box-shadow: 0 2px 8px rgba(0, 212, 255, 0.4);
      }
    }
  }
}

.test-button {
  @include button-reset;
  @include mobile-button;
  padding: $spacing-md $spacing-lg;
  margin-right: $spacing-md;
  margin-bottom: $spacing-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  border-radius: $radius-md;
  font-weight: $font-medium;
  transition: all $transition-base;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
  }
  
  @include mobile {
    &:hover {
      transform: none;
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
}
</style>