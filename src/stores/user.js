import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { saveUserData, loadUserData } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  // 状态
  const profile = ref({
    id: generateUUID(),
    name: '训练者',
    avatar: '',
    createdAt: new Date(),
    lastLoginAt: new Date()
  })

  const trainingHistory = ref([])
  const preferences = ref({
    theme: 'dark',
    soundEnabled: true,
    vibrationEnabled: true,
    language: 'zh-CN'
  })

  // 计算属性
  const totalTrainingSessions = computed(() => trainingHistory.value.length)

  const totalTrainingTime = computed(() => {
    return trainingHistory.value.reduce((total, record) => {
      return total + (record.duration || 0)
    }, 0)
  })

  const averageScore = computed(() => {
    if (trainingHistory.value.length === 0) return 0
    const total = trainingHistory.value.reduce((sum, record) => sum + record.score, 0)
    return Math.round(total / trainingHistory.value.length)
  })

  // 操作
  function updateProfile(data) {
    profile.value = { ...profile.value, ...data }
    saveToStorage()
  }

  function addTrainingRecord(record) {
    const newRecord = {
      id: generateUUID(),
      ...record,
      completedAt: new Date()
    }
    trainingHistory.value.unshift(newRecord)
    saveToStorage()
  }

  function getTrainingHistory(filter = {}) {
    let filtered = [...trainingHistory.value]

    if (filter.moduleName) {
      filtered = filtered.filter(r => r.moduleName === filter.moduleName)
    }

    if (filter.startDate) {
      filtered = filtered.filter(r => new Date(r.completedAt) >= filter.startDate)
    }

    if (filter.endDate) {
      filtered = filtered.filter(r => new Date(r.completedAt) <= filter.endDate)
    }

    return filtered
  }

  function updatePreferences(prefs) {
    preferences.value = { ...preferences.value, ...prefs }
    saveToStorage()
  }

  function clearHistory() {
    trainingHistory.value = []
    saveToStorage()
  }

  // 持久化
  function saveToStorage() {
    const data = {
      profile: profile.value,
      trainingHistory: trainingHistory.value,
      preferences: preferences.value
    }
    const result = saveUserData(data)

    if (!result.success) {
      console.error('保存数据失败:', result.error)
    } else if (result.warning) {
      console.warn(result.warning)
    }

    return result.success
  }

  function loadFromStorage() {
    const data = loadUserData()
    if (data) {
      if (data.profile) profile.value = data.profile
      if (data.trainingHistory) trainingHistory.value = data.trainingHistory
      if (data.preferences) preferences.value = data.preferences
    }
  }

  // 初始化时加载数据
  loadFromStorage()

  // 监听数据变化自动保存（使用防抖避免频繁写入）
  let saveTimer = null
  watch(
    [profile, trainingHistory, preferences],
    () => {
      // 清除之前的定时器
      if (saveTimer) {
        clearTimeout(saveTimer)
      }
      // 延迟500ms保存，避免频繁写入
      saveTimer = setTimeout(() => {
        saveToStorage()
        saveTimer = null
      }, 500)
    },
    { deep: true }
  )

  return {
    // 状态
    profile,
    trainingHistory,
    preferences,
    // 计算属性
    totalTrainingSessions,
    totalTrainingTime,
    averageScore,
    // 操作
    updateProfile,
    addTrainingRecord,
    getTrainingHistory,
    updatePreferences,
    clearHistory,
    saveToStorage,
    loadFromStorage
  }
})

// 工具函数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
