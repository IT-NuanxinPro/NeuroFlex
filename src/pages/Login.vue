<template>
  <div class="login-page">
    <!-- 移动端返回按钮 -->
    <header v-if="!isPCDevice" class="mobile-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- PC端左侧装饰区域 -->
      <div v-if="isPCDevice" class="decoration-section">
        <div class="floating-elements">
          <div class="floating-circle circle-1"></div>
          <div class="floating-circle circle-2"></div>
          <div class="floating-circle circle-3"></div>
        </div>
        <div class="brand-content">
          <h1 class="brand-title">NeuroFlex</h1>
          <p class="brand-subtitle">科学认知训练平台</p>
          <div class="feature-highlights">
            <div class="highlight-item">
              <div class="highlight-icon">🧠</div>
              <span>提升认知能力</span>
            </div>
            <div class="highlight-item">
              <div class="highlight-icon">📊</div>
              <span>科学数据分析</span>
            </div>
            <div class="highlight-item">
              <div class="highlight-icon">🎯</div>
              <span>个性化训练</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 登录表单区域 -->
      <div class="form-section">
        <div class="form-container">
          <!-- 移动端标题 -->
          <div v-if="!isPCDevice" class="mobile-title-section">
            <h2 class="form-title">欢迎回来</h2>
            <p class="form-subtitle">继续您的认知训练之旅</p>
          </div>

          <!-- PC端标题 -->
          <div v-if="isPCDevice" class="pc-title-section">
            <h2 class="form-title">登录账号</h2>
            <p class="form-subtitle">使用您的邮箱和密码登录</p>
          </div>

          <!-- 登录表单 -->
          <form class="login-form" @submit.prevent="handleLogin">
            <!-- 邮箱输入 -->
            <div class="input-group">
              <div class="input-wrapper">
                <div class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input
                  v-model="formData.email"
                  type="email"
                  class="form-input"
                  placeholder="邮箱地址"
                  :class="{ 'error': errors.email }"
                  @blur="validateEmail"
                  @input="clearError('email')"
                  required
                />
              </div>
              <div v-if="errors.email" class="error-text">{{ errors.email }}</div>
            </div>

            <!-- 密码输入 -->
            <div class="input-group">
              <div class="input-wrapper">
                <div class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="密码"
                  :class="{ 'error': errors.password }"
                  @blur="validatePassword"
                  @input="clearError('password')"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                >
                  <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <div v-if="errors.password" class="error-text">{{ errors.password }}</div>
            </div>

            <!-- 选项区域 -->
            <div class="form-options">
              <label class="checkbox-wrapper">
                <input v-model="formData.rememberMe" type="checkbox" class="checkbox-input">
                <div class="checkbox-custom"></div>
                <span class="checkbox-label">记住我</span>
              </label>
              <button type="button" class="forgot-link" @click="showForgotPassword = true">
                忘记密码？
              </button>
            </div>

            <!-- 错误消息 -->
            <div v-if="generalError" class="general-error">
              {{ generalError }}
            </div>

            <!-- 登录按钮 -->
            <button
              type="submit"
              class="login-button"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="loading-spinner"></span>
              {{ isLoading ? '登录中...' : '登录' }}
            </button>
          </form>

          <!-- 注册链接 -->
          <div class="register-section">
            <span class="register-text">还没有账号？</span>
            <button class="register-link" @click="goToRegister">立即注册</button>
          </div>
        </div>
      </div>
    </main>

    <!-- 忘记密码弹窗 -->
    <van-popup
      v-model:show="showForgotPassword"
      position="bottom"
      round
      closeable
      close-icon-position="top-right"
      :safe-area-inset-bottom="true"
    >
      <div class="forgot-popup">
        <div class="popup-header">
          <h3 class="popup-title">重置密码</h3>
        </div>
        <div class="popup-content">
          <van-form @submit="handleForgotPassword">
            <van-cell-group inset>
              <van-field
                v-model="resetEmail"
                name="resetEmail"
                label="邮箱"
                placeholder="请输入您的邮箱地址"
                type="email"
                :rules="[{ required: true, message: '请输入邮箱地址' }]"
              />
            </van-cell-group>
            
            <div v-if="resetMessage" class="success-message">
              {{ resetMessage }}
            </div>
            
            <div v-if="resetError" class="error-message">
              {{ resetError }}
            </div>
            
            <div class="popup-actions">
              <button
                type="submit"
                class="reset-button"
                :disabled="isResetting"
              >
                <span v-if="isResetting" class="loading-spinner"></span>
                {{ isResetting ? '发送中...' : '发送重置邮件' }}
              </button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { 
  Form as VanForm, 
  Field as VanField, 
  CellGroup as VanCellGroup, 
  Button as VanButton,
  Checkbox as VanCheckbox,
  Popup as VanPopup
} from 'vant'
import 'vant/lib/form/style'
import 'vant/lib/field/style'
import 'vant/lib/cell-group/style'
import 'vant/lib/button/style'
import 'vant/lib/checkbox/style'
import 'vant/lib/popup/style'
import { isPC } from '@/utils/device'

