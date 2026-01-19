<template>
  <div class="stroop-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">Stroop 训练</h1>
      <div v-if="isTraining" class="score">{{ correctCount }}/{{ totalTrials }}</div>
    </header>

    <main class="page-content">
      <div v-if="!isTraining && !showResult" class="config-screen">
        <div class="config-card">
          <h2>选择难度</h2>
          <div class="difficulty-buttons">
            <button
              :class="['difficulty-btn', { active: difficulty === 'basic' }]"
              @click="difficulty = 'basic'"
            >
              基础模式
              <span>字义与颜色一致</span>
            </button>
            <button
              :class="['difficulty-btn', { active: difficulty === 'advanced' }]"
              @click="difficulty = 'advanced'"
            >
              进阶模式
              <span>字义与颜色冲突</span>
            </button>
          </div>

          <h2 style="margin-top: 24px">选择模式</h2>
          <div class="difficulty-buttons">
            <button
              :class="['difficulty-btn', { active: timeMode === 'standard' }]"
              @click="timeMode = 'standard'"
            >
              标准模式
              <span>测试反应速度，无时间限制</span>
            </button>
            <button
              :class="['difficulty-btn', { active: timeMode === 'timed' }]"
              @click="timeMode = 'timed'"
            >
              限时模式
              <span>每个字{{ timeLimitSeconds }}秒，超时算错</span>
            </button>
          </div>

          <button class="start-button" @click="handleStartTraining">开始训练</button>
        </div>
      </div>

      <div v-else-if="isTraining" class="training-screen">
        <!-- 倒计时遮罩层 -->
        <GameCountdown
          :current-count="countdown.currentCount.value"
          :progress="countdown.progress.value"
          :is-visible="countdown.isCountingDown.value"
        />

        <div v-if="timeMode === 'timed'" class="timer-bar">
          <div class="timer-fill" :style="{ width: `${timeRemaining}%` }"></div>
        </div>

        <div
          class="word-display"
          :style="{ color: currentColor }"
          :class="{ disabled: isGameDisabled }"
        >
          {{ currentWord }}
        </div>

        <div class="color-buttons" :class="{ disabled: isGameDisabled }">
          <button
            v-for="color in colors"
            :key="color.name"
            class="color-button"
            :style="{ backgroundColor: color.value }"
            @click="selectColor(color.name)"
          >
            {{ color.label }}
          </button>
        </div>

        <div class="progress">
          <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>

      <!-- 结果弹窗 -->
      <GameResult
        :visible="showResult"
        :type="resultType"
        :title="resultTitle"
        :subtitle="resultSubtitle"
        :stats="resultStats"
        :show-retry="true"
        close-text="返回首页"
        @retry="handleRetry"
        @close="handleClose"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { colors, defaultTrials, timeLimitSeconds } from '@/config/stroop.js'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useGameCountdown } from '@/composables/useGameCountdown'
import GameCountdown from '@/components/GameCountdown.vue'
import GameResult from '@/components/GameResult.vue'

const router = useRouter()
const userStore = useUserStore()

const difficulty = ref('basic')
const timeMode = ref('standard') // 'standard' 或 'timed'
// 颜色数组已移至配置 timeLimitSeconds // 限时模式每个字的时间限制
const gameState = ref('idle') // 'idle' | 'countdown' | 'active' | 'completed'
const isTraining = ref(false)
const showResult = ref(false)
const currentWord = ref('')
const currentColor = ref('')
const currentAnswer = ref('')
const correctCount = ref(0)
const wrongCount = ref(0)
const totalTrials = ref(defaultTrials)
const currentTrial = ref(0)
const trialStartTime = ref(0) // 每个字的开始时间
const reactionTimes = ref([])
const timeoutCount = ref(0) // 超时次数

// 限时模式相关
const timeRemaining = ref(100) // 剩余时间百分比
let timerInterval = null
let timeoutTimer = null
const progress = computed(() => (currentTrial.value / totalTrials.value) * 100)

// 倒计时设置
const countdown = useGameCountdown({
  duration: 3,
  onComplete: startGame
})

// 结果统计
const accuracy = computed(() => correctCount.value / totalTrials.value)
const avgReactionTime = computed(() => {
  if (reactionTimes.value.length === 0) return 0
  const sum = reactionTimes.value.reduce((a, b) => a + b, 0)
  return Math.round(sum / reactionTimes.value.length)
})
const fastestTime = computed(() => {
  if (reactionTimes.value.length === 0) return 0
  return Math.min(...reactionTimes.value)
})
const slowestTime = computed(() => {
  if (reactionTimes.value.length === 0) return 0
  return Math.max(...reactionTimes.value)
})

