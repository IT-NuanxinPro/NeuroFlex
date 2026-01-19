<template>
  <div class="profile-page">
    <!-- 移动端标题栏 -->
    <header v-if="!isPC" class="page-header">
      <h1 class="page-title">个人中心</h1>
    </header>

    <main class="page-content" :class="{ 'pc-layout': isPC }">
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
    <Modal
      v-model:visible="showEditModal"
      title="编辑资料"
      confirm-text="保存"
      cancel-text="取消"
      @confirm="handleSaveName"
      @cancel="handleCancelEdit"
      @close="handleCancelEdit"
    >
      <div class="edit-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            ref="nameInputRef"
            v-model="editedName"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
            maxlength="20"
            @keyup.enter="handleSaveName"
          />
          <span class="char-count">{{ editedName.length }}/20</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import Modal from '@/components/Modal.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { downloadData } from '@/utils/storage'

const userStore = useUserStore()

const showEditModal = ref(false)
const editedName = ref(userStore.profile.name)
const nameInputRef = ref(null)
const avatarInput = ref(null)

// 检测是否为PC端
const isPC = ref(false)

function detectPC() {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
  
  isPC.value = !isMobile && !isTablet && window.innerWidth > 1024
  console.log('Profile - isPC:', isPC.value, 'width:', window.innerWidth)
}

function handleResize() {
  detectPC()
}

onMounted(() => {
  detectPC()
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

function handleSaveName() {
  if (editedName.value.trim()) {
    userStore.updateProfile({ name: editedName.value.trim() })
  } else {
    return false
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

watch(showEditModal, val => {
  if (val) {
    editedName.value = userStore.profile.name
    nextTick(() => {
      nameInputRef.value?.focus()
    })
  }
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
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
  flex: 1;
  overflow-y: auto;
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-lg;
  padding-bottom: calc($spacing-lg + 70px + env(safe-area-inset-bottom));
  @include custom-scrollbar;
  
  // PC端布局调整
  &.pc-layout {
    padding-top: $spacing-lg;
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
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
  }
}

.stat-item {
  @include glass-card;
  padding: $spacing-lg;
  text-align: center;

  .stat-value {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $accent-primary;
    margin-bottom: $spacing-xs;
  }

  .stat-label {
    font-size: $font-sm;
    color: $text-secondary;
  }
}

.actions-section {
  .section-title {
    font-size: $font-lg;
    font-weight: $font-semibold;
    margin-bottom: $spacing-md;
    color: $text-primary;
  }
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
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
</style>
