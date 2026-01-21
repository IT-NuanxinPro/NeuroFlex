<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '90%', maxWidth: '400px', background: 'var(--bg-secondary)' }"
    round
    :close-on-click-overlay="false"
    :lock-scroll="true"
    class="privacy-dialog"
  >
    <div class="privacy-content">
      <!-- 头部 -->
      <div class="privacy-header">
        <div class="privacy-icon">🔒</div>
        <h2 class="privacy-title">隐私协议</h2>
      </div>

      <!-- 内容 -->
      <div class="privacy-body">
        <div class="privacy-text">
          <p>欢迎使用 NeuroFlex 认知训练系统！</p>
          
          <h3>数据收集与使用</h3>
          <p>• 我们仅在您的设备本地存储训练记录和个人设置</p>
          <p>• 不会收集您的个人身份信息</p>
          <p>• 训练数据仅用于个人进度跟踪和统计分析</p>
          
          <h3>数据安全</h3>
          <p>• 所有数据均存储在您的设备本地</p>
          <p>• 您可以随时导出或删除您的数据</p>
          <p>• 我们不会将您的数据传输到第三方服务器</p>
          
          <h3>权限说明</h3>
          <p>• <strong>存储权限</strong>：用于保存训练记录和应用设置</p>
          <p>• <strong>网络权限</strong>：用于检查应用更新（可选）</p>
          
          <p v-if="showActions" class="privacy-note">
            继续使用即表示您同意我们按照上述方式处理您的数据。
          </p>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="privacy-actions">
        <van-button
          v-if="showActions"
          class="privacy-btn decline"
          @click="handleDecline"
        >
          不同意
        </van-button>
        <van-button
          v-if="showActions"
          class="privacy-btn accept"
          type="primary"
          @click="handleAccept"
        >
          同意并继续
        </van-button>
        <van-button
          v-if="!showActions"
          class="privacy-btn close-only"
          type="primary"
          @click="handleClose"
        >
          关闭
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Popup as VanPopup, Button as VanButton } from 'vant'
import 'vant/lib/popup/style'
import 'vant/lib/button/style'
import storageManager from '@/utils/storage'

const visible = ref(false)
const showActions = ref(true) // 控制是否显示同意/不同意按钮

const emit = defineEmits(['accepted', 'declined'])

// 检查是否已经同意过隐私协议
async function checkPrivacyAccepted() {
  try {
    const accepted = await storageManager.getItem('privacy_accepted', false)
    return accepted
  } catch (error) {
    console.error('检查隐私协议状态失败:', error)
    return false
  }
}

// 保存隐私协议同意状态
async function savePrivacyAccepted() {
  try {
    await storageManager.setItem('privacy_accepted', true)
    await storageManager.setItem('privacy_accepted_at', new Date().toISOString())
  } catch (error) {
    console.error('保存隐私协议状态失败:', error)
  }
}

// 显示隐私协议
async function showIfNeeded() {
  // 只在 APP 环境下显示
  if (!Capacitor.isNativePlatform()) {
    return
  }

  const accepted = await checkPrivacyAccepted()
  if (!accepted) {
    showActions.value = true // 首次进入时显示同意/不同意按钮
    visible.value = true
  }
}

// 同意协议
async function handleAccept() {
  await savePrivacyAccepted()
  visible.value = false
  emit('accepted')
}

// 拒绝协议
async function handleDecline() {
  visible.value = false
  emit('declined')
  
  // 如果是 APP 环境且是首次进入，退出应用
  if (Capacitor.isNativePlatform() && showActions.value) {
    try {
      await App.exitApp()
    } catch (error) {
      console.error('退出应用失败:', error)
    }
  }
}

// 关闭弹窗（仅查看模式）
function handleClose() {
  visible.value = false
}

// 手动显示协议（用于设置页面）
function show() {
  showActions.value = false // 设置页面查看时不显示同意/不同意按钮
  visible.value = true
}

onMounted(() => {
  showIfNeeded()
})

defineExpose({
  show,
  showIfNeeded
})
</script>

<style lang="scss" scoped>
.privacy-dialog {
  :deep(.van-popup) {
    background: $bg-secondary !important;
    border: 1px solid $glass-border;
    box-shadow: $glass-shadow;
    backdrop-filter: blur(20px);
  }
}

.privacy-content {
  padding: $spacing-xl;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: $bg-secondary;
  border-radius: $radius-lg;
}

.privacy-header {
  text-align: center;
  margin-bottom: $spacing-lg;

  .privacy-icon {
    font-size: 48px;
    margin-bottom: $spacing-md;
  }

  .privacy-title {
    font-size: $font-xl;
    font-weight: $font-bold;
    color: $text-primary;
    margin: 0;
  }
}

.privacy-body {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;
  margin-bottom: $spacing-lg;
}

.privacy-text {
  color: $text-secondary;
  line-height: 1.6;

  p {
    margin-bottom: $spacing-md;
    font-size: $font-sm;
  }

  h3 {
    color: $text-primary;
    font-size: $font-base;
    font-weight: $font-semibold;
    margin: $spacing-lg 0 $spacing-sm 0;
    
    &:first-of-type {
      margin-top: 0;
    }
  }

  .privacy-note {
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: $radius-md;
    padding: $spacing-md;
    margin-top: $spacing-lg;
    font-size: $font-sm;
    color: $accent-primary;
  }
}

.privacy-actions {
  display: flex;
  gap: $spacing-md;

  .privacy-btn {
    flex: 1;
    height: 44px;
    border-radius: $radius-md;
    font-weight: $font-semibold;

    &.decline {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: $text-secondary;

      &:active {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &.accept {
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      border: none;
      color: $text-primary;

      &:active {
        opacity: 0.8;
      }
    }

    &.close-only {
      width: 100%;
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      border: none;
      color: $text-primary;

      &:active {
        opacity: 0.8;
      }
    }
  }
}

// Vant 组件样式覆盖
:deep(.van-button) {
  border-radius: $radius-md;
  font-weight: $font-semibold;
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  border: none;
}
</style>