const isGameDisabled = computed(() => {
  return gameState.value === 'countdown'
})

// 结果弹窗相关
const resultType = computed(() => 'success')

const resultTitle = computed(() => '训练完成')

const resultSubtitle = computed(() => {
  if (accuracy.value >= 0.9) {
    return '出色的表现！'
  } else if (accuracy.value >= 0.7) {
    return '继续努力！'
  }
  return '多加练习，你会做得更好！'
})

const resultStats = computed(() => {
  const totalTime = reactionTimes.value.reduce((a, b) => a + b, 0)
  
  const stats = [
    { label: '总用时', value: `${(totalTime / 1000).toFixed(1)}秒`, highlight: true },
    { label: '正确率', value: `${(accuracy.value * 100).toFixed(0)}%`, highlight: true },
    { label: '正确数', value: `${correctCount.value}/${totalTrials.value}`, highlight: false },
    { label: '错误数', value: `${wrongCount.value}`, highlight: false },
    { label: '平均反应', value: `${avgReactionTime.value}ms`, highlight: false }
  ]

  if (timeMode.value === 'standard') {
    stats.push(
      { label: '最快反应', value: `${fastestTime.value}ms`, highlight: false },
      { label: '最慢反应', value: `${slowestTime.value}ms`, highlight: false }
    )
  } else {
    stats.push(
      { label: '超时次数', value: `${timeoutCount.value}`, highlight: false }
    )
  }

  return stats
})

function handleStartTraining() {
  // 立即进入训练界面
  isTraining.value = true
  showResult.value = false
  correctCount.value = 0
  wrongCount.value = 0
  currentTrial.value = 0
  reactionTimes.value = []
  timeoutCount.value = 0

  // 设置为倒计时状态
  gameState.value = 'countdown'

  // 启动倒计时
  countdown.start()
}

function startGame() {
  // 倒计时结束后，开始游戏
  gameState.value = 'active'
  nextTrial()
}

function nextTrial() {
  if (currentTrial.value >= totalTrials.value) {
    endTraining()
    return
  }

  // 清除之前的计时器
  clearTimers()

  // 生成新的字和颜色
  const colorObj = colors[Math.floor(Math.random() * colors.length)]
  currentColor.value = colorObj.value
  currentAnswer.value = colorObj.name

  if (difficulty.value === 'basic') {
    currentWord.value = colorObj.label
  } else {
    const otherColors = colors.filter(c => c.name !== colorObj.name)
    const randomWord = otherColors[Math.floor(Math.random() * otherColors.length)]
    currentWord.value = randomWord.label
  }

  currentTrial.value++
  trialStartTime.value = Date.now() // 记录这个字出现的时间

  // 限时模式：启动倒计时
  if (timeMode.value === 'timed') {
    startTimer()
  }
}

function startTimer() {
  timeRemaining.value = 100
  const startTime = Date.now()
  const duration = timeLimitSeconds * 1000

  // 更新进度条
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    timeRemaining.value = Math.max(0, 100 - (elapsed / duration) * 100)
  }, 50)

  // 超时处理
  timeoutTimer = setTimeout(() => {
    handleTimeout()
  }, duration)
}

function handleTimeout() {
  clearTimers()
  timeoutCount.value++
  reactionTimes.value.push(timeLimitSeconds * 1000) // 记录为最大时间
  setTimeout(nextTrial, 300)
}

function clearTimers() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
}

function selectColor(colorName) {
  const reactionTime = Date.now() - trialStartTime.value
  reactionTimes.value.push(reactionTime)

  if (colorName === currentAnswer.value) {
    correctCount.value++
  } else {
    wrongCount.value++
  }

  clearTimers()
  setTimeout(nextTrial, 300)
}

function endTraining() {
  isTraining.value = false
  showResult.value = true
  gameState.value = 'completed'
  clearTimers()

  userStore.addTrainingRecord({
    moduleName: 'stroop',
    difficulty: difficulty.value,
    timeMode: timeMode.value,
    score: Math.round(accuracy.value * 100),
    duration: reactionTimes.value.reduce((a, b) => a + b, 0),
    accuracy: accuracy.value,
    details: {
      correctCount: correctCount.value,
      totalTrials: totalTrials.value,
      Time: avgReactionTime.value,
      fastestTime: fastestTime.value,
      slowestTime: slowestTime.value,
      timeoutCount: timeoutCount.value,
      wrongCount: wrongCount.value
    }
  })
}

