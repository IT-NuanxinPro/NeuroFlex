import { ref } from 'vue'

/**
 * 游戏倒计时 composable
 * @param {Object} options - 配置选项
 * @param {number} options.duration - 倒计时时长（秒），默认 3
 * @param {Function} options.onComplete - 倒计时完成回调
 * @param {Function} options.onTick - 每秒触发回调
 * @returns {Object} 倒计时状态和方法
 */
export function useGameCountdown(options = {}) {
  const { duration = 3, onComplete = () => {}, onTick = () => {} } = options

  // 状态
  const isCountingDown = ref(false)
  const currentCount = ref(duration)
  const progress = ref(100)

  // 内部状态
  let intervalId = null

  /**
   * 启动倒计时
   */
  function start() {
    // 防止重复启动
    if (isCountingDown.value) {
      return
    }

    // 重置状态
    currentCount.value = duration
    progress.value = 100
    isCountingDown.value = true

    // 立即触发第一次 tick
    try {
      onTick(currentCount.value)
    } catch (error) {
      console.error('倒计时 onTick 回调错误:', error)
    }

    // 设置定时器
    intervalId = setInterval(() => {
      currentCount.value -= 1
      progress.value = (currentCount.value / duration) * 100

      // 触发 tick 回调
      try {
        onTick(currentCount.value)
      } catch (error) {
        console.error('倒计时 onTick 回调错误:', error)
      }

      // 倒计时结束
      if (currentCount.value <= 0) {
        cleanup()
        isCountingDown.value = false

        // 触发完成回调
        try {
          onComplete()
        } catch (error) {
          console.error('倒计时 onComplete 回调错误:', error)
        }
      }
    }, 1000)
  }

  /**
   * 取消倒计时
   */
  function cancel() {
    cleanup()
    reset()
  }

  /**
   * 重置倒计时状态
   */
  function reset() {
    isCountingDown.value = false
    currentCount.value = duration
    progress.value = 100
  }

  /**
   * 清理定时器资源
   */
  function cleanup() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return {
    isCountingDown,
    currentCount,
    progress,
    start,
    cancel,
    reset,
    cleanup
  }
}
