<template>
  <div class="download-page">
    <div class="download-container">
      <!-- App 图标和名称 -->
      <div class="app-header">
        <div class="app-icon">
          <img src="/favicon.svg" alt="NeuroFlex">
        </div>
        <h1 class="app-name">NeuroFlex</h1>
        <p class="app-desc">认知训练系统</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="fetchAppInfo">
          重试
        </button>
      </div>

      <!-- 版本信息 -->
      <div v-else class="version-info">
        <!-- 开发环境提示 -->
        <div v-if="isDev" class="dev-notice">
          <div class="dev-icon">🚧</div>
          <div class="dev-text">
            <div class="dev-title">开发环境</div>
            <div class="dev-desc">CDN和APK文件尚未部署，将自动使用GitHub直链</div>
          </div>
        </div>

        <div class="version-badge">
          <span class="version-label">最新版本</span>
          <span class="version-number">v{{ appInfo.version }}</span>
        </div>

        <div v-if="appInfo.releaseDate" class="release-date">
          发布于 {{ formatDate(appInfo.releaseDate) }}
        </div>

        <!-- 下载按钮 -->
        <button
          class="download-btn"
          :class="{ 'is-downloading': downloading }"
          :disabled="!appInfo.downloadUrl || downloading"
          @click="handleDownload"
        >
          <svg v-if="!downloading" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <div v-else class="btn-spinner" />
          <span>{{ downloading ? '下载中...' : '下载 APK' }}</span>
        </button>

        <!-- 更新日志 -->
        <div v-if="appInfo.changelog" class="changelog">
          <h3>更新内容</h3>
          <p>{{ appInfo.changelog }}</p>
        </div>
      </div>

      <!-- 功能特性 -->
      <div class="features">
        <h3>功能特性</h3>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🧠</div>
            <span>科学认知训练</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <span>多维能力提升</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🎯</div>
            <span>个性化训练计划</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📈</div>
            <span>详细数据分析</span>
          </div>
        </div>
      </div>

      <!-- 安装说明 -->
      <div class="install-tips">
        <h3>安装说明</h3>
        <div class="tips-list">
          <div class="tip-item">
            <div class="tip-number">1</div>
            <span>点击下载按钮获取 APK 文件</span>
          </div>
          <div class="tip-item">
            <div class="tip-number">2</div>
            <span>打开下载的文件进行安装</span>
          </div>
          <div class="tip-item">
            <div class="tip-number">3</div>
            <span>如提示风险，请选择「仍要安装」</span>
          </div>
          <div class="tip-item">
            <div class="tip-number">4</div>
            <span>首次使用需授予相关权限</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const appInfo = ref({
  version: '',
  versionCode: 0,
  downloadUrl: '',
  changelog: '',
  releaseDate: '',
})
const loading = ref(true)
const downloading = ref(false)
const error = ref(null)

// 检测开发环境
const isDev = import.meta.env.DEV

// 检测是否为移动设备
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 获取版本信息
async function fetchAppInfo() {
  try {
    const response = await fetch('/app-version.json')
    if (!response.ok)
      throw new Error('获取版本信息失败')
    appInfo.value = await response.json()
  }
  catch (e) {
    error.value = e.message
  }
  finally {
    loading.value = false
  }
}

