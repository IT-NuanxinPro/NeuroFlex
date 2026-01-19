<template>
  <Transition name="result-modal" @enter="onEnter" @after-enter="onAfterEnter">
    <div v-if="visible" class="result-overlay" @click.self="handleOverlayClick">
      <div class="result-modal" :class="resultClass">
        <!-- 背景装饰 -->
        <div class="result-bg-decoration">
          <div class="decoration-circle circle-1"></div>
          <div class="decoration-circle circle-2"></div>
          <div class="decoration-circle circle-3"></div>
        </div>

        <!-- 状态图标 -->
        <div class="result-icon-wrapper">
          <div class="result-icon" :class="resultClass">
            <!-- 成功图标 -->
            <svg
              v-if="type === 'success'"
              class="icon-svg"
              viewBox="0 0 52 52"
              fill="none"
              stroke="currentColor"
            >
              <circle class="icon-circle" cx="26" cy="26" r="25" />
              <path class="icon-check" d="M14 27l7 7 16-16" />
            </svg>

            <!-- 失败/超时图标 -->
            <svg
              v-else-if="type === 'timeout' || type === 'fail'"
              class="icon-svg"
              viewBox="0 0 52 52"
              fill="none"
              stroke="currentColor"
            >
              <circle class="icon-circle" cx="26" cy="26" r="25" />
              <path class="icon-cross" d="M16 16l20 20M36 16l-20 20" />
            </svg>

            <!-- 警告图标 -->
            <svg
              v-else-if="type === 'warning'"
              class="icon-svg"
              viewBox="0 0 52 52"
              fill="none"
              stroke="currentColor"
            >
              <circle class="icon-circle" cx="26" cy="26" r="25" />
              <path class="icon-warning" d="M26 16v12M26 34v2" />
            </svg>
          </div>
        </div>

        <!-- 标题 -->
        <h2 class="result-title">{{ title }}</h2>

        <!-- 副标题（可选） -->
        <p v-if="subtitle" class="result-subtitle">{{ subtitle }}</p>

        <!-- 统计数据 -->
        <div class="result-stats">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="stat-item"
            :style="{ animationDelay: `${0.1 + index * 0.05}s` }"
          >
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-value" :class="stat.highlight ? 'highlight' : ''">
              {{ stat.value }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="result-actions">
          <button
            v-if="showRetry"
            class="action-button secondary"
            @click="$emit('retry')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            <span>再来一次</span>
          </button>
          <button class="action-button primary" @click="$emit('close')">
            <span>{{ closeText }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { modalPopup } from '@/utils/animations'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'success', // 'success' | 'fail' | 'timeout' | 'warning'
    validator: value => ['success', 'fail', 'timeout', 'warning'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  stats: {
    type: Array,
    default: () => []
    // 格式: [{ label: '用时', value: '5.0s', highlight: false }]
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  closeText: {
    type: String,
    default: '返回首页'
  }
})

defineEmits(['close', 'retry'])

const resultClass = computed(() => {
  return `result-${props.type}`
})

function onEnter(el) {
  // 使用GSAP动画
  modalPopup(el)
}

function onAfterEnter() {
  // 动画完成后的回调
}

function handleOverlayClick() {
  // 点击遮罩层关闭（可选）
  // this.$emit('close')
}
</script>

<style lang="scss" scoped>
.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  @include flex-center;
  z-index: 2000;
  padding: $spacing-lg;
}

.result-modal {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: $spacing-3xl $spacing-2xl;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  overflow: hidden;

  @include mobile {
    max-width: 90vw;
    padding: $spacing-2xl $spacing-lg;
  }
}

// 背景装饰
.result-bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.3;

  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    animation: float 6s ease-in-out infinite;

    &.circle-1 {
      width: 200px;
      height: 200px;
      top: -100px;
      right: -100px;
      background: radial-gradient(circle, var(--result-color) 0%, transparent 70%);
      animation-delay: 0s;
    }

    &.circle-2 {
      width: 150px;
      height: 150px;
      bottom: -75px;
      left: -75px;
      background: radial-gradient(circle, var(--result-color) 0%, transparent 70%);
      animation-delay: 2s;
    }

    &.circle-3 {
      width: 100px;
      height: 100px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, var(--result-color) 0%, transparent 70%);
      animation-delay: 4s;
    }
  }
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(10px, -10px) scale(1.1);
  }
  66% {
    transform: translate(-10px, 10px) scale(0.9);
  }
}

