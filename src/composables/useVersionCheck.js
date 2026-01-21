import { ref, onMounted } from 'vue'

const currentVersion = ref('')
const latestVersion = ref('')
const hasUpdate = ref(false)
const updateInfo = ref(null)
const checking = ref(false)

export function useVersionCheck() {
  // 获取当前版本（从package.json或构建时注入）
  function getCurrentVersion() {
    // 这里可以从环境变量或构建时注入的版本信息获取
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
      window.open(updateInfo.value.downloadUrl, '_blank')
    } else {
      // 跳转到下载页面
      window.open('/download', '_blank')
    }
  }

  // 初始化
  onMounted(() => {
    currentVersion.value = getCurrentVersion()
    // 自动检查更新
    checkForUpdates()
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