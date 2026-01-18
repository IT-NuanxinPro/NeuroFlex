import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTrainingStore = defineStore('training', () => {
  // 当前训练状态
  const currentModule = ref(null)
  const isTraining = ref(false)
  const startTime = ref(null)
  const endTime = ref(null)
  const currentScore = ref(0)

  // 训练配置
  const config = ref({
    schulte: {
      gridSize: 5,
      mode: 'number',
      timeLimit: 30
    },
    stroop: {
      difficulty: 'basic',
      itemCount: 20,
      useMetronome: false,
      intervalTime: 2000
    },
    sequence: {
      itemCount: 10,
      displayTime: 2000,
      intervalTime: 500
    },
    audio: {
      snr: 30,
      backgroundType: 'white',
      digitCount: 10,
      intervalTime: 1500,
      contentType: 'digit'
    },
    mirror: {
      difficulty: 'open',
      templateType: 'circle'
    },
    categorize: {
      dimensions: 1,
      itemCount: 20,
      displayTime: 2000,
      flashMode: false
    },
    memoryStory: {
      itemCount: 5,
      displayTime: 30,
      requireDetails: false
    }
  })

  // 操作
  function startTraining(moduleName) {
    currentModule.value = moduleName
    isTraining.value = true
    startTime.value = Date.now()
    currentScore.value = 0
  }

  function endTraining() {
    endTime.value = Date.now()
    isTraining.value = false
  }

  function updateScore(score) {
    currentScore.value = score
  }

  function resetTraining() {
    currentModule.value = null
    isTraining.value = false
    startTime.value = null
    endTime.value = null
    currentScore.value = 0
  }

  function updateConfig(moduleName, newConfig) {
    if (config.value[moduleName]) {
      config.value[moduleName] = { ...config.value[moduleName], ...newConfig }
      saveConfig()
    }
  }

  function getConfig(moduleName) {
    return config.value[moduleName] || {}
  }

  // 持久化配置
  function saveConfig() {
    try {
      localStorage.setItem('neuroflex_training_config', JSON.stringify(config.value))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  function loadConfig() {
    try {
      const saved = localStorage.getItem('neuroflex_training_config')
      if (saved) {
        config.value = { ...config.value, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  // 初始化
  loadConfig()

  return {
    // 状态
    currentModule,
    isTraining,
    startTime,
    endTime,
    currentScore,
    config,
    // 操作
    startTraining,
    endTraining,
    updateScore,
    resetTraining,
    updateConfig,
    getConfig,
    saveConfig,
    loadConfig
  }
})
