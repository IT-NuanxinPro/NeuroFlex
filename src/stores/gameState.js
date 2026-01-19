/**
 * 游戏状态管理 Store
 *
 * 职责：
 * 1. 管理当前游戏的通用状态（倒计时、暂停等）
 * 2. 提供游戏状态的统一接口
 * 3. 减少组件内部状态，提升可维护性
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStateStore = defineStore('gameState', () => {
  // 当前游戏状态
  const currentGame = ref(null) // 当前游戏模块名称
  const gamePhase = ref('idle') // 'idle' | 'countdown' | 'active' | 'paused' | 'completed'
  const isPaused = ref(false)
  const startTime = ref(null)
  const endTime = ref(null)

  // 倒计时状态
  const isCountingDown = ref(false)
  const countdownValue = ref(3)

  // 游戏数据
  const currentScore = ref(0)
  const currentProgress = ref(0)

  // 计算属性
  const isGameActive = computed(() => gamePhase.value === 'active')
  const isGameIdle = computed(() => gamePhase.value === 'idle')
  const isGameCompleted = computed(() => gamePhase.value === 'completed')
  const gameDuration = computed(() => {
    if (!startTime.value) return 0
    const end = endTime.value || Date.now()
    return end - startTime.value
  })

  // 操作
  function startGame(moduleName) {
    currentGame.value = moduleName
    gamePhase.value = 'countdown'
    isCountingDown.value = true
    startTime.value = null
    endTime.value = null
    currentScore.value = 0
    currentProgress.value = 0
  }

  function activateGame() {
    gamePhase.value = 'active'
    isCountingDown.value = false
    startTime.value = Date.now()
  }

  function pauseGame() {
    if (gamePhase.value === 'active') {
      gamePhase.value = 'paused'
      isPaused.value = true
    }
  }

  function resumeGame() {
    if (gamePhase.value === 'paused') {
      gamePhase.value = 'active'
      isPaused.value = false
    }
  }

  function completeGame() {
    gamePhase.value = 'completed'
    endTime.value = Date.now()
  }

  function resetGame() {
    currentGame.value = null
    gamePhase.value = 'idle'
    isPaused.value = false
    isCountingDown.value = false
    startTime.value = null
    endTime.value = null
    currentScore.value = 0
    currentProgress.value = 0
    countdownValue.value = 3
  }

  function updateScore(score) {
    currentScore.value = score
  }

  function updateProgress(progress) {
    currentProgress.value = Math.max(0, Math.min(100, progress))
  }

  function updateCountdown(value) {
    countdownValue.value = value
  }

  return {
    // 状态
    currentGame,
    gamePhase,
    isPaused,
    isCountingDown,
    countdownValue,
    startTime,
    endTime,
    currentScore,
    currentProgress,

    // 计算属性
    isGameActive,
    isGameIdle,
    isGameCompleted,
    gameDuration,

    // 操作
    startGame,
    activateGame,
    pauseGame,
    resumeGame,
    completeGame,
    resetGame,
    updateScore,
    updateProgress,
    updateCountdown
  }
})
