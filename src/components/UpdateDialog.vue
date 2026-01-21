<template>
  <div v-if="show" class="update-dialog-overlay" @click="handleOverlayClick">
    <div class="update-dialog" @click.stop>
      <div class="dialog-header">
        <div class="update-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <h3 class="dialog-title">发现新版本</h3>
        <button class="close-btn" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="dialog-content">
        <div class="version-info">
          <div class="version-item">
            <span class="version-label">当前版本</span>
            <span class="version-value">v{{ currentVersion }}</span>
          </div>
          <div class="version-item">
            <span class="version-label">最新版本</span>
            <span class="version-value latest">v{{ latestVersion }}</span>
          </div>
        </div>

        <div v-if="updateInfo?.changelog" class="changelog">
          <h4>更新内容</h4>
          <p>{{ updateInfo.changelog }}</p>
        </div>

        <div v-if="updateInfo?.releaseDate" class="release-date">
          发布于 {{ formatDate(updateInfo.releaseDate) }}
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn-secondary" @click="handleLater">
          稍后更新
        </button>
        <button class="btn-primary" @click="handleUpdate">
          立即下载
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  currentVersion: {
    type: String,
    default: ''
  },
  latestVersion: {
    type: String,
    default: ''
  },
  updateInfo: {
    type: Object,
    default: null
  },
  allowClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'update', 'later'])

function handleClose() {
  if (props.allowClose) {
    emit('close')
  }
}

function handleOverlayClick() {
  if (props.allowClose) {
    emit('close')
  }
}

function handleUpdate() {
  emit('update')
}

function handleLater() {
  emit('later')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style lang="scss" scoped>
.update-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-modal;
  padding: $spacing-lg;
}

.update-dialog {
  background: $glass-bg;
  backdrop-filter: $glass-backdrop;
  border: 1px solid $glass-border;
  border-radius: $radius-lg;
  box-shadow: $glass-shadow;
  max-width: 420px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-lg;
  border-bottom: 1px solid $glass-border;
  position: relative;
}

.update-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
  }
}

.dialog-title {
  font-size: $font-lg;
  font-weight: $font-semibold;
  color: $text-primary;
  margin: 0;
  flex: 1;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text-primary;
    border-color: $accent-primary;
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

.dialog-content {
  padding: $spacing-lg;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $radius-sm;
}

.version-label {
  font-size: $font-sm;
  color: $text-secondary;
}

.version-value {
  font-size: $font-sm;
  font-weight: $font-medium;
  color: $text-primary;

  &.latest {
    color: $accent-primary;
    font-weight: $font-semibold;
  }
}

.changelog {
  margin-bottom: $spacing-md;
  padding: $spacing-md;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $radius-sm;

  h4 {
    font-size: $font-base;
    font-weight: $font-semibold;
    color: $text-primary;
    margin: 0 0 $spacing-sm 0;
  }

  p {
    font-size: $font-sm;
    color: $text-secondary;
    line-height: 1.5;
    margin: 0;
  }
}

.release-date {
  font-size: $font-sm;
  color: $text-tertiary;
  text-align: center;
}

.dialog-actions {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-lg;
  border-top: 1px solid $glass-border;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;
}

.btn-secondary {
  background: $glass-bg;
  border: 1px solid $glass-border;
  color: $text-secondary;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text-primary;
    border-color: $accent-primary;
  }
}

.btn-primary {
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 212, 255, 0.4);
  }
}

@media (max-width: $breakpoint-sm) {
  .update-dialog {
    margin: 0 $spacing-md;
  }

  .dialog-actions {
    flex-direction: column;
  }
}
</style>