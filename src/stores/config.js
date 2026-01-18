import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  // 应用配置
  const appConfig = ref({
    version: '1.0.0',
    theme: 'dark',
    language: 'zh-CN',
    soundEnabled: true,
    vibrationEnabled: true,
    animationEnabled: true,
    showTutorial: true
  })

  // 操作
  function updateConfig(key, value) {
    if (key in appConfig.value) {
      appConfig.value[key] = value
      saveConfig()
    }
  }

  function resetConfig() {
    appConfig.value = {
      version: '1.0.0',
      theme: 'dark',
      language: 'zh-CN',
      soundEnabled: true,
      vibrationEnabled: true,
      animationEnabled: true,
      showTutorial: true
    }
    saveConfig()
  }

  // 持久化
  function saveConfig() {
    try {
      localStorage.setItem('neuroflex_app_config', JSON.stringify(appConfig.value))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  function loadConfig() {
    try {
      const saved = localStorage.getItem('neuroflex_app_config')
      if (saved) {
        appConfig.value = { ...appConfig.value, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  // 初始化
  loadConfig()

  return {
    appConfig,
    updateConfig,
    resetConfig,
    saveConfig,
    loadConfig
  }
})
