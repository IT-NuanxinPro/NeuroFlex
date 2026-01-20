<template>
  <div class="profile-page">
    <!-- 移动端标题栏 -->
    <header v-if="!isPCDevice" class="page-header">
      <h1 class="page-title">个人中心</h1>
    </header>

    <main class="page-content" :class="{ 'pc-layout': isPCDevice }">
      <!-- 用户信息卡片 -->
      <div class="profile-card">
        <div class="avatar-section">
          <UserAvatar
            :src="userStore.profile.avatar"
            :size="100"
            :clickable="true"
            @click="triggerAvatarUpload"
          />
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleAvatarUpload"
          />
        </div>

        <div class="user-info">
          <h2 class="username">{{ userStore.profile.name }}</h2>
          <p class="join-date">加入时间: {{ formatDate(userStore.profile.createdAt) }}</p>
          <button class="edit-button" @click="showEditModal = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            编辑资料
          </button>
        </div>
      </div>

      <!-- 训练统计 -->
      <div class="stats-section">
        <h3 class="section-title">训练统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ userStore.totalTrainingSessions }}</div>
            <div class="stat-label">训练次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatMinutes(userStore.totalTrainingTime) }}</div>
            <div class="stat-label">训练时长</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ userStore.averageScore }}</div>
            <div class="stat-label">平均分数</div>
          </div>
        </div>
      </div>

      <!-- 数据操作 -->
      <div class="actions-section">
        <h3 class="section-title">数据管理</h3>
        <div class="action-buttons">
          <button class="action-button" @click="exportData">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出数据
          </button>
          <button class="action-button danger" @click="clearHistory">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
            清空记录
          </button>
        </div>
      </div>
    </main>

    <!-- 编辑资料弹窗 -->
    <van-popup
      v-model:show="showEditModal"
      position="bottom"
      :style="{ height: '40%' }"
      round
      closeable
      close-icon-position="top-right"
      :safe-area-inset-bottom="true"
      :lock-scroll="true"
      class="keyboard-adaptive"
      @close="handleCancelEdit"
    >
      <div class="edit-popup-content popup-keyboard-safe">
        <div class="popup-header">
          <h3 class="popup-title">编辑资料</h3>
        </div>
        
        <div class="popup-body input-keyboard-fix">
          <van-form @submit="handleSaveName">
            <van-cell-group inset>
              <van-field
                v-model="editedName"
                name="username"
                label="用户名"
                placeholder="请输入用户名"
                :maxlength="20"
                show-word-limit
                class="input-focused"
                :rules="[{ required: true, message: '请输入用户名' }]"
                @keyup.enter="handleSaveName"
              />
            </van-cell-group>
            
            <div class="popup-actions">
              <van-button 
                block 
                type="primary" 
                native-type="submit"
                :loading="saving"
                loading-text="保存中..."
              >
                保存
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { Popup as VanPopup, Form as VanForm, Field as VanField, CellGroup as VanCellGroup, Button as VanButton } from 'vant'
import 'vant/lib/popup/style'
import 'vant/lib/form/style'
import 'vant/lib/field/style'
import 'vant/lib/cell-group/style'
import 'vant/lib/button/style'
import UserAvatar from '@/components/UserAvatar.vue'
import { downloadData } from '@/utils/storage'
import { isPC } from '@/utils/device'

const userStore = useUserStore()

const showEditModal = ref(false)
const editedName = ref(userStore.profile.name)
const saving = ref(false)
const avatarInput = ref(null)

// 检测是否为PC端
const isPCDevice = ref(isPC())

function handleResize() {
  isPCDevice.value = isPC()
}