function resetTraining() {
  showResult.value = false
  isTraining.value = false
  gameState.value = 'idle'
}

function handleRetry() {
  showResult.value = false
  resetTraining()
  handleStartTraining()
}

function handleClose() {
  showResult.value = false
  goBack()
}

function goBack() {
  clearTimers()
  countdown.cancel()
  router.back()
}

// 组件卸载时清理计时器
onUnmounted(() => {
  clearTimers()
  countdown.cancel()
})
</script>

<style lang="scss" scoped>
.stroop-page {
  min-height: 100vh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  @include safe-area-padding(top);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;

  .back-button {
    @include button-reset;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: rgba(255, 255, 255, 0.05);
    @include flex-center;
    position: absolute;
    left: $spacing-lg;
  }

  .page-title {
    font-size: $font-xl;
    margin: 0;
    text-align: center;
  }

  .score {
    font-size: $font-xl;
    font-weight: $font-bold;
    color: $accent-primary;
    position: absolute;
    right: $spacing-lg;
  }
}

.page-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.config-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-md;
  overflow: hidden;
  min-height: 0;
}

.config-card {
  @include glass-card;
  padding: $spacing-xl;
  max-width: 500px;
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  @include custom-scrollbar;

  @include mobile {
    padding: $spacing-lg;
  }

  h2 {
    text-align: center;
    margin-bottom: $spacing-lg;
    font-size: $font-xl;
    
    @include mobile {
      font-size: $font-lg;
      margin-bottom: $spacing-md;
    }
  }
}

.difficulty-buttons {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  @include mobile {
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  .difficulty-btn {
    @include button-reset;
    padding: $spacing-lg;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    text-align: left;
    transition: all $transition-base;
    position: relative;
    font-size: $font-base;

    @include mobile {
      padding: $spacing-md;
      font-size: $font-sm;
    }

    span {
      display: block;
      font-size: $font-sm;
      color: $text-secondary;
      margin-top: $spacing-xs;

      @include mobile {
        font-size: $font-xs;
        margin-top: 4px;
      }
    }

    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(0, 212, 255, 0.3);
    }

    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: $accent-primary;
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
    }
  }
}

.start-button {
  @include button-reset;
  width: 100%;
  padding: $spacing-lg;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  font-size: $font-lg;
  font-weight: $font-bold;
  transition: all $transition-base;
  box-shadow:
    0 8px 24px rgba(0, 212, 255, 0.3),
    0 0 40px rgba(0, 212, 255, 0.1);

  @include mobile {
    padding: $spacing-md;
    font-size: $font-base;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 32px rgba(0, 212, 255, 0.5),
      0 0 60px rgba(0, 212, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.training-screen {
  flex: 1;
  width: 100%;
  max-width: 600px;
  text-align: center;
  padding: calc($spacing-lg + 60px) $spacing-md $spacing-md;
  overflow: hidden;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  gap: $spacing-sm;
}

.timer-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-full;
  overflow: hidden;
  flex-shrink: 0;

  .timer-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff3366, #ffaa00, #00ff88);
    transition: width 0.05s linear;
  }
}

.word-display {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: $font-bold;
  flex: 1;
  @include flex-center;
  min-height: 0;
  transition:
    opacity 0.3s ease,
    filter 0.3s ease;

  &.disabled {
    opacity: 0.3;
    filter: blur(8px);
    pointer-events: none;
  }
}

.color-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;
  flex-shrink: 0;
  transition:
    opacity 0.3s ease,
    filter 0.3s ease;
  margin-bottom: $spacing-md;

  @include mobile {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-xs;
  }

  &.disabled {
    opacity: 0.3;
    filter: blur(8px);
    pointer-events: none;
  }

  .color-button {
    @include button-reset;
    @include click-feedback;
    padding: clamp($spacing-lg, 4vh, $spacing-2xl);
    border-radius: $radius-md;
    font-size: clamp($font-lg, 3vw, $font-2xl);
    font-weight: $font-bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    min-height: 60px;
    
    @include mobile {
      min-height: 70px;
    }
  }
}

.progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-full;
  overflow: hidden;
  flex-shrink: 0;

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, $accent-primary, $accent-secondary);
    transition: width $transition-base;
  }
}
</style>
