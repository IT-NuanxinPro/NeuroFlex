/**
 * 设备检测工具
 * 提供统一的设备类型判断方法
 */

let cachedIsPC = null
let cachedIsMobile = null
let cachedIsTablet = null

/**
 * 检测是否为原生 APP 环境（Capacitor）
 * @returns {boolean}
 */
export function isNativeApp() {
  // 检查是否存在 Capacitor 对象
  if (typeof window !== 'undefined' && window.Capacitor) {
    return window.Capacitor.isNativePlatform()
  }
  return false
}

/**
 * 检测是否为PC端
 * @returns {boolean}
 */
export function isPC() {
  if (cachedIsPC !== null) {
    return cachedIsPC
  }
  
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
  
  // 如果不是移动设备，且屏幕宽度大于1024px，认为是PC
  cachedIsPC = !isMobile && !isTablet && window.innerWidth > 1024
  
  return cachedIsPC
}

/**
 * 检测是否为移动端
 * @returns {boolean}
 */
export function isMobile() {
  if (cachedIsMobile !== null) {
    return cachedIsMobile
  }
  
  const userAgent = navigator.userAgent.toLowerCase()
  cachedIsMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  
  return cachedIsMobile
}

/**
 * 检测是否为平板
 * @returns {boolean}
 */
export function isTablet() {
  if (cachedIsTablet !== null) {
    return cachedIsTablet
  }
  
  const userAgent = navigator.userAgent.toLowerCase()
  cachedIsTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
  
  return cachedIsTablet
}

/**
 * 重置缓存（窗口大小改变时调用）
 */
export function resetDeviceCache() {
  cachedIsPC = null
  cachedIsMobile = null
  cachedIsTablet = null
}

// 存储清理函数
let deviceCleanupFunction = null

/**
 * 初始化设备检测的自动缓存重置
 */
export function initDeviceDetection() {
  if (typeof window !== 'undefined' && !deviceCleanupFunction) {
    window.addEventListener('resize', resetDeviceCache)
    deviceCleanupFunction = () => {
      window.removeEventListener('resize', resetDeviceCache)
    }
  }
}

/**
 * 清理设备检测的监听器
 */
export function cleanupDeviceDetection() {
  if (deviceCleanupFunction) {
    deviceCleanupFunction()
    deviceCleanupFunction = null
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  initDeviceDetection()
}

/**
 * Vue 3 Composable - 响应式设备检测
 */
export function useDevice() {
  const { ref, onMounted, onUnmounted } = require('vue')
  
  const isPCDevice = ref(false)
  const isMobileDevice = ref(false)
  const isTabletDevice = ref(false)
  
  function updateDeviceType() {
    resetDeviceCache()
    isPCDevice.value = isPC()
    isMobileDevice.value = isMobile()
    isTabletDevice.value = isTablet()
  }
  
  function handleResize() {
    updateDeviceType()
  }
  
  onMounted(() => {
    updateDeviceType()
    window.addEventListener('resize', handleResize)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
  
  return {
    isPC: isPCDevice,
    isMobile: isMobileDevice,
    isTablet: isTabletDevice
  }
}