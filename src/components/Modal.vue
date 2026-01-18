<template>
  <transition name="modal">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="close-button" @click="handleClose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <slot></slot>
        </div>

        <div class="modal-footer" v-if="showFooter">
          <button class="modal-button cancel-button" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button class="modal-button confirm-button" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  closeOnClickOverlay: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'close'])

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

async function handleConfirm() {
  const result = emit('confirm')
  if (result !== false) {
    emit('update:visible', false)
  }
}

function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}

function handleOverlayClick() {
  if (props.closeOnClickOverlay) {
    handleClose()
  }
}
</script>

<style lang="scss" scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(-20px);
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-lg;
}

.modal-container {
  @include glass-card;
  background: rgba(26, 26, 46, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $radius-lg;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.modal-title {
  font-size: $font-lg;
  font-weight: $font-semibold;
  margin: 0;
  color: $text-primary;
}

.close-button {
  @include button-reset;
  width: 32px;
  height: 32px;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.05);
  color: $text-secondary;
  @include flex-center;
  transition: all $transition-base;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text-primary;
  }

  &:active {
    transform: scale(0.95);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
}

.modal-footer {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.modal-button {
  @include button-reset;
  flex: 1;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-md;
  font-weight: $font-medium;
  transition: all $transition-base;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.05);
  color: $text-secondary;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text-primary;
  }
}

.confirm-button {
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
