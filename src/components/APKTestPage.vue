<template>
  <div class="apk-test-page apk-safe-area">
    <div class="test-header apk-status-bar">
      <h1>APK 环境测试</h1>
      <p>测试原生应用环境下的功能</p>
    </div>

    <div class="test-content">
      <!-- 环境信息 -->
      <div class="info-section">
        <h3>环境信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">运行环境:</span>
            <span class="value" :class="{ 'highlight': deviceInfo.isAPK }">
              {{ deviceInfo.isAPK ? 'APK应用' : 'Web浏览器' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">设备类型:</span>
            <span class="value">{{ deviceType }}</span>
          </div>
          <div class="info-item">
            <span class="label">显示模式:</span>
            <span class="value">{{ displayMode }}</span>
          </div>
          <div class="info-item">
            <span class="label">屏幕特征:</span>
            <span class="value">{{ screenFeatures }}</span>
          </div>
        </div>
      </div>

      <!-- 安全区域信息 -->
      <div class="info-section">
        <h3>安全区域信息</h3>
        <div class="safe-area-visual">
          <div class="safe-area-display">
            <div class="safe-area-top" :style="{ height: `${safeAreaInsets.top}px` }">
              顶部: {{ safeAreaInsets.top }}px
            </div>
            <div class="safe-area-content">
              <div class="safe-area-left" :style="{ width: `${safeAreaInsets.left}px` }">
                {{ safeAreaInsets.left }}px
              </div>
              <div class="safe-area-center">
                内容区域
                <br>
                {{ deviceInfo.viewportWidth }}×{{ deviceInfo.viewportHeight }}
              </div>
              <div class="safe-area-right" :style="{ width: `${safeAreaInsets.right}px` }">
                {{ safeAreaInsets.right }}px
              </div>
            </div>
            <div class="safe-area-bottom" :style="{ height: `${safeAreaInsets.bottom}px` }">
              底部: {{ safeAreaInsets.bottom }}px
            </div>
          </div>
        </div>
      </div>

      <!-- 功能测试 -->
      <div class="function-tests">
        <h3>功能测试</h3>
        
        <!-- 状态栏控制 -->
        <div class="test-group">
          <h4>状态栏控制</h4>
          <div class="button-group">
            <button class="test-btn" @click="setStatusBarDark">深色状态栏</button>
            <button class="test-btn" @click="setStatusBarLight">浅色状态栏</button>
            <button class="test-btn" @click="hideStatusBar">隐藏状态栏</button>
            <button class="test-btn" @click="showStatusBar">显示状态栏</button>
          </div>
        </div>

        <!-- 触觉反馈 -->
        <div class="test-group">
          <h4>触觉反馈</h4>
          <div class="button-group">
            <button class="test-btn" @click="triggerHaptic('light')">轻触反馈</button>
            <button class="test-btn" @click="triggerHaptic('medium')">中等反馈</button>
            <button class="test-btn" @click="triggerHaptic('heavy')">重触反馈</button>
          </div>
        </div>

        <!-- 屏幕方向 -->
        <div class="test-group">
          <h4>屏幕方向</h4>
          <div class="button-group">
            <button class="test-btn" @click="lockOrientation('portrait')">锁定竖屏</button>
            <button class="test-btn" @click="lockOrientation('landscape')">锁定横屏</button>
            <button class="test-btn" @click="unlockOrientation">解锁方向</button>
          </div>
        </div>

        <!-- 安全区域测试 -->
        <div class="test-group">
          <h4>安全区域适配测试</h4>
          <div class="safe-area-test-buttons mobile-button-group">
            <button class="action-button primary button mobile-touch-target apk-safe-area">
              <span>安全区域按钮</span>
            </button>
            <button class="action-button secondary button mobile-touch-target fullscreen-safe-area">
              <span>全屏安全区域</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 性能信息 -->
      <div class="info-section">
        <h3>性能信息</h3>
        <div class="performance-info">
          <div class="perf-item">
            <span class="label">内存使用:</span>
            <span class="value">{{ memoryInfo }}</span>
          </div>
          <div class="perf-item">
            <span class="label">设备像素比:</span>
            <span class="value">{{ deviceInfo.pixelRatio }}</span>
          </div>
          <div class="perf-item">
            <span class="label">硬件加速:</span>
            <span class="value">{{ hardwareAcceleration ? '启用' : '禁用' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试结果模态框 -->
    <Modal
      v-model:visible="showTestResult"
      title="测试结果"
      :show-footer="false"
    >
      <div class="test-result">
        <p>{{ testResultMessage }}</p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  isAPKEnvironment, 
  getDeviceInfo, 
  setStatusBarStyle, 
  hideStatusBar, 
  showStatusBar,
  onOrientationChange,
  onSafeAreaChange
} from '@/utils/apk-adapter'
import Modal from './Modal.vue'

const deviceInfo = ref({
  isAPK: false,
  isAndroid: false,
  isIOS: false,
  hasNotch: false,
  hasDynamicIsland: false,
  isStandalone: false,
  isFullscreen: false,
  safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  screenWidth: 0,
  screenHeight: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  pixelRatio: 1,
  orientation: 'portrait'
})

const safeAreaInsets = ref({ top: 0, right: 0, bottom: 0, left: 0 })
const showTestResult = ref(false)
const testResultMessage = ref('')
const memoryInfo = ref('未知')
const hardwareAcceleration = ref(false)

// 清理函数
let orientationCleanup = null
let safeAreaCleanup = null

const deviceType = computed(() => {
  const info = deviceInfo.value
  let type = []
  
  if (info.isAndroid) type.push('Android')
  if (info.isIOS) type.push('iOS')
  if (info.hasNotch) type.push('刘海屏')
  if (info.hasDynamicIsland) type.push('动态岛')
  
  return type.length > 0 ? type.join(' + ') : '未知设备'
})

const displayMode = computed(() => {
  const info = deviceInfo.value
  if (info.isFullscreen) return '全屏模式'
  if (info.isStandalone) return '独立应用模式'
  return '浏览器模式'
})

const screenFeatures = computed(() => {
  const info = deviceInfo.value
  let features = []
  
  if (info.hasNotch) features.push('刘海屏')
  if (info.hasDynamicIsland) features.push('动态岛')
  if (info.pixelRatio > 2) features.push('高分辨率')
  
  return features.length > 0 ? features.join(', ') : '标准屏幕'
})

// 状态栏控制
async function setStatusBarDark() {
  try {
    await setStatusBarStyle('dark')
    showResult('状态栏已设置为深色模式')
  } catch (error) {
    showResult('状态栏设置失败: ' + error.message)
  }
}

async function setStatusBarLight() {
  try {
    await setStatusBarStyle('light')
    showResult('状态栏已设置为浅色模式')
  } catch (error) {
    showResult('状态栏设置失败: ' + error.message)
  }
}

async function hideStatusBar() {
  try {
    await hideStatusBar()
    showResult('状态栏已隐藏')
  } catch (error) {
    showResult('隐藏状态栏失败: ' + error.message)
  }
}

async function showStatusBar() {
  try {
    await showStatusBar()
    showResult('状态栏已显示')
  } catch (error) {
    showResult('显示状态栏失败: ' + error.message)
  }
}

// 触觉反馈
async function triggerHaptic(type) {
  if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
    try {
      const { Haptics } = window.Capacitor.Plugins
      
      switch (type) {
        case 'light':
          await Haptics.impact({ style: 'LIGHT' })
          break
        case 'medium':
          await Haptics.impact({ style: 'MEDIUM' })
          break
        case 'heavy':
          await Haptics.impact({ style: 'HEAVY' })
          break
      }
      
      showResult(`${type} 触觉反馈已触发`)
    } catch (error) {
      showResult('触觉反馈失败: ' + error.message)
    }
  } else {
    showResult('触觉反馈不可用（需要原生环境）')
  }
}

// 屏幕方向控制
async function lockOrientation(orientation) {
  if (window.Capacitor && window.Capacitor.Plugins.ScreenOrientation) {
    try {
      const { ScreenOrientation } = window.Capacitor.Plugins
      await ScreenOrientation.lock({ orientation })
      showResult(`屏幕已锁定为${orientation === 'portrait' ? '竖屏' : '横屏'}模式`)
    } catch (error) {
      showResult('屏幕方向锁定失败: ' + error.message)
    }
  } else {
    showResult('屏幕方向控制不可用（需要原生环境）')
  }
}

async function unlockOrientation() {
  if (window.Capacitor && window.Capacitor.Plugins.ScreenOrientation) {
    try {
      const { ScreenOrientation } = window.Capacitor.Plugins
      await ScreenOrientation.unlock()
      showResult('屏幕方向已解锁')
    } catch (error) {
      showResult('屏幕方向解锁失败: ' + error.message)
    }
  } else {
    showResult('屏幕方向控制不可用（需要原生环境）')
  }
}

// 显示测试结果
function showResult(message) {
  testResultMessage.value = message
  showTestResult.value = true
  console.log('测试结果:', message)
}

// 获取内存信息
function getMemoryInfo() {
  if (performance.memory) {
    const used = Math.round(performance.memory.usedJSHeapSize / 1048576)
    const total = Math.round(performance.memory.totalJSHeapSize / 1048576)
    memoryInfo.value = `${used}MB / ${total}MB`
  } else {
    memoryInfo.value = '不可用'
  }
}

// 检测硬件加速
function checkHardwareAcceleration() {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  hardwareAcceleration.value = !!gl
}

// 更新设备信息
function updateDeviceInfo() {
  const info = getDeviceInfo()
  info.isAPK = isAPKEnvironment()
  deviceInfo.value = info
  safeAreaInsets.value = info.safeAreaInsets
}

onMounted(() => {
  // 初始化设备信息
  updateDeviceInfo()
  
  // 获取性能信息
  getMemoryInfo()
  checkHardwareAcceleration()
  
  // 监听方向变化
  orientationCleanup = onOrientationChange((newDeviceInfo) => {
    deviceInfo.value = { ...deviceInfo.value, ...newDeviceInfo }
  })
  
  // 监听安全区域变化
  safeAreaCleanup = onSafeAreaChange((newSafeAreaInsets) => {
    safeAreaInsets.value = newSafeAreaInsets
  })
  
  // 定期更新内存信息
  const memoryInterval = setInterval(getMemoryInfo, 5000)
  
  onUnmounted(() => {
    clearInterval(memoryInterval)
  })
})

onUnmounted(() => {
  // 清理监听器
  if (orientationCleanup) orientationCleanup()
  if (safeAreaCleanup) safeAreaCleanup()
})
</script>

<style lang="scss" scoped>
.apk-test-page {
  @include min-viewport-height(dynamic);
  background: $bg-primary;
  color: $text-primary;
  
  @include mobile {
    @include min-viewport-height(small);
  }
}

.test-header {
  padding: $spacing-xl $spacing-lg;
  text-align: center;
  background: linear-gradient(135deg, $bg-secondary, $bg-tertiary);
  
  h1 {
    font-size: $font-3xl;
    margin-bottom: $spacing-sm;
    
    @include mobile {
      font-size: $font-2xl;
    }
  }
  
  p {
    color: $text-secondary;
    margin: 0;
  }
}

.test-content {
  padding: $spacing-lg;
  max-width: 800px;
  margin: 0 auto;
  
  @include mobile {
    padding: $spacing-md;
  }
}

.info-section, .function-tests {
  margin-bottom: $spacing-2xl;
  
  h3 {
    margin-bottom: $spacing-lg;
    color: $accent-primary;
    font-size: $font-xl;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing-md;
  
  @include mobile {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
}

.info-item, .perf-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-md;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  .label {
    color: $text-secondary;
    font-weight: $font-medium;
  }
  
  .value {
    color: $text-primary;
    font-weight: $font-semibold;
    
    &.highlight {
      color: $accent-success;
    }
  }
}

.safe-area-visual {
  margin-top: $spacing-lg;
}

.safe-area-display {
  border: 2px solid $accent-primary;
  border-radius: $radius-md;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  
  .safe-area-top, .safe-area-bottom {
    background: rgba(255, 170, 0, 0.3);
    color: $text-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-sm;
    font-weight: $font-medium;
    min-height: 20px;
  }
  
  .safe-area-content {
    display: flex;
    min-height: 100px;
    
    .safe-area-left, .safe-area-right {
      background: rgba(0, 212, 255, 0.3);
      color: $text-primary;
      display: flex;
      align-items: center;
      justify-content: center;
      writing-mode: vertical-rl;
      font-size: $font-sm;
      font-weight: $font-medium;
      min-width: 20px;
    }
    
    .safe-area-center {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.05);
      color: $text-primary;
      font-weight: $font-medium;
      text-align: center;
    }
  }
}

.test-group {
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.08);
  
  h4 {
    margin-bottom: $spacing-md;
    color: $text-secondary;
    font-size: $font-base;
  }
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  
  @include mobile {
    flex-direction: column;
  }
}

.test-btn {
  @include button-reset;
  @include mobile-button;
  padding: $spacing-sm $spacing-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  border-radius: $radius-md;
  font-weight: $font-medium;
  transition: all $transition-base;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
  }
  
  @include mobile {
    &:hover {
      transform: none;
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
}

.safe-area-test-buttons {
  margin-top: $spacing-md;
}

.action-button {
  @include button-reset;
  @include mobile-button;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-lg $spacing-xl;
  border-radius: $radius-md;
  font-size: $font-base;
  font-weight: $font-semibold;
  transition: all $transition-base;
  
  @include mobile {
    padding: $spacing-md $spacing-lg;
    font-size: $font-sm;
  }

  &.primary {
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0, 212, 255, 0.6);
    }
    
    @include mobile {
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
      
      &:hover {
        transform: none;
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
      }
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: $text-primary;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    @include mobile {
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
}

.performance-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  
  @include mobile {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
}

.test-result {
  padding: $spacing-lg;
  text-align: center;
  
  p {
    margin: 0;
    font-size: $font-base;
    color: $text-primary;
  }
}
</style>