// 下载 APK
async function handleDownload() {
  if (!appInfo.value.downloadUrl || downloading.value)
    return

  downloading.value = true
  try {
    // 优先使用 CDN 下载链接，如果失败则降级到 GitHub
    let downloadUrl = appInfo.value.downloadUrl
    let githubUrl = appInfo.value.githubUrl || downloadUrl
    
    // 移动端直接使用 window.location.href，不通过 blob
    // 因为移动浏览器不支持通过 JavaScript 触发的 download 属性
    if (isMobileDevice()) {
      // 移动端：先尝试CDN，失败则使用GitHub
      try {
        // 先测试CDN是否可用
        const testResponse = await fetch(downloadUrl, { method: 'HEAD' })
        if (testResponse.ok) {
          window.location.href = downloadUrl
        } else {
          throw new Error('CDN不可用')
        }
      } catch (cdnError) {
        console.warn('CDN下载失败，使用GitHub直链:', cdnError.message)
        window.location.href = githubUrl
      }

      // 延迟重置状态，给浏览器时间处理下载
      setTimeout(() => {
        downloading.value = false
      }, 1000)
      return
    }

    // 桌面端：使用 blob 方式下载（支持自定义文件名）
    let finalUrl = downloadUrl
    let downloadSource = 'CDN'
    
    try {
      // 先尝试CDN下载
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`CDN响应错误: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `NeuroFlex-v${appInfo.value.version}.apk`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`✅ 通过${downloadSource}下载成功`)
      downloading.value = false
    } catch (cdnError) {
      console.warn('CDN下载失败，尝试GitHub直链:', cdnError.message)
      
      try {
        // 降级到GitHub直链
        finalUrl = githubUrl
        downloadSource = 'GitHub'
        
        const response = await fetch(githubUrl)
        if (!response.ok) {
          throw new Error(`GitHub响应错误: ${response.status}`)
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `NeuroFlex-v${appInfo.value.version}.apk`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log(`✅ 通过${downloadSource}下载成功`)
        downloading.value = false
      } catch (githubError) {
        console.error('GitHub下载也失败:', githubError.message)
        
        // 最终降级：直接跳转
        console.log('使用浏览器直接下载...')
        window.location.href = githubUrl
        downloading.value = false
      }
    }
  }
  catch (error) {
    console.error('下载过程出错:', error)
    // 最终兜底：直接跳转GitHub下载
    const fallbackUrl = appInfo.value.githubUrl || appInfo.value.downloadUrl
    console.log('使用兜底方案:', fallbackUrl)
    window.location.href = fallbackUrl
    downloading.value = false
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr)
    return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(() => {
  fetchAppInfo()
})
</script>

<style lang="scss" scoped>
.download-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: $bg-primary;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  @media (min-width: $breakpoint-md) {
    padding: $spacing-xl;
  }
}

.download-container {
  max-width: 420px;
  width: 100%;
  height: calc(100vh - #{$spacing-lg});
  height: calc(100dvh - #{$spacing-lg});
  background: $glass-bg;
  backdrop-filter: $glass-backdrop;
  border: 1px solid $glass-border;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $glass-shadow;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  // PC端调整
  @media (min-width: $breakpoint-md) {
    max-width: 480px;
    height: auto;
    max-height: calc(100vh - #{$spacing-2xl});
    max-height: calc(100dvh - #{$spacing-2xl});
    padding: $spacing-xl;
  }

  // 大屏幕优化
  @media (min-width: $breakpoint-lg) {
    max-width: 520px;
  }

  // 隐藏滚动条但保留滚动功能
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.app-header {
  text-align: center;
  margin-bottom: $spacing-lg;

  @media (min-width: $breakpoint-md) {
    margin-bottom: $spacing-xl;
  }
}

.app-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto $spacing-md;
  border-radius: $radius-lg;
  overflow: hidden;
  background: $glass-bg;
  border: 1px solid $glass-border;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: $breakpoint-md) {
    width: 96px;
    height: 96px;
    margin-bottom: $spacing-lg;
  }

  img {
    width: 64px;
    height: 64px;
    object-fit: cover;

    @media (min-width: $breakpoint-md) {
      width: 80px;
      height: 80px;
    }
  }
}

.app-name {
  font-size: $font-2xl;
  font-weight: $font-bold;
  color: $text-primary;
  margin-bottom: $spacing-sm;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (min-width: $breakpoint-md) {
    font-size: $font-3xl;
  }
}

.app-desc {
  font-size: $font-base;
  color: $text-secondary;
  margin: 0;

  @media (min-width: $breakpoint-md) {
    font-size: $font-lg;
  }
}

.loading-state,
.error-state {
  text-align: center;
  padding: $spacing-xl 0;
  color: $text-secondary;
}

.spinner,
.btn-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: $accent-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto $spacing-md;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-lg;
  background: $glass-bg;
  color: $accent-primary;
  border: 1px solid $accent-primary;
  border-radius: $radius-md;
  font-size: $font-sm;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    background: rgba(0, 212, 255, 0.1);
  }
}

.version-info {
  text-align: center;
  margin-bottom: $spacing-lg;

  @media (min-width: $breakpoint-md) {
    margin-bottom: $spacing-xl;
  }
}

.dev-notice {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: rgba(255, 170, 0, 0.1);
  border: 1px solid rgba(255, 170, 0, 0.3);
  border-radius: $radius-md;
  margin-bottom: $spacing-lg;
  text-align: left;

  .dev-icon {
    font-size: $font-lg;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .dev-text {
    flex: 1;
  }

  .dev-title {
    font-size: $font-sm;
    font-weight: $font-semibold;
    color: #ffaa00;
    margin-bottom: $spacing-xs;
  }

  .dev-desc {
    font-size: $font-xs;
    color: $text-secondary;
    line-height: 1.4;
  }
}

.version-badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  background: $glass-bg;
  border: 1px solid $glass-border;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-full;
  margin-bottom: $spacing-md;
}

.version-label {
  font-size: $font-sm;
  color: $text-secondary;
}

.version-number {
  font-size: $font-sm;
  font-weight: $font-semibold;
  color: $accent-primary;
}

.release-date {
  font-size: $font-sm;
  color: $text-tertiary;
  margin-bottom: $spacing-lg;
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  width: 100%;
  padding: $spacing-md $spacing-lg;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: white;
  border: none;
  border-radius: $radius-md;
  font-size: $font-base;
  font-weight: $font-semibold;
  cursor: pointer;
  transition: all $transition-base;
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);

  .icon {
    width: 20px;
    height: 20px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.is-downloading {
    background: linear-gradient(135deg, $accent-secondary, $accent-primary);
  }
}

.changelog {
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $radius-md;
  text-align: left;

  h3 {
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

.features,
.install-tips {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $glass-border;

  @media (min-width: $breakpoint-md) {
    margin-top: $spacing-xl;
    padding-top: $spacing-lg;
  }

  h3 {
    font-size: $font-lg;
    font-weight: $font-semibold;
    color: $text-primary;
    margin: 0 0 $spacing-md 0;
    text-align: center;

    @media (min-width: $breakpoint-md) {
      font-size: $font-xl;
      margin-bottom: $spacing-lg;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;

  @media (min-width: $breakpoint-md) {
    gap: $spacing-lg;
  }
}

.feature-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $radius-sm;
  font-size: $font-sm;
  color: $text-secondary;

  @media (min-width: $breakpoint-md) {
    padding: $spacing-md;
    font-size: $font-base;
    gap: $spacing-md;
  }

  .feature-icon {
    font-size: $font-lg;
    flex-shrink: 0;

    @media (min-width: $breakpoint-md) {
      font-size: $font-xl;
    }
  }
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.5;

  .tip-number {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: white;
    border-radius: 50%;
    font-size: $font-xs;
    font-weight: $font-semibold;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

@media (max-width: $breakpoint-sm) {
  .download-page {
    padding: $spacing-md;
  }

  .download-container {
    padding: $spacing-lg;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>