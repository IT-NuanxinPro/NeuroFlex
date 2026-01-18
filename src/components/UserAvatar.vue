<template>
  <div class="user-avatar" :class="{ clickable }" :style="avatarStyle" @click="handleClick">
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="avatar-image"
      @error="handleImageError"
    />
    <div v-else class="avatar-placeholder">
      <svg :width="iconSize" :height="iconSize" viewBox="0 0 512 512">
        <defs>
          <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#7b2cbf;stop-opacity:1" />
          </linearGradient>
        </defs>
        <!-- 神经网络节点 -->
        <circle cx="140" cy="160" r="20" :fill="`url(#${gradientId})`" opacity="0.8"/>
        <circle cx="140" cy="256" r="20" :fill="`url(#${gradientId})`" opacity="0.8"/>
        <circle cx="140" cy="352" r="20" :fill="`url(#${gradientId})`" opacity="0.8"/>
        <circle cx="256" cy="120" r="24" :fill="`url(#${gradientId})`"/>
        <circle cx="256" cy="220" r="24" :fill="`url(#${gradientId})`"/>
        <circle cx="256" cy="292" r="24" :fill="`url(#${gradientId})`"/>
        <circle cx="256" cy="392" r="24" :fill="`url(#${gradientId})`"/>
        <circle cx="372" cy="160" r="20" :fill="`url(#${gradientId})`" opacity="0.8"/>
        <circle cx="372" cy="256" r="20" :fill="`url(#${gradientId})`" opacity="0.8"/>
        <circle cx="372" cy="352" r="20" :fill="`url(#${gradientId})`" opacity="0.8"/>
        <!-- 连接线 -->
        <g :stroke="`url(#${gradientId})`" stroke-width="3" opacity="0.4" fill="none">
          <line x1="160" y1="160" x2="232" y2="120"/>
          <line x1="160" y1="160" x2="232" y2="220"/>
          <line x1="160" y1="256" x2="232" y2="220"/>
          <line x1="160" y1="256" x2="232" y2="292"/>
          <line x1="160" y1="352" x2="232" y2="292"/>
          <line x1="160" y1="352" x2="232" y2="392"/>
          <line x1="280" y1="120" x2="352" y2="160"/>
          <line x1="280" y1="220" x2="352" y2="160"/>
          <line x1="280" y1="220" x2="352" y2="256"/>
          <line x1="280" y1="292" x2="352" y2="256"/>
          <line x1="280" y1="292" x2="352" y2="352"/>
          <line x1="280" y1="392" x2="352" y2="352"/>
        </g>
        <!-- 中心脉冲 -->
        <circle cx="256" cy="256" r="40" fill="none" stroke="#00d4ff" stroke-width="2" opacity="0.6"/>
        <circle cx="256" cy="256" r="60" fill="none" stroke="#00d4ff" stroke-width="1" opacity="0.3"/>
      </svg>
    </div>
    
    <!-- 悬停遮罩 -->
    <div v-if="showOverlay && clickable" class="avatar-overlay">
      <slot name="overlay">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: '头像'
  },
  size: {
    type: [String, Number],
    default: 100,
    validator: (value) => {
      if (typeof value === 'string') {
        return ['small', 'medium', 'large'].includes(value)
      }
      return typeof value === 'number' && value > 0
    }
  },
  clickable: {
    type: Boolean,
    default: false
  },
  showOverlay: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'error'])

const imageError = ref(false)

const avatarStyle = computed(() => {
  let size
  if (typeof props.size === 'string') {
    const sizeMap = {
      small: 40,
      medium: 60,
      large: 100
    }
    size = sizeMap[props.size]
  } else {
    size = props.size
  }
  
  return {
    width: `${size}px`,
    height: `${size}px`
  }
})

const iconSize = computed(() => {
  const size = typeof props.size === 'string' 
    ? { small: 40, medium: 60, large: 100 }[props.size]
    : props.size
  return Math.max(24, size * 0.6)
})

const gradientId = computed(() => `avatarGrad-${Math.random().toString(36).substr(2, 9)}`)

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}

function handleImageError() {
  imageError.value = true
  emit('error')
}
</script>

<style lang="scss" scoped>
.user-avatar {
  position: relative;
  border-radius: $radius-full;
  overflow: hidden;
  transition: transform $transition-base;
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      transform: scale(1.05);
      
      .avatar-overlay {
        opacity: 1;
      }
    }
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 44, 191, 0.1));
  border: 2px solid rgba(0, 212, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-primary;
  
  svg {
    filter: drop-shadow(0 2px 8px rgba(0, 212, 255, 0.3));
  }
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity $transition-base;
}
</style>