onMounted(() => {
  isPCDevice.value = isPC()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function formatDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatMinutes(ms) {
  const minutes = Math.floor(ms / 60000)
  return `${minutes}分钟`
}

async function handleSaveName() {
  if (!editedName.value.trim()) {
    return false
  }
  
  saving.value = true
  
  try {
    // 模拟保存延迟，提供更好的用户反馈
    await new Promise(resolve => setTimeout(resolve, 500))
    
    userStore.updateProfile({ name: editedName.value.trim() })
    showEditModal.value = false
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

function handleCancelEdit() {
  editedName.value = userStore.profile.name
}

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

function handleAvatarUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }

  // 验证文件大小（限制2MB）
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = e => {
    const img = new Image()
    img.onload = () => {
      // 压缩图片到合适大小
      const canvas = document.createElement('canvas')
      const maxSize = 200 // 最大宽高
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // 转换为base64，质量0.8
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)

      // 保存到store（会自动删除旧头像）
      userStore.updateProfile({ avatar: compressedBase64 })
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)

  // 清空input，允许重复选择同一文件
  event.target.value = ''
}

function exportData() {
  const success = downloadData('neuroflex-backup.json')
  if (success) {
    alert('数据已成功导出！')
  } else {
    alert('导出失败，请重试')
  }
}

function clearHistory() {
  if (confirm('确定要清空所有训练记录吗？此操作不可恢复！')) {
    userStore.clearHistory()
    alert('训练记录已清空')
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  height: 100%; // 填满父容器
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  overflow: hidden; // 防止滚动条
}

.page-header {
  @include safe-area-padding(top);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .page-title {
    font-size: $font-xl;
    font-weight: $font-semibold;
    margin: 0;
  }
}

.page-content {
  flex: 1; // 填充剩余空间
  overflow-y: auto;
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-lg;
  padding-bottom: calc($spacing-lg + 70px + env(safe-area-inset-bottom));
  @include custom-scrollbar;
  min-height: 0; // 重要：让flex子元素可以收缩
  
  // PC端布局调整
  &.pc-layout {
    padding: $spacing-lg;
    padding-bottom: $spacing-lg;
  }
}

.profile-card {
  @include glass-card;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-lg;

  @media (max-width: $breakpoint-sm) {
    flex-direction: column;
    text-align: center;
  }

  .avatar-section {
    flex-shrink: 0;

    @media (max-width: $breakpoint-sm) {
      display: flex;
      justify-content: center;
    }
  }

  .user-info {
    flex: 1;
    text-align: left;

    @media (max-width: $breakpoint-sm) {
      text-align: center;
    }
  }

  .username {
    font-size: $font-xl;
    font-weight: $font-semibold;
    margin-bottom: $spacing-xs;
  }

  .join-date {
    color: $text-secondary;
    font-size: $font-sm;
    margin-bottom: $spacing-md;
  }

  .edit-button {
    @include button-reset;
    @include click-feedback;
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-size: $font-sm;
    font-weight: $font-medium;
    transition: all $transition-base;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: $accent-primary;
    }
  }
}

.stats-section {
  margin-bottom: $spacing-xl;

  .section-title {
    font-size: $font-lg;
    font-weight: $font-semibold;
    margin-bottom: $spacing-md;
    color: $text-primary;
    
    @include mobile {
      font-size: $font-base;
      margin-bottom: $spacing-sm;
    }
  }
}

.stats-grid {
  display: grid;
  gap: $spacing-md;
  
  // 移动端和APK环境使用三列方格布局
  @include mobile {
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-sm;
  }
  
  // PC端也使用三列方格布局
  @media (min-width: $breakpoint-lg) {
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-lg;
  }
  
  // 超小屏幕适配
  @media (max-width: 360px) {
    gap: $spacing-xs;
  }
}

.stat-item {
  @include glass-card;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  transition: all $transition-base;
  
  // 所有设备都使用方格布局（上下结构）
  min-height: 100px;
  aspect-ratio: 1; // 保持方形
  
  // 移动端调整
  @include mobile {
    padding: $spacing-md;
    min-height: 80px;
    
    // 超小屏幕进一步压缩
    @media (max-width: 360px) {
      padding: $spacing-sm;
      min-height: 70px;
    }
  }
  
  // PC端调整
  @media (min-width: $breakpoint-lg) {
    padding: $spacing-xl;
    min-height: 120px;
  }
  
  // 悬停效果（仅桌面端）
  @include hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
  }
  
  // 移动端点击反馈
  @include mobile {
    &:active {
      transform: scale(0.98);
    }
  }

  .stat-value {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $accent-primary;
    line-height: 1.2;
    margin-bottom: $spacing-xs;
    
    // 移动端调整
    @include mobile {
      font-size: $font-xl;
      
      @media (max-width: 360px) {
        font-size: $font-lg;
        margin-bottom: 2px;
      }
    }
    
    // PC端调整
    @media (min-width: $breakpoint-lg) {
      font-size: $font-3xl;
      margin-bottom: $spacing-sm;
    }
  }

  .stat-label {
    font-size: $font-sm;
    color: $text-secondary;
    font-weight: $font-medium;
    line-height: 1.2;
    white-space: nowrap; // 防止文字换行
    
    // 移动端调整
    @include mobile {
      font-size: $font-xs;
      
      @media (max-width: 360px) {
        font-size: 11px;
      }
    }
    
    // PC端调整
    @media (min-width: $breakpoint-lg) {
      font-size: $font-base;
    }
  }
}

// APK 环境下的特殊优化
.android-device .stats-grid,
.ios-device .stats-grid {
  .stat-item {
    // APK 环境下使用更紧凑的布局
    min-height: 75px;
    
    @media (max-width: 360px) {
      min-height: 65px;
    }
    
    .stat-value {
      @media (max-width: 360px) {
        font-size: $font-base;
      }
    }
  }
}

.actions-section {
  .section-title {
    font-size: $font-lg;
    font-weight: $font-semibold;
    margin-bottom: $spacing-md;
    color: $text-primary;
    
    @include mobile {
      font-size: $font-base;
      margin-bottom: $spacing-sm;
    }
  }
}

.action-buttons {
  display: grid;
  gap: $spacing-md;
  
  // PC端使用原来的两列布局
  grid-template-columns: repeat(2, 1fr);

  // 移动端改为单列布局，按钮更紧凑
  @include mobile {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
}

.action-button {
  @include button-reset;
  @include click-feedback;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-lg;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: $text-primary;
  font-weight: $font-medium;
  transition: all $transition-base;

  // 移动端使用更紧凑的样式
  @include mobile {
    padding: $spacing-md $spacing-lg;
    font-size: $font-sm;
    
    // 超小屏幕进一步压缩
    @media (max-width: 360px) {
      padding: $spacing-sm $spacing-md;
      font-size: $font-xs;
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: $accent-primary;
  }

  &.danger {
    &:hover {
      background: rgba(255, 51, 102, 0.1);
      border-color: $accent-error;
    }
  }
  
  // 移动端禁用悬停效果，使用点击反馈
  @include mobile {
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    &:active {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(0.98);
    }
    
    &.danger:active {
      background: rgba(255, 51, 102, 0.1);
    }
  }
}

.edit-form {
  .form-group {
    position: relative;
    margin-bottom: $spacing-md;
  }

  .form-label {
    display: block;
    font-size: $font-sm;
    color: $text-secondary;
    margin-bottom: $spacing-sm;
    font-weight: $font-medium;
  }

  .form-input {
    @include button-reset;
    width: 100%;
    padding: $spacing-md;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $radius-md;
    color: $text-primary;
    font-size: $font-base;
    transition: all $transition-base;

    &:focus {
      outline: none;
      border-color: $accent-primary;
      background: rgba(0, 212, 255, 0.05);
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
    }

    &::placeholder {
      color: $text-tertiary;
    }
  }

  .char-count {
    position: absolute;
    right: $spacing-sm;
    bottom: $spacing-md;
    font-size: $font-xs;
    color: $text-tertiary;
    transform: translateY(100%);
    pointer-events: none;
  }
}

// Vant 组件样式覆盖
:deep(.van-popup) {
  background: $bg-secondary;
  border-top-left-radius: $radius-lg;
  border-top-right-radius: $radius-lg;
  
  .van-popup__close-icon {
    color: $text-secondary;
    font-size: 18px;
    
    &:hover {
      color: $text-primary;
    }
  }
}

:deep(.van-form) {
  padding: 0;
}

:deep(.van-cell-group) {
  background: transparent;
  margin: 0 $spacing-lg $spacing-lg;
}

:deep(.van-cell-group--inset) {
  margin: 0 0 $spacing-lg;
  border-radius: $radius-md;
  overflow: hidden;
}

:deep(.van-cell) {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: $spacing-md $spacing-lg;
}

:deep(.van-cell:last-child) {
  border-bottom: none;
}

:deep(.van-cell__title) {
  color: $text-secondary;
  font-size: $font-sm;
  font-weight: $font-medium;
}

:deep(.van-field__control) {
  color: $text-primary;
  font-size: $font-base;
  background: transparent;
}

:deep(.van-field__control::placeholder) {
  color: $text-tertiary;
}

:deep(.van-field__control:focus) {
  color: $text-primary;
}

:deep(.van-field__word-limit) {
  color: $text-tertiary;
  font-size: $font-xs;
}

:deep(.van-button) {
  border-radius: $radius-md;
  font-weight: $font-medium;
  height: 48px;
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, $accent-primary, lighten($accent-primary, 10%));
  border: none;
  color: $text-primary;
}

:deep(.van-button--primary:active) {
  background: linear-gradient(135deg, darken($accent-primary, 5%), $accent-primary);
}

:deep(.van-button--primary.van-button--loading) {
  background: linear-gradient(135deg, $accent-primary, lighten($accent-primary, 10%));
  opacity: 0.8;
}

.edit-popup-content {
  padding: $spacing-lg 0;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 0 $spacing-lg $spacing-md;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .popup-title {
    font-size: $font-lg;
    font-weight: $font-semibold;
    color: $text-primary;
    margin: 0;
    text-align: center;
  }
}

.popup-body {
  flex: 1;
  padding: $spacing-lg 0;
  display: flex;
  flex-direction: column;
}

.popup-actions {
  padding: 0 $spacing-lg;
  margin-top: auto;
}
</style>