const router = useRouter()
const { login, resetPassword, isLoading } = useAuth()

// 检测设备类型
const isPCDevice = ref(isPC())

// 表单数据
const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
})

// 表单错误
const errors = reactive({
  email: '',
  password: ''
})

// 界面状态
const showPassword = ref(false)
const showForgotPassword = ref(false)
const generalError = ref('')

// 重置密码相关
const resetEmail = ref('')
const resetMessage = ref('')
const resetError = ref('')
const isResetting = ref(false)

// 表单验证规则
const emailRules = [
  { required: true, message: '请输入邮箱地址' },
  { pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, message: '邮箱格式不正确' }
]

const passwordRules = [
  { required: true, message: '请输入密码' }
]

// 表单验证
const validateEmail = () => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!formData.email) {
    errors.email = '请输入邮箱地址'
  } else if (!emailRegex.test(formData.email)) {
    errors.email = '邮箱格式不正确'
  } else {
    errors.email = ''
  }
}

const validatePassword = () => {
  if (!formData.password) {
    errors.password = '请输入密码'
  } else {
    errors.password = ''
  }
}

// 清除错误
const clearError = (field) => {
  errors[field] = ''
  generalError.value = ''
}

// 处理登录
const handleLogin = async () => {
  try {
    generalError.value = ''
    
    // 临时幽默提示 😄
    generalError.value = '你什么身份？还想登录？想的美！！！� 你瞅啥，说的就是你 🫵'
    return
    
    const result = await login(
      formData.email,
      formData.password,
      formData.rememberMe
    )

    if (result.success) {
      // 登录成功，跳转到之前的页面或首页
      const redirectTo = router.currentRoute.value.query.redirect || '/main/home'
      router.push(redirectTo)
    }
  } catch (error) {
    console.error('Login error:', error)
    generalError.value = error.message || '登录失败，请重试'
  }
}

// 处理忘记密码
const handleForgotPassword = async () => {
  if (!resetEmail.value) {
    resetError.value = '请输入邮箱地址'
    return
  }

  try {
    isResetting.value = true
    resetError.value = ''
    resetMessage.value = ''
    
    const result = await resetPassword(resetEmail.value)
    
    if (result.success) {
      resetMessage.value = result.message || '密码重置邮件已发送，请检查邮箱'
      // 3秒后关闭弹窗
      setTimeout(() => {
        showForgotPassword.value = false
        resetEmail.value = ''
        resetMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('Reset password error:', error)
    resetError.value = error.message || '发送重置邮件失败，请重试'
  } finally {
    isResetting.value = false
  }
}

// 导航方法
const goBack = () => {
  router.back()
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, $bg-primary 0%, $bg-secondary 100%);
  position: relative;
  overflow: hidden;
}

.mobile-header {
  @include safe-area-padding(top);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
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
    transition: all $transition-base;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.05);
    }
  }
}

.main-content {
  min-height: 100vh;
  display: flex;
  
  // 移动端布局
  @include mobile {
    flex-direction: column;
    padding-top: 80px;
  }
}

