/**
 * 移动端视口高度修复工具
 * 解决移动端浏览器地址栏导致的视口高度问题
 */

// 存储清理函数和初始化状态
let cleanupFunctions = []
let isInitialized = false

/**
 * 设置CSS自定义属性 --vh
 * 用于替代100vh，避免移动端地址栏影响
 */
function setViewportHeight() {
  // 获取实际视口高度
  const vh = window.innerHeight * 0.01
  
  // 设置CSS自定义属性
  document.documentElement.style.setProperty('--vh', `${vh}px`)
  
  // 设置额外的视口高度变量
  document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`)
  document.documentElement.style.setProperty('--viewport-width', `${window.innerWidth}px`)
}

/**
 * 检测是否为移动设备
 */
function isMobileDevice() {
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'iemobile', 'opera mini', 'mobile'
  ]
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
         window.innerWidth <= 768
}

/**
 * 检测是否为微信浏览器
 */
function isWeChatBrowser() {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('micromessenger')
}

/**
 * 检测是否为iOS设备
 */
function isIOSDevice() {
  const userAgent = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent)
}

/**
 * 检测是否为Android设备
 */
function isAndroidDevice() {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('android')
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 初始化视口高度修复
 */
export function initViewportFix() {
  if (isInitialized) return
  
  // 立即设置一次
  setViewportHeight()
  
  // 监听窗口大小变化（防抖处理）
  const debouncedSetViewportHeight = debounce(setViewportHeight, 100)
  
  // 监听resize事件
  window.addEventListener('resize', debouncedSetViewportHeight)
  cleanupFunctions.push(() => window.removeEventListener('resize', debouncedSetViewportHeight))
  
  // 监听orientationchange事件（移动端旋转）
  const orientationHandler = () => {
    // 延迟执行，等待旋转完成
    setTimeout(setViewportHeight, 100)
  }
  window.addEventListener('orientationchange', orientationHandler)
  cleanupFunctions.push(() => window.removeEventListener('orientationchange', orientationHandler))
  
  // 移动端特殊处理
  if (isMobileDevice()) {
    // 监听滚动事件（某些移动端浏览器滚动时会改变视口高度）
    let scrollTimer
    const scrollHandler = () => {
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(setViewportHeight, 150)
    }
    window.addEventListener('scroll', scrollHandler, { passive: true })
    cleanupFunctions.push(() => {
      clearTimeout(scrollTimer)
      window.removeEventListener('scroll', scrollHandler)
    })
    
    // iOS Safari特殊处理
    if (isIOSDevice()) {
      // 监听页面显示/隐藏（处理Safari地址栏自动隐藏）
      const visibilityHandler = () => {
        if (!document.hidden) {
          setTimeout(setViewportHeight, 300)
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
      cleanupFunctions.push(() => document.removeEventListener('visibilitychange', visibilityHandler))
      
      // 监听焦点事件（处理虚拟键盘）
      const focusinHandler = () => {
        setTimeout(setViewportHeight, 300)
      }
      const focusoutHandler = () => {
        setTimeout(setViewportHeight, 300)
      }
      window.addEventListener('focusin', focusinHandler)
      window.addEventListener('focusout', focusoutHandler)
      cleanupFunctions.push(() => {
        window.removeEventListener('focusin', focusinHandler)
        window.removeEventListener('focusout', focusoutHandler)
      })
    }
    
    // Android特殊处理
    if (isAndroidDevice()) {
      // Android Chrome地址栏处理
      let lastHeight = window.innerHeight
      
      const checkHeightChange = () => {
        const currentHeight = window.innerHeight
        if (Math.abs(currentHeight - lastHeight) > 100) {
          setViewportHeight()
          lastHeight = currentHeight
        }
      }
      
      window.addEventListener('resize', checkHeightChange)
      cleanupFunctions.push(() => window.removeEventListener('resize', checkHeightChange))
    }
    
    // 微信浏览器特殊处理
    if (isWeChatBrowser()) {
      // 微信浏览器底部工具栏处理
      document.body.classList.add('wechat-browser')
      
      // 监听微信浏览器的特殊事件
      const wechatHandler = () => {
        setTimeout(setViewportHeight, 100)
      }
      document.addEventListener('WeixinJSBridgeReady', wechatHandler)
      cleanupFunctions.push(() => document.removeEventListener('WeixinJSBridgeReady', wechatHandler))
    }
  }
  
  // 添加设备类型到body类名
  const classesToAdd = [
    isMobileDevice() ? 'mobile-device' : 'desktop-device'
  ]
  
  if (isIOSDevice()) classesToAdd.push('ios-device')
  if (isAndroidDevice()) classesToAdd.push('android-device')
  if (isWeChatBrowser()) classesToAdd.push('wechat-browser')
  
  // 只添加非空的类名
  classesToAdd.forEach(className => {
    if (className && className.trim()) {
      document.body.classList.add(className)
    }
  })
  
  isInitialized = true
}

/**
 * 清理视口修复的所有监听器
 * 用于应用卸载或重新初始化时清理资源
 */
export function cleanupViewportFix() {
  // 执行所有清理函数
  cleanupFunctions.forEach(cleanup => cleanup())
  cleanupFunctions = []
  isInitialized = false
}

/**
 * 获取当前视口信息
 */
export function getViewportInfo() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: isMobileDevice(),
    isIOS: isIOSDevice(),
    isAndroid: isAndroidDevice(),
    isWeChat: isWeChatBrowser(),
    vh: window.innerHeight * 0.01
  }
}

/**
 * 手动触发视口高度更新
 */
export function updateViewportHeight() {
  setViewportHeight()
}

// 自动初始化（如果在浏览器环境中）
if (typeof window !== 'undefined') {
  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewportFix)
  } else {
    initViewportFix()
  }
}