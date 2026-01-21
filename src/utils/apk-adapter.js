/**
 * APK 环境适配工具
 * 处理原生应用环境下的特殊需求
 */

/**
 * 检测是否在APK环境中运行
 */
export function isAPKEnvironment() {
  // 检测是否为standalone模式（PWA安装后或APK）
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  
  // 检测是否有Capacitor或Cordova环境
  const hasCapacitor = window.Capacitor !== undefined
  const hasCordova = window.cordova !== undefined
  
  // 检测User Agent中的原生应用标识
  const userAgent = navigator.userAgent.toLowerCase()
  const isNativeApp = userAgent.includes('wv') || // WebView标识
                      userAgent.includes('capacitor') ||
                      userAgent.includes('cordova')
  
  return isStandalone || hasCapacitor || hasCordova || isNativeApp
}

/**
 * 检测设备类型和特征
 */
export function getDeviceInfo() {
  const userAgent = navigator.userAgent.toLowerCase()
  
  return {
    // 基础设备信息
    isAndroid: /android/.test(userAgent),
    isIOS: /iphone|ipad|ipod/.test(userAgent),
    
    // 屏幕特征
    hasNotch: hasNotchScreen(),
    hasDynamicIsland: hasDynamicIslandScreen(),
    
    // 显示模式
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    isFullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
    
    // 安全区域
    safeAreaInsets: getSafeAreaInsets(),
    
    // 屏幕信息
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    
    // 方向信息
    orientation: getOrientation()
  }
}

/**
 * 检测是否有刘海屏
 */
function hasNotchScreen() {
  // 通过安全区域检测刘海屏
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-inset-top').replace('px', '')) || 0
  
  // iPhone X 系列的刘海屏通常有44px的安全区域
  // Android 刘海屏通常有24px以上的安全区域
  return safeAreaTop > 20
}

/**
 * 检测是否有动态岛（iPhone 14 Pro系列）
 */
function hasDynamicIslandScreen() {
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPhone = /iphone/.test(userAgent)
  
  if (!isIPhone) return false
  
  // 通过屏幕尺寸和安全区域判断
  const { screenWidth, screenHeight } = window.screen
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-inset-top').replace('px', '')) || 0
  
  // iPhone 14 Pro: 393x852, iPhone 14 Pro Max: 430x932
  const isDynamicIslandSize = (screenWidth === 393 && screenHeight === 852) ||
                              (screenWidth === 430 && screenHeight === 932)
  
  return isDynamicIslandSize && safeAreaTop >= 47
}

/**
 * 获取安全区域信息
 */
function getSafeAreaInsets() {
  const computedStyle = getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top').replace('px', '')) || 0,
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right').replace('px', '')) || 0,
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom').replace('px', '')) || 0,
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left').replace('px', '')) || 0
  }
}

/**
 * 获取设备方向
 */
function getOrientation() {
  if (screen.orientation) {
    return screen.orientation.type
  }
  
  // 回退方案
  const { innerWidth, innerHeight } = window
  if (innerWidth > innerHeight) {
    return 'landscape'
  } else {
    return 'portrait'
  }
}

/**
 * 设置状态栏样式（需要Capacitor插件支持）
 */
export async function setStatusBarStyle(style = 'dark') {
  if (window.Capacitor && window.Capacitor.Plugins.StatusBar) {
    try {
      const { StatusBar } = window.Capacitor.Plugins
      
      if (style === 'dark') {
        await StatusBar.setStyle({ style: 'DARK' })
      } else {
        await StatusBar.setStyle({ style: 'LIGHT' })
      }
      
      // 设置状态栏背景色
      await StatusBar.setBackgroundColor({ color: '#0f0f1e' })
    } catch (error) {
      console.warn('StatusBar plugin not available:', error)
    }
  }
}

/**
 * 隐藏状态栏（全屏游戏模式）
 */
export async function hideStatusBar() {
  if (window.Capacitor && window.Capacitor.Plugins.StatusBar) {
    try {
      const { StatusBar } = window.Capacitor.Plugins
      await StatusBar.hide()
    } catch (error) {
      console.warn('StatusBar plugin not available:', error)
    }
  }
}

/**
 * 显示状态栏
 */
export async function showStatusBar() {
  if (window.Capacitor && window.Capacitor.Plugins.StatusBar) {
    try {
      const { StatusBar } = window.Capacitor.Plugins
      await StatusBar.show()
    } catch (error) {
      console.warn('StatusBar plugin not available:', error)
    }
  }
}

/**
 * 设置导航栏颜色（Android）
 */
export async function setNavigationBarColor(color = '#0f0f1e') {
  if (window.Capacitor && window.Capacitor.Plugins.StatusBar) {
    try {
      const { StatusBar } = window.Capacitor.Plugins
      await StatusBar.setNavigationBarColor({ color })
    } catch (error) {
      console.warn('Navigation bar color setting not available:', error)
    }
  }
}

/**
 * 监听设备方向变化
 */
export function onOrientationChange(callback) {
  const handleOrientationChange = () => {
    const deviceInfo = getDeviceInfo()
    callback(deviceInfo)
  }
  
  // 监听方向变化
  window.addEventListener('orientationchange', handleOrientationChange)
  screen.orientation?.addEventListener('change', handleOrientationChange)
  
  // 返回清理函数
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange)
    screen.orientation?.removeEventListener('change', handleOrientationChange)
  }
}

