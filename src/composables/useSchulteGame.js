import { ref, computed } from 'vue'
import { useReactionTime } from './useReactionTime'

/**
 * 舒尔特方格游戏逻辑 Hook
 * 组合反应时间追踪，统一管理游戏状态、计时、错误统计和性能指标
 * 
 * @param {import('vue').Ref<number>} gridSize - 方格尺寸的响应式引用（如 ref(5) 表示 5×5）
 * @returns {Object} 游戏状态、方法和性能指标
 */
export function useSchulteGame(gridSize) {
  // 组合反应时间追踪
  const reaction = useReactionTime()

  // 游戏状态
  const startTime = ref(null) // 游戏开始时间戳
  const currentTarget = ref(1) // 当前应点击的数字
  const errorCount = ref(0) // 错误点击次数

  // 总数字数量
  const totalNumbers = computed(() => gridSize.value * gridSize.value)

  // 正确点击数量
  const correctCount = computed(() => reaction.clickCount.value)

  // 游戏是否完成
  const isCompleted = computed(() => correctCount.value === totalNumbers.value)

  // 总耗时（毫秒）- 从开始到最后一次点击
  const totalTime = computed(() => {
    if (!startTime.value || reaction.timestamps.value.length === 0) return null
    
    // 使用最后一次点击的时间戳
    const lastTimestamp = reaction.timestamps.value[reaction.timestamps.value.length - 1]
    return lastTimestamp - startTime.value
  })

  // 准确率（正确点击数 / 总点击数）
  const accuracy = computed(() => {
    const total = correctCount.value + errorCount.value
    if (total === 0) return 0
    return Math.round((correctCount.value / total) * 100)
  })

  /**
   * 开始游戏
   * 设置开始时间并重置所有状态
   */
  function startGame() {
    startTime.value = Date.now()
    currentTarget.value = 1
    errorCount.value = 0
    reaction.reset()
  }

  /**
   * 处理数字点击
   * @param {number} number - 被点击的数字
   * @returns {boolean} 是否点击正确
   */
  function handleNumberClick(number) {
    // 检查是否点击正确
    if (number === currentTarget.value) {
      // 正确点击
      reaction.recordClick()
      currentTarget.value++
      return true
    } else {
      // 错误点击
      errorCount.value++
      return false
    }
  }

  /**
   * 重置游戏
   * 清空所有状态，准备新一轮游戏
   */
  function resetGame() {
    startTime.value = null
    currentTarget.value = 1
    errorCount.value = 0
    reaction.reset()
  }

  /**
   * 获取完整的游戏统计数据
   * 用于结果展示或数据保存
   */
  const gameStats = computed(() => ({
    // 基础数据
    totalTime: totalTime.value,
    correctCount: correctCount.value,
    errorCount: errorCount.value,
    accuracy: accuracy.value,
    
    // 反应时间数据
    averageReactionTime: reaction.averageReactionTime.value,
    fastestReaction: reaction.fastestReaction.value,
    slowestReaction: reaction.slowestReaction.value,
    intervals: reaction.intervals.value,
    
    // 完成状态
    isCompleted: isCompleted.value,
    totalNumbers: totalNumbers.value
  }))

  return {
    // 游戏状态
    currentTarget,
    errorCount,
    correctCount,
    isCompleted,
    totalNumbers,
    
    // 性能指标
    totalTime,
    accuracy,
    averageReactionTime: reaction.averageReactionTime,
    fastestReaction: reaction.fastestReaction,
    slowestReaction: reaction.slowestReaction,
    intervals: reaction.intervals,
    timestamps: reaction.timestamps,
    
    // 完整统计
    gameStats,
    
    // 方法
    startGame,
    handleNumberClick,
    resetGame
  }
}