// PC端左侧装饰区域
.decoration-section {
  flex: 2; // 6:4 比例中的 6
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(123, 44, 191, 0.05) 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  overflow: hidden;
  // 与右侧表单区域等高
  min-height: 100vh;
  
  // 入场动画 - 加快速度
  animation: slideInLeft 0.5s ease-out;

  .floating-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    .floating-circle {
      position: absolute;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 44, 191, 0.1));
      backdrop-filter: blur(20px);
      animation: float 6s ease-in-out infinite;

      &.circle-1 {
        width: 200px;
        height: 200px;
        top: 10%;
        left: 10%;
        animation-delay: 0s;
      }

      &.circle-2 {
        width: 150px;
        height: 150px;
        top: 60%;
        right: 20%;
        animation-delay: 2s;
      }

      &.circle-3 {
        width: 100px;
        height: 100px;
        bottom: 20%;
        left: 30%;
        animation-delay: 4s;
      }
    }
  }

  .brand-content {
    margin-top: -50px;
    text-align: center;
    z-index: 1;
    // 品牌内容入场动画 - 加快速度
    animation: fadeInUp 0.6s ease-out 0.2s both;

    .brand-title {
      font-size: 4rem;
      font-weight: $font-bold;
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: $spacing-md;
      // 标题特殊动画
      animation: titleGlow 2s ease-in-out infinite alternate;
    }

    .brand-subtitle {
      font-size: $font-xl;
      color: $text-secondary;
      margin-bottom: $spacing-2xl;
    }

    .feature-highlights {
      display: flex;
      flex-direction: column;
      gap: $spacing-lg;

      .highlight-item {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        padding: $spacing-lg;
        background: rgba(255, 255, 255, 0.03);
        border-radius: $radius-lg;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        // 特性项目依次入场 - 加快速度和缩短间隔
        animation: slideInLeft 0.4s ease-out both;
        
        &:nth-child(1) { animation-delay: 0.4s; }
        &:nth-child(2) { animation-delay: 0.5s; }
        &:nth-child(3) { animation-delay: 0.6s; }

        .highlight-icon {
          font-size: $font-2xl;
        }

        span {
          font-size: $font-base;
          color: $text-primary;
        }
      }
    }
  }
}

// 表单区域
.form-section {
  flex: 1; // 6:4 比例中的 4
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  // 与左侧装饰区域等高
  min-height: 100vh;
  
  // 入场动画 - 加快速度
  animation: slideInRight 0.5s ease-out;
  
  @include mobile {
    padding: $spacing-lg $spacing-lg;
    min-height: calc(100vh - 80px);
    justify-content: flex-start;
    padding-top: $spacing-sm;
    animation: slideInUp 0.5s ease-out;
  }

  .form-container {
    width: 100%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border-radius: $radius-lg;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: $spacing-2xl;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    animation: scaleIn 0.4s ease-out 0.3s both;

    @include mobile {
      padding: $spacing-xl;
      border-radius: $radius-lg;
      background: rgba(255, 255, 255, 0.05);
      margin-top: 0;
      animation: slideInUp 0.4s ease-out 0.1s both;
    }
  }
}

.title-section {
  text-align: center;
  margin-bottom: $spacing-2xl;

  .form-title {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $text-primary;
    margin-bottom: $spacing-sm;
    
    @include mobile {
      font-size: $font-xl;
    }
  }

  .form-subtitle {
    font-size: $font-base;
    color: $text-secondary;
    margin: 0;
    
    @include mobile {
      font-size: $font-sm;
    }
  }
}

.mobile-title-section,
.pc-title-section {
  text-align: center;
  margin-bottom: $spacing-2xl;
  // 标题入场动画 - 加快速度
  animation: fadeInUp 0.4s ease-out 0.4s both;

  .form-title {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $text-primary;
    margin-bottom: $spacing-sm;
    
    @include mobile {
      font-size: $font-xl;
    }
  }

  .form-subtitle {
    font-size: $font-base;
    color: $text-secondary;
    margin: 0;
    
    @include mobile {
      font-size: $font-sm;
    }
  }
}

.login-form {
  // 表单整体入场动画 - 加快速度
  animation: fadeInUp 0.4s ease-out 0.5s both;
  
  .input-group {
    margin-bottom: $spacing-lg;
    // 输入框依次入场 - 加快速度
    animation: slideInUp 0.3s ease-out both;
    
    &:nth-child(1) { animation-delay: 0.6s; }
    &:nth-child(2) { animation-delay: 0.7s; }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-input {
      width: 100%;
      height: 56px;
      padding: 0 $spacing-lg 0 50px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: $radius-lg;
      color: $text-primary;
      font-size: $font-base;
      transition: all $transition-base;
      backdrop-filter: blur(10px);

      &::placeholder {
        color: $text-tertiary;
      }

      &:focus {
        outline: none;
        border-color: $accent-primary;
        background: rgba(0, 212, 255, 0.05);
        box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
      }

      &.error {
        border-color: $accent-error;
        background: rgba(255, 51, 102, 0.05);
      }
    }

    .input-icon {
      position: absolute;
      left: $spacing-md;
      color: $text-secondary;
      pointer-events: none;
      z-index: 1;
    }

    .password-toggle {
      @include button-reset;
      position: absolute;
      right: $spacing-md;
      color: $text-secondary;
      padding: $spacing-xs;
      border-radius: $radius-sm;
      transition: all $transition-base;

      &:hover {
        color: $text-primary;
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .error-text {
      color: $accent-error;
      font-size: $font-sm;
      margin-top: $spacing-xs;
      margin-left: $spacing-sm;
    }
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-xl;
  // 选项区域入场动画 - 加快速度
  animation: fadeInUp 0.3s ease-out 0.8s both;

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;

    .checkbox-input {
      display: none;
    }

    .checkbox-custom {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: $radius-sm;
      background: rgba(255, 255, 255, 0.05);
      position: relative;
      transition: all $transition-base;

      &::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 6px;
        width: 6px;
        height: 10px;
        border: solid $text-primary;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
        transition: opacity $transition-base;
      }
    }

    .checkbox-input:checked + .checkbox-custom {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);

      &::after {
        opacity: 1;
      }
    }

    .checkbox-label {
      color: $text-secondary;
      font-size: $font-sm;
      font-weight: $font-medium;
    }
  }

  .forgot-link {
    @include button-reset;
    color: $text-secondary;
    font-size: $font-sm;
    font-weight: $font-medium;
    transition: color $transition-base;

    &:hover {
      color: $accent-primary;
    }
  }
}