/**
 * 监听安全区域变化
 */
export function onSafeAreaChange(callback) {
  // 创建ResizeObserver监听安全区域变化
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      const safeAreaInsets = getSafeAreaInsets()
      callback(safeAreaInsets)
    })
    
    observer.observe(document.documentElement)
    
    return () => observer.disconnect()
  }
  
  // 回退方案：监听窗口大小变化
  const handleResize = () => {
    const safeAreaInsets = getSafeAreaInsets()
    callback(safeAreaInsets)
  }
  
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}

// 存储清理函数
let apkCleanupFunctions = []
let isAPKInitialized = false

/**
 * 初始化APK环境适配
 */
export function initAPKAdapter() {
  if (isAPKInitialized) return
  
  const deviceInfo = getDeviceInfo()
  
  // 添加设备信息到body类名
  const classesToAdd = []
  
  if (deviceInfo.isAndroid) classesToAdd.push('android-device')
  if (deviceInfo.isIOS) classesToAdd.push('ios-device')
  if (deviceInfo.hasNotch) classesToAdd.push('has-notch')
  if (deviceInfo.hasDynamicIsland) classesToAdd.push('has-dynamic-island')
  if (deviceInfo.isStandalone) classesToAdd.push('standalone-mode')
  if (deviceInfo.isFullscreen) classesToAdd.push('fullscreen-mode')
  
  // 只添加有效的类名
  classesToAdd.forEach(className => {
    if (className && className.trim()) {
      document.body.classList.add(className)
    }
  })
  
  // 清理函数：移除添加的类名
  apkCleanupFunctions.push(() => {
    classesToAdd.forEach(className => {
      if (className && className.trim()) {
        document.body.classList.remove(className)
      }
    })
  })
  
  // 设置CSS自定义属性
  const root = document.documentElement
  root.style.setProperty('--device-width', `${deviceInfo.screenWidth}px`)
  root.style.setProperty('--device-height', `${deviceInfo.screenHeight}px`)
  root.style.setProperty('--viewport-width', `${deviceInfo.viewportWidth}px`)
  root.style.setProperty('--viewport-height', `${deviceInfo.viewportHeight}px`)
  root.style.setProperty('--pixel-ratio', deviceInfo.pixelRatio.toString())
  
  // 设置安全区域信息
  const { safeAreaInsets } = deviceInfo
  root.style.setProperty('--safe-area-top', `${safeAreaInsets.top}px`)
  root.style.setProperty('--safe-area-right', `${safeAreaInsets.right}px`)
  root.style.setProperty('--safe-area-bottom', `${safeAreaInsets.bottom}px`)
  root.style.setProperty('--safe-area-left', `${safeAreaInsets.left}px`)
  
  // 如果是APK环境，使用系统默认状态栏样式
  // 让capacitor.config.json中的配置和CSS的env(safe-area-inset-*)函数处理状态栏和安全区域
  if (isAPKEnvironment()) {
    // 设置为默认样式，让系统自动处理
    setStatusBarStyle('default')
  }
  
  isAPKInitialized = true
  console.log('APK Adapter initialized:', deviceInfo)
  
  return deviceInfo
}

/**
 * 清理APK适配器的所有资源
 * 用于应用卸载或重新初始化时清理资源
 */
export function cleanupAPKAdapter() {
  // 执行所有清理函数
  apkCleanupFunctions.forEach(cleanup => cleanup())
  apkCleanupFunctions = []
  isAPKInitialized = false
}

/**
 * 获取推荐的安全区域配置
 */
export function getRecommendedSafeAreaConfig(deviceInfo = null) {
  if (!deviceInfo) {
    deviceInfo = getDeviceInfo()
  }
  
  const config = {
    // 基础配置
    minPaddingTop: 16,
    minPaddingBottom: 16,
    minPaddingLeft: 16,
    minPaddingRight: 16,
    
    // 游戏模式配置
    gameModePaddingTop: 8,
    gameModePaddingBottom: 8,
    
    // 全屏模式配置
    fullscreenPaddingTop: 0,
    fullscreenPaddingBottom: 0
  }
  
  // iOS 特殊配置
  if (deviceInfo.isIOS) {
    if (deviceInfo.hasNotch || deviceInfo.hasDynamicIsland) {
      config.minPaddingTop = Math.max(config.minPaddingTop, deviceInfo.safeAreaInsets.top)
      config.minPaddingBottom = Math.max(config.minPaddingBottom, deviceInfo.safeAreaInsets.bottom)
    }
  }
  
  // Android 特殊配置
  if (deviceInfo.isAndroid) {
    // Android 通常需要更多的底部边距（导航栏）
    config.minPaddingBottom = Math.max(config.minPaddingBottom, 20)
  }
  
  // 横屏模式调整
  if (deviceInfo.orientation.includes('landscape')) {
    config.minPaddingLeft = Math.max(config.minPaddingLeft, deviceInfo.safeAreaInsets.left)
    config.minPaddingRight = Math.max(config.minPaddingRight, deviceInfo.safeAreaInsets.right)
  }
  
  return config
}

// 自动初始化（如果在浏览器环境中）
if (typeof window !== 'undefined') {
  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAPKAdapter)
  } else {
    initAPKAdapter()
  }
}