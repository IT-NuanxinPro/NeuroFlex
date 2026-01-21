<template>
  <div class="user-avatar" :class="{ clickable }" :style="avatarStyle" @click="handleClick">
    <img v-if="src && !imageError" :src="src" :alt="alt" class="avatar-image" @error="handleImageError" />
    <img v-else src="/avatar-default.png" :alt="alt" class="avatar-image default-avatar" />

    <!-- 悬停遮罩 -->
    <div v-if="showOverlay && clickable" class="avatar-overlay">
      <slot name="overlay">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
          />
          <circle cx="12" cy="13" r="4" />
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
    validator: value => {
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
  border-radius: inherit;

  &.default-avatar {
    background: rgba(255, 255, 255, 0.05);
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
