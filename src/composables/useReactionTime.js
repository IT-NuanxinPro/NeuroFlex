import { ref, computed } from 'vue'

/**
 * 反应时间追踪 Hook
 * 用于记录用户点击时间戳并计算平均反应时间
 * 
 * @returns {Object} 反应时间相关的状态和方法
 */
export function useReactionTime() {
  // 存储每次正确点击的时间戳
  const clickTimestamps = ref([])

  /**
   * 计算平均反应时间（相邻点击之间的平均间隔）
   * @returns {number} 平均反应时间（毫秒），至少需要2次点击才有值
   */
  const averageReactionTime = computed(() => {
    // 至少需要2次点击才能计算间隔
    if (clickTimestamps.value.length < 2) return 0

    // 计算所有相邻点击之间的时间间隔
    const intervals = []
    for (let i = 1; i < clickTimestamps.value.length; i++) {
      intervals.push(clickTimestamps.value[i] - clickTimestamps.value[i - 1])
    }

    // 计算平均值并四舍五入
    const sum = intervals.reduce((a, b) => a + b, 0)
    return Math.round(sum / intervals.length)
  })

  /**
   * 记录一次正确点击的时间戳
   */
  function recordClick() {
    clickTimestamps.value.push(Date.now())
  }

  /**
   * 重置所有时间戳记录
   */
  function reset() {
    clickTimestamps.value = []
  }

  /**
   * 获取点击次数
   */
  const clickCount = computed(() => clickTimestamps.value.length)

  /**
   * 获取所有时间间隔（用于详细分析）
   */
  const intervals = computed(() => {
    if (clickTimestamps.value.length < 2) return []
    
    const result = []
    for (let i = 1; i < clickTimestamps.value.length; i++) {
      result.push(clickTimestamps.value[i] - clickTimestamps.value[i - 1])
    }
    return result
  })

  /**
   * 获取最快反应时间
   */
  const fastestReaction = computed(() => {
    if (intervals.value.length === 0) return 0
    return Math.min(...intervals.value)
  })

  /**
   * 获取最慢反应时间
   */
  const slowestReaction = computed(() => {
    if (intervals.value.length === 0) return 0
    return Math.max(...intervals.value)
  })

  return {
    // 状态（只读）
    timestamps: clickTimestamps, // 暴露时间戳数组供外部只读访问
    clickCount,
    averageReactionTime,
    intervals,
    fastestReaction,
    slowestReaction,
    
    // 方法
    recordClick,
    reset
  }
}