// 图标样式
.result-icon-wrapper {
  @include flex-center;
  margin-bottom: $spacing-xl;
}

.result-icon {
  width: 80px;
  height: 80px;
  @include flex-center;
  position: relative;

  @include mobile {
    width: 64px;
    height: 64px;
  }

  .icon-svg {
    width: 100%;
    height: 100%;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .icon-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    animation: draw-circle 0.6s ease-out forwards;
    animation-delay: 0.2s;
  }

  .icon-check {
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: draw-check 0.4s ease-out forwards;
    animation-delay: 0.6s;
  }

  .icon-cross {
    stroke-dasharray: 57;
    stroke-dashoffset: 57;
    animation: draw-cross 0.4s ease-out forwards;
    animation-delay: 0.6s;
  }

  .icon-warning {
    stroke-dasharray: 30;
    stroke-dashoffset: 30;
    animation: draw-warning 0.4s ease-out forwards;
    animation-delay: 0.6s;
  }
}

// 成功样式
.result-success {
  --result-color: #{$accent-success};

  .result-icon {
    color: $accent-success;
    filter: drop-shadow(0 0 20px rgba(0, 255, 136, 0.6));
  }
}

// 失败/超时样式
.result-fail,
.result-timeout {
  --result-color: #{$accent-error};

  .result-icon {
    color: $accent-error;
    filter: drop-shadow(0 0 20px rgba(255, 51, 102, 0.6));
  }
}

// 警告样式
.result-warning {
  --result-color: #{$accent-warning};

  .result-icon {
    color: $accent-warning;
    filter: drop-shadow(0 0 20px rgba(255, 170, 0, 0.6));
  }
}

// 动画关键帧
@keyframes draw-circle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes draw-check {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes draw-cross {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes draw-warning {
  to {
    stroke-dashoffset: 0;
  }
}

// 标题
.result-title {
  text-align: center;
  font-size: $font-3xl;
  font-weight: $font-bold;
  margin: 0 0 $spacing-sm;
  background: linear-gradient(135deg, $text-primary 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fade-in-up 0.5s ease-out forwards;
  animation-delay: 0.3s;
  opacity: 0;

  @include mobile {
    font-size: $font-2xl;
  }
}

.result-subtitle {
  text-align: center;
  font-size: $font-base;
  color: $text-secondary;
  margin: 0 0 $spacing-2xl;
  animation: fade-in-up 0.5s ease-out forwards;
  animation-delay: 0.4s;
  opacity: 0;

  @include mobile {
    font-size: $font-sm;
    margin-bottom: $spacing-xl;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 统计数据
.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-2xl;

  @include mobile {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
    margin-bottom: $spacing-xl;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-md;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all $transition-base;
    animation: fade-in-scale 0.4s ease-out forwards;
    opacity: 0;

    @include mobile {
      padding: $spacing-md;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .stat-label {
      font-size: $font-sm;
      color: $text-secondary;
      font-weight: $font-medium;

      @include mobile {
        font-size: $font-xs;
      }
    }

    .stat-value {
      font-size: $font-xl;
      font-weight: $font-bold;
      color: $text-primary;

      @include mobile {
        font-size: $font-lg;
      }

      &.highlight {
        background: linear-gradient(135deg, $accent-primary, $accent-secondary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
  }
}

@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 操作按钮
.result-actions {
  display: flex;
  gap: $spacing-md;
  animation: fade-in-up 0.5s ease-out forwards;
  animation-delay: 0.5s;
  opacity: 0;

  @include mobile {
    gap: $spacing-sm;
  }

  .action-button {
    @include button-reset;
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

    @include mobile {
      padding: $spacing-md $spacing-lg;
      font-size: $font-sm;
    }

    svg {
      transition: transform $transition-base;
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
      opacity: 0;
      transition: opacity $transition-base;
    }

    &:hover::before {
      opacity: 1;
    }

    &:active {
      transform: scale(0.98);
    }

    &.secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: $text-primary;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);

        svg {
          transform: rotate(-45deg);
        }
      }
    }

    &.primary {
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      border: none;
      color: $text-primary;
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(0, 212, 255, 0.6);

        svg {
          transform: translateX(4px);
        }
      }
    }
  }
}

// 过渡动画
.result-modal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.result-modal-leave-active {
  transition: all 0.3s ease-in;
}

.result-modal-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.result-modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
