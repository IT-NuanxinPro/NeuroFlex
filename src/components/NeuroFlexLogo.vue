<template>
  <div class="neuroflex-logo" :class="{ compact }">
    <div class="logo-icon" :style="{ width: iconSize + 'px', height: iconSize + 'px' }">
      <svg :width="iconSize - 8" :height="iconSize - 8" viewBox="0 0 512 512">
        <defs>
          <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color: #00d4ff; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #7b2cbf; stop-opacity: 1" />
          </linearGradient>
        </defs>
        <!-- 神经网络节点 -->
        <circle cx="140" cy="160" r="20" :fill="`url(#${gradientId})`" opacity="0.8" />
        <circle cx="140" cy="256" r="20" :fill="`url(#${gradientId})`" opacity="0.8" />
        <circle cx="140" cy="352" r="20" :fill="`url(#${gradientId})`" opacity="0.8" />
        <circle cx="256" cy="120" r="24" :fill="`url(#${gradientId})`" />
        <circle cx="256" cy="220" r="24" :fill="`url(#${gradientId})`" />
        <circle cx="256" cy="292" r="24" :fill="`url(#${gradientId})`" />
        <circle cx="256" cy="392" r="24" :fill="`url(#${gradientId})`" />
        <circle cx="372" cy="160" r="20" :fill="`url(#${gradientId})`" opacity="0.8" />
        <circle cx="372" cy="256" r="20" :fill="`url(#${gradientId})`" opacity="0.8" />
        <circle cx="372" cy="352" r="20" :fill="`url(#${gradientId})`" opacity="0.8" />
        <!-- 连接线 -->
        <g :stroke="`url(#${gradientId})`" stroke-width="3" opacity="0.4" fill="none">
          <line x1="160" y1="160" x2="232" y2="120" />
          <line x1="160" y1="160" x2="232" y2="220" />
          <line x1="160" y1="256" x2="232" y2="220" />
          <line x1="160" y1="256" x2="232" y2="292" />
          <line x1="160" y1="352" x2="232" y2="292" />
          <line x1="160" y1="352" x2="232" y2="392" />
          <line x1="280" y1="120" x2="352" y2="160" />
          <line x1="280" y1="220" x2="352" y2="160" />
          <line x1="280" y1="220" x2="352" y2="256" />
          <line x1="280" y1="292" x2="352" y2="256" />
          <line x1="280" y1="292" x2="352" y2="352" />
          <line x1="280" y1="392" x2="352" y2="352" />
        </g>
        <!-- 中心脉冲 -->
        <circle
          cx="256"
          cy="256"
          r="40"
          fill="none"
          stroke="#00d4ff"
          stroke-width="2"
          opacity="0.6"
        />
        <circle
          cx="256"
          cy="256"
          r="60"
          fill="none"
          stroke="#00d4ff"
          stroke-width="1"
          opacity="0.3"
        />
      </svg>
    </div>
    <h1 v-if="showTitle" class="logo-title" :class="titleClass">{{ title }}</h1>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: value => ['small', 'medium', 'large'].includes(value)
  },
  showTitle: {
    type: Boolean,
    default: true
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
  }
})

const iconSize = computed(() => {
  const sizes = {
    small: 32,
    medium: 40,
    large: 56
  }
  return sizes[props.size]
})

const gradientId = computed(() => `logoGrad-${Math.random().toString(36).substr(2, 9)}`)
</script>

<style lang="scss" scoped>
.neuroflex-logo {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  &.compact {
    gap: $spacing-sm;
  }
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all $transition-base;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.3);
    transform: scale(1.05);
  }
}

.logo-title {
  font-weight: $font-bold;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: 0.05em;
  font-size: $font-xl;

  .neuroflex-logo.compact & {
    font-size: $font-lg;
  }

  @media (max-width: $breakpoint-sm) {
    font-size: $font-lg;
    letter-spacing: 0.02em;
  }
}
</style>