.general-error {
  background: rgba(255, 51, 102, 0.1);
  color: $accent-error;
  padding: $spacing-md;
  border-radius: $radius-md;
  font-size: $font-sm;
  text-align: center;
  margin-bottom: $spacing-lg;
  border: 1px solid rgba(255, 51, 102, 0.2);
}

.login-button {
  @include button-reset;
  @include click-feedback;
  width: 100%;
  height: 56px;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  font-weight: $font-semibold;
  font-size: $font-base;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xl;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2);
  // 登录按钮入场动画 - 加快速度
  animation: scaleIn 0.3s ease-out 0.9s both;

  @include mobile {
    height: 52px;
    font-size: $font-sm;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: $text-primary;
    border-radius: $radius-full;
    animation: spin 1s linear infinite;
  }
}

.register-section {
  text-align: center;
  // 注册链接入场动画 - 加快速度
  animation: fadeInUp 0.3s ease-out 1.0s both;

  .register-text {
    color: $text-secondary;
    font-size: $font-sm;
    margin-right: $spacing-xs;
  }

  .register-link {
    @include button-reset;
    color: $accent-primary;
    font-size: $font-sm;
    font-weight: $font-semibold;
    transition: color $transition-base;

    &:hover {
      color: lighten($accent-primary, 10%);
    }
  }
}

// 动画
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 入场动画
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes titleGlow {
  from {
    filter: brightness(1);
  }
  to {
    filter: brightness(1.2);
  }
}

// 忘记密码弹窗样式
.forgot-popup {
  padding: $spacing-lg 0;

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

  .popup-content {
    padding: $spacing-lg 0;
  }

  .popup-actions {
    padding: 0 $spacing-lg;
    margin-top: $spacing-lg;
  }
}

.reset-button {
  @include button-reset;
  @include click-feedback;
  width: 100%;
  height: 48px;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  font-weight: $font-semibold;
  font-size: $font-base;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: $text-primary;
    border-radius: $radius-full;
    animation: spin 1s linear infinite;
  }
}

