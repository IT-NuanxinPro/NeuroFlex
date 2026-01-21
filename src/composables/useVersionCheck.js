import { ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

const currentVersion = ref('')
const latestVersion = ref('')
const hasUpdate = ref(false)
const updateInfo = ref(null)
const checking = ref(false)

export function useVersionCheck() {
  // 获取当前版本（从package.json或构建时注入）
  async function getCurrentVersion() {
    // 在 APP 环境下，从 APP 信息中获取真实版本
    if (Capacitor.isNativePlatform()) {
      try {
        const appInfo = await App.getInfo()
        return appInfo.version
      } catch (error) {
        console.error('获取 APP 版本失败:', error)
        return '1.0.1' // fallback
      }
    }
    return import.meta.env.VITE_APP_VERSION || '1.1.0'
  }

  // 检查版本更新
  async function checkForUpdates() {
    if (checking.value) return

    checking.value = true
    try {
      const response = await fetch('/app-version.json')
      if (!response.ok) {
        throw new Error('获取版本信息失败')
      }

      const versionInfo = await response.json()
      latestVersion.value = versionInfo.version
      updateInfo.value = versionInfo

      // 比较版本号
      const current = parseVersion(currentVersion.value)
      const latest = parseVersion(latestVersion.value)

      hasUpdate.value = compareVersions(latest, current) > 0
    } catch (error) {
      console.error('检查版本更新失败:', error)
    } finally {
      checking.value = false
    }
  }

  // 解析版本号
  function parseVersion(version) {
    const parts = version.split('.').map(Number)
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    }
  }

  // 比较版本号
  function compareVersions(v1, v2) {
    if (v1.major !== v2.major) return v1.major - v2.major
    if (v1.minor !== v2.minor) return v1.minor - v2.minor
    return v1.patch - v2.patch
  }

  // 跳转到下载页面
  function goToDownload() {
    if (updateInfo.value?.downloadUrl) {
      // 在 APP 环境下，打开外部浏览器下载
      if (Capacitor.isNativePlatform()) {
        window.open(updateInfo.value.downloadUrl, '_system')
      } else {
        window.open(updateInfo.value.downloadUrl, '_blank')
      }
    } else {
      // 跳转到下载页面
      if (Capacitor.isNativePlatform()) {
        window.open('/download', '_system')
      } else {
        window.open('/download', '_blank')
      }
    }
  }

  // 初始化
  onMounted(async () => {
    currentVersion.value = await getCurrentVersion()
    // 只在 APP 环境下自动检查更新
    if (Capacitor.isNativePlatform()) {
      checkForUpdates()
    }
  })

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    updateInfo,
    checking,
    checkForUpdates,
    goToDownload
  }
}