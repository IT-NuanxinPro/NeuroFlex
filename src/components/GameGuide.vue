<template>
  <Transition name="guide-modal">
    <div v-if="visible" class="guide-overlay" @click.self="$emit('close')">
      <div class="guide-modal">
        <!-- 关闭按钮 -->
        <button class="close-button" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <!-- 标题 -->
        <div class="guide-header">
          <div class="guide-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2" />
              <path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <h2>{{ title }}</h2>
        </div>

        <!-- 内容 -->
        <div class="guide-content">
          <!-- 游戏说明 -->
          <section v-if="howToPlay" class="guide-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 11l3 3L22 4" stroke-width="2" stroke-linecap="round" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-width="2" />
              </svg>
              游戏玩法
            </h3>
            <div class="guide-text" v-html="howToPlay"></div>
          </section>

          <!-- 训练目标 -->
          <section v-if="benefits" class="guide-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round" />
                <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round" />
              </svg>
              训练目标
            </h3>
            <div class="guide-text" v-html="benefits"></div>
          </section>

          <!-- 提示技巧 -->
          <section v-if="tips" class="guide-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-width="2" />
              </svg>
              提示技巧
            </h3>
            <div class="guide-text" v-html="tips"></div>
          </section>
        </div>

        <!-- 底部按钮 -->
        <div class="guide-footer">
          <button class="understand-button" @click="$emit('close')">
            我知道了
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  howToPlay: {
    type: String,
    default: ''
  },
  benefits: {
    type: String,
    default: ''
  },
  tips: {
    type: String,
    default: ''
  }
})

defineEmits(['close'])
</script>

<style lang="scss" scoped>
.guide-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  @include flex-center;
  z-index: 2000;
  padding: $spacing-lg;

  @include mobile {
    padding: $spacing-md;
  }
}

.guide-modal {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @include mobile {
    max-width: 90vw;
    max-height: 80vh;
  }
}

.close-button {
  @include button-reset;
  @include click-feedback;
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  width: 36px;
  height: 36px;
  border-radius: $radius-full;
  background: rgba(255, 255, 255, 0.1);
  color: $text-primary;
  @include flex-center;
  z-index: 1;
  transition: all $transition-base;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }

  @include mobile {
    width: 32px;
    height: 32px;
    top: $spacing-sm;
    right: $spacing-sm;
  }
}

.guide-header {
  padding: $spacing-xl $spacing-xl $spacing-lg;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  @include mobile {
    padding: $spacing-lg $spacing-md $spacing-md;
  }

  .guide-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto $spacing-md;
    border-radius: $radius-full;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    @include flex-center;
    color: $text-primary;
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);

    @include mobile {
      width: 56px;
      height: 56px;
      margin-bottom: $spacing-sm;
    }
  }

  h2 {
    font-size: $font-2xl;
    font-weight: $font-bold;
    margin: 0;
    background: linear-gradient(135deg, $text-primary 0%, rgba(255, 255, 255, 0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @include mobile {
      font-size: $font-xl;
    }
  }
}

.guide-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
  @include custom-scrollbar;

  @include mobile {
    padding: $spacing-md;
  }
}

.guide-section {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-lg;
    font-weight: $font-semibold;
    color: $accent-primary;
    margin: 0 0 $spacing-md;

    @include mobile {
      font-size: $font-base;
      gap: $spacing-xs;
      margin-bottom: $spacing-sm;
    }

    svg {
      flex-shrink: 0;
    }
  }

  .guide-text {
    font-size: $font-base;
    line-height: 1.6;
    color: $text-secondary;

    @include mobile {
      font-size: $font-sm;
      line-height: 1.5;
    }

    :deep(p) {
      margin: 0 0 $spacing-sm;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(ul), :deep(ol) {
      margin: $spacing-sm 0;
      padding-left: $spacing-lg;

      @include mobile {
        padding-left: $spacing-md;
      }
    }

    :deep(li) {
      margin-bottom: $spacing-xs;
      
      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(strong) {
      color: $accent-primary;
      font-weight: $font-semibold;
    }

    :deep(em) {
      color: $accent-secondary;
      font-style: normal;
    }
  }
}

.guide-footer {
  padding: $spacing-lg;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  @include mobile {
    padding: $spacing-md;
  }

  .understand-button {
    @include button-reset;
    @include click-feedback;
    width: 100%;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;
    font-size: $font-base;
    font-weight: $font-semibold;
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);
    transition: all $transition-base;

    @include mobile {
      padding: $spacing-sm;
      font-size: $font-sm;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0, 212, 255, 0.6);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// 过渡动画
.guide-modal-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.guide-modal-leave-active {
  transition: all 0.2s ease-in;
}

.guide-modal-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.guide-modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
