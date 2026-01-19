<template>
  <div class="settings-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">设置</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="page-content">
      <div class="settings-section">
        <h2 class="section-title">通用设置</h2>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">声音效果</div>
            <div class="setting-description">训练过程中的音效反馈</div>
          </div>
          <label class="toggle-switch">
            <input
              v-model="configStore.appConfig.soundEnabled"
              type="checkbox"
              @change="saveConfig"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">震动反馈</div>
            <div class="setting-description">触觉反馈（需设备支持）</div>
          </div>
          <label class="toggle-switch">
            <input
              v-model="configStore.appConfig.vibrationEnabled"
              type="checkbox"
              @change="saveConfig"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">动画效果</div>
            <div class="setting-description">页面切换和交互动画</div>
          </div>
          <label class="toggle-switch">
            <input
              v-model="configStore.appConfig.animationEnabled"
              type="checkbox"
              @change="saveConfig"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="section-title">数据管理</h2>

        <button class="action-button" @click="clearHistory">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3 6 5 6 21 6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
          清除训练记录
        </button>

        <button class="action-button" @click="resetSettings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          恢复默认设置
        </button>
      </div>

      <div class="settings-section">
        <h2 class="section-title">关于</h2>
        <div class="about-info">
          <p><strong>版本:</strong> {{ configStore.appConfig.version }}</p>
          <p><strong>应用名称:</strong> NeuroFlex 认知训练系统</p>
          <p><strong>描述:</strong> 专业的认知与大脑训练</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const configStore = useConfigStore()
const userStore = useUserStore()

function goBack() {
  router.back()
}

function saveConfig() {
  configStore.saveConfig()
}

function clearHistory() {
  if (confirm('确定要清除所有训练记录吗？此操作不可恢复。')) {
    userStore.clearHistory()
    alert('训练记录已清除')
  }
}

function resetSettings() {
  if (confirm('确定要恢复默认设置吗？')) {
    configStore.resetConfig()
    alert('设置已恢复默认')
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: $bg-primary;
}

.page-header {
  @include safe-area-padding(top);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .back-button {
    @include button-reset;
    @include click-feedback;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;
    @include flex-center;
  }

  .page-title {
    font-size: $font-xl;
    font-weight: $font-semibold;
    margin: 0;
  }

  .header-spacer {
    width: 40px;
  }
}

.page-content {
  padding: $spacing-lg;
}

.settings-section {
  margin-bottom: $spacing-2xl;

  .section-title {
    font-size: $font-lg;
    font-weight: $font-semibold;
    margin-bottom: $spacing-lg;
    color: $text-secondary;
  }
}

.setting-item {
  @include glass-card;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;

  .setting-info {
    flex: 1;

    .setting-label {
      font-size: $font-base;
      font-weight: $font-medium;
      margin-bottom: $spacing-xs;
    }

    .setting-description {
      font-size: $font-sm;
      color: $text-secondary;
    }
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background-color: $accent-primary;

      &:before {
        transform: translateX(22px);
      }
    }
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: $transition-base;
    border-radius: 28px;

    &:before {
      position: absolute;
      content: '';
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: $transition-base;
      border-radius: 50%;
    }
  }
}

.action-button {
  @include button-reset;
  @include click-feedback;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  width: 100%;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: $text-primary;
  font-weight: $font-medium;
  transition: all $transition-base;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: $accent-error;
    color: $accent-error;
  }
}

.about-info {
  @include glass-card;
  padding: $spacing-lg;

  p {
    margin-bottom: $spacing-sm;
    font-size: $font-sm;
    color: $text-secondary;

    strong {
      color: $text-primary;
      margin-right: $spacing-xs;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
