<template>
  <Transition name="countdown-fade">
    <div v-if="isVisible" class="countdown-overlay">
      <div class="countdown-container">
        <!-- SVG 进度环 -->
        <svg class="progress-ring" viewBox="0 0 120 120">
          <circle
            class="progress-ring-bg"
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            stroke-width="8"
          />
          <circle
            class="progress-ring-fill"
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--accent-primary)"
            stroke-width="8"
            stroke-linecap="round"
            :style="ringStyle"
          />
        </svg>

        <!-- 倒计时文本 -->
        <div class="countdown-text" :class="{ 'is-start': currentCount === 0 }">
          {{ displayText }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentCount: {
    type: Number,
    required: true,
    validator: value => value >= 0 && value <= 3
  },
  progress: {
    type: Number,
    required: true,
    validator: value => value >= 0 && value <= 100
  },
  isVisible: {
    type: Boolean,
    default: false
  }
})

// 计算显示文本
const displayText = computed(() => {
  if (props.currentCount === 0) {
    return '开始'
  }
  return props.currentCount.toString()
})

// 计算进度环样式
const ringCircumference = computed(() => {
  const radius = 52
  return 2 * Math.PI * radius
})

const ringStyle = computed(() => {
  const circumference = ringCircumference.value
  const offset = circumference - (props.progress / 100) * circumference

  return {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: offset,
    transform: 'rotate(-90deg)',
    transformOrigin: '50% 50%',
    transition: 'stroke-dashoffset 1s linear'
  }
})
</script>

<style lang="scss" scoped>
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.countdown-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.progress-ring {
  width: 100%;
  height: 100%;
}

.countdown-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  user-select: none;
  transition: all 0.3s ease;

  &.is-start {
    font-size: 36px;
    color: var(--accent-primary);
    transform: translate(-50%, -50%) scale(1.1);
  }
}

// 淡入淡出过渡动画
.countdown-fade-enter-active,
.countdown-fade-leave-active {
  transition: opacity 0.3s ease;
}

.countdown-fade-enter-from,
.countdown-fade-leave-to {
  opacity: 0;
}
</style>