.success-message {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: $spacing-md;
  border-radius: $radius-md;
  font-size: $font-sm;
  text-align: center;
  margin: $spacing-md 0;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.error-message {
  background: rgba(255, 51, 102, 0.1);
  color: $accent-error;
  padding: $spacing-md;
  border-radius: $radius-md;
  font-size: $font-sm;
  text-align: center;
  margin: $spacing-md 0;
  border: 1px solid rgba(255, 51, 102, 0.2);
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

:deep(.van-cell-group--inset) {
  border-radius: $radius-lg;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

:deep(.van-cell) {
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: $spacing-lg;

  &:last-child {
    border-bottom: none;
  }
}

:deep(.van-field__label) {
  color: $text-secondary;
  font-weight: $font-medium;
  width: 60px;
}

:deep(.van-field__control) {
  color: $text-primary;
  font-size: $font-base;
  background: transparent;

  &::placeholder {
    color: $text-tertiary;
    font-size: $font-sm;
  }
}

:deep(.van-button) {
  border-radius: $radius-md;
  font-weight: $font-semibold;
  height: 48px;
}
.login-page {
  height: 100vh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  @include safe-area-padding(top);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  // PC端隐藏返回按钮
  @media (min-width: $breakpoint-lg) {
    display: none;
  }

  .back-button {
    @include button-reset;
    @include click-feedback;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;
    @include flex-center;
    transition: background $transition-base;

    @include hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .page-title {
    font-size: $font-xl;
    font-weight: $font-semibold;
    margin: 0;
    color: $text-primary;
  }

  .header-placeholder {
    width: 40px;
  }
}

.page-content {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;
  
  // 移动端布局
  @include mobile {
    padding: $spacing-lg;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  // PC端布局
  @media (min-width: $breakpoint-lg) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-2xl;
  }
}

.welcome-section {
  text-align: center;
  margin-bottom: $spacing-2xl;

  @include mobile {
    margin-bottom: $spacing-xl;
  }

  .welcome-title {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $text-primary;
    margin: 0 0 $spacing-sm 0;
    
    @include mobile {
      font-size: $font-xl;
    }
  }

  .welcome-subtitle {
    font-size: $font-base;
    color: $text-secondary;
    margin: 0;
    
    @include mobile {
      font-size: $font-sm;
    }
  }
}

.form-section {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  
  @media (min-width: $breakpoint-lg) {
    max-width: 500px;
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: $spacing-lg 0;
  padding: 0 $spacing-md;

  .forgot-link {
    @include button-reset;
    color: $text-secondary;
    font-size: $font-sm;
    font-weight: $font-medium;
    text-decoration: none;
    transition: color $transition-base;

    &:hover {
      color: $accent-primary;
      text-decoration: underline;
    }
  }
}

.password-toggle {
  @include button-reset;
  color: $text-secondary;
  padding: $spacing-xs;
  border-radius: $radius-sm;
  transition: all $transition-base;

  &:hover {
    color: $text-primary;
    background: rgba(255, 255, 255, 0.05);
  }
}

.error-message {
  background: rgba(255, 51, 102, 0.1);
  color: $accent-error;
  padding: $spacing-md;
  border-radius: $radius-md;
  font-size: $font-sm;
  text-align: center;
  margin: $spacing-md 0;
  border: 1px solid rgba(255, 51, 102, 0.2);
}

.success-message {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: $spacing-md;
  border-radius: $radius-md;
  font-size: $font-sm;
  text-align: center;
  margin: $spacing-md 0;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.form-actions {
  margin: $spacing-xl 0;
}

.login-button {
  @include button-reset;
  @include click-feedback;
  width: 100%;
  padding: $spacing-md;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  font-weight: $font-semibold;
  font-size: $font-base;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;

  @include mobile {
    padding: $spacing-sm $spacing-md;
    font-size: $font-sm;
  }

  // 只在桌面端启用 hover 效果
  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled) {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
    }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: $text-primary;
    border-radius: $radius-full;
    animation: spin 1s linear infinite;
  }
}

.reset-button {
  @include button-reset;
  @include click-feedback;
  width: 100%;
  padding: $spacing-md;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  font-weight: $font-semibold;
  font-size: $font-base;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;

  @include mobile {
    padding: $spacing-sm $spacing-md;
    font-size: $font-sm;
  }

  // 只在桌面端启用 hover 效果
  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled) {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
    }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: $text-primary;
    border-radius: $radius-full;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.register-section {
  text-align: center;
  margin-top: $spacing-xl;

  .register-text {
    color: $text-secondary;
    font-size: $font-sm;
    margin: 0;
  }

  .register-link {
    @include button-reset;
    color: $text-secondary;
    font-weight: $font-semibold;
    text-decoration: none;
    transition: color $transition-base;

    &:hover {
      color: $accent-primary;
      text-decoration: underline;
    }
  }
}

// 忘记密码弹窗
.forgot-popup {
  padding: $spacing-lg 0;

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

  .popup-content {
    padding: $spacing-lg 0;
  }

  .popup-actions {
    padding: 0 $spacing-lg;
    margin-top: $spacing-lg;
  }
}

// Vant 组件样式覆盖
:deep(.van-cell-group) {
  background: transparent;
  margin: 0 0 $spacing-lg;
}

:deep(.van-cell-group--inset) {
  border-radius: $radius-lg;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

:deep(.van-cell) {
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: $spacing-lg;

  &:last-child {
    border-bottom: none;
  }
}

:deep(.van-field__label) {
  color: $text-secondary;
  font-weight: $font-medium;
  width: 60px;
}

:deep(.van-field__control) {
  color: $text-primary;
  font-size: $font-base;
  background: transparent;

  &::placeholder {
    color: $text-tertiary;
  }
}

:deep(.van-button) {
  border-radius: $radius-md;
  font-weight: $font-semibold;
  height: 48px;
}

:deep(.van-checkbox) {
  .van-checkbox__label {
    color: $text-secondary;
    font-size: $font-sm;
    font-weight: $font-medium;
  }

  .van-checkbox__icon {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }

  .van-checkbox__icon--checked {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    
    .van-checkbox__icon-inner {
      border-color: $text-primary;
    }
  }

  &:hover .van-checkbox__icon {
    border-color: rgba(255, 255, 255, 0.4);
  }
}

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
</style>