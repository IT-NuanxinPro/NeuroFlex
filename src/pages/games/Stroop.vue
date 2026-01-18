<template>
  <div class="stroop-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">Stroop 训练</h1>
      <div class="score" v-if="isTraining">{{ correctCount }}/{{ totalTrials }}</div>
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

          <h2 style="margin-top: 32px">选择模式</h2>
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

          <button class="start-button" @click="startTraining">开始训练</button>
        </div>
      </div>

      <div v-else-if="isTraining" class="training-screen">
        <div class="timer-bar" v-if="timeMode === 'timed'">
          <div class="timer-fill" :style="{ width: `${timeRemaining}%` }"></div>
        </div>

        <div class="word-display" :style="{ color: currentColor }">
          {{ currentWord }}
        </div>

        <div class="color-buttons">
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

      <div v-else-if="showResult" class="result-screen">
        <div class="result-card">
          <h2>训练完成</h2>

          <div class="result-stats">
            <div class="stat-item">
              <span class="stat-label">正确率</span>
              <span class="stat-value">{{ (accuracy * 100).toFixed(0) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">正确数</span>
              <span class="stat-value">{{ correctCount }}/{{ totalTrials }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均反应</span>
              <span class="stat-value">{{ avgReactionTime }}ms</span>
            </div>
            <div class="stat-item" v-if="timeMode === 'standard'">
              <span class="stat-label">最快反应</span>
              <span class="stat-value">{{ fastestTime }}ms</span>
            </div>
            <div class="stat-item" v-if="timeMode === 'standard'">
              <span class="stat-label">最慢反应</span>
              <span class="stat-value">{{ slowestTime }}ms</span>
            </div>
            <div class="stat-item" v-if="timeMode === 'timed'">
              <span class="stat-label">超时次数</span>
              <span class="stat-value">{{ timeoutCount }}</span>
            </div>
          </div>

          <div class="result-actions">
            <button class="action-button secondary" @click="resetTraining">再来一次</button>
            <button class="action-button primary" @click="goBack">返回</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const difficulty = ref('basic')
const timeMode = ref('standard') // 'standard' 或 'timed'
const timeLimitSeconds = 3 // 限时模式每个字的时间限制
const isTraining = ref(false)
const showResult = ref(false)
const currentWord = ref('')
const currentColor = ref('')
const currentAnswer = ref('')
const correctCount = ref(0)
const totalTrials = ref(20)
const currentTrial = ref(0)
const trialStartTime = ref(0) // 每个字的开始时间
const reactionTimes = ref([])
const timeoutCount = ref(0) // 超时次数

// 限时模式相关
const timeRemaining = ref(100) // 剩余时间百分比
let timerInterval = null
let timeoutTimer = null

const colors = [
  { name: 'red', value: '#ff3366', label: '红' },
  { name: 'blue', value: '#00d4ff', label: '蓝' },
  { name: 'green', value: '#00ff88', label: '绿' },
  { name: 'yellow', value: '#ffaa00', label: '黄' },
  { name: 'purple', value: '#7b2cbf', label: '紫' },
  { name: 'orange', value: '#ff6b35', label: '橙' },
  { name: 'pink', value: '#ff66cc', label: '粉' },
  { name: 'white', value: '#ffffff', label: '白' },
  { name: 'black', value: '#000000', label: '黑' }
]

const progress = computed(() => (currentTrial.value / totalTrials.value) * 100)

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

function startTraining() {
  isTraining.value = true
  showResult.value = false
  correctCount.value = 0
  currentTrial.value = 0
  reactionTimes.value = []
  timeoutCount.value = 0
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
  }

  clearTimers()
  setTimeout(nextTrial, 300)
}

function endTraining() {
  isTraining.value = false
  showResult.value = true
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
      averageReactionTime: avgReactionTime.value,
      fastestTime: fastestTime.value,
      slowestTime: slowestTime.value,
      timeoutCount: timeoutCount.value
    }
  })
}

function resetTraining() {
  showResult.value = false
  isTraining.value = false
}

function goBack() {
  clearTimers()
  router.back()
}

// 组件卸载时清理计时器
onUnmounted(() => {
  clearTimers()
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
  @include flex-center;
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-md;
  overflow-y: auto;
  @include custom-scrollbar;
}

.config-card {
  @include glass-card;
  padding: $spacing-2xl;
  max-width: 500px;
  width: 100%;

  h2 {
    text-align: center;
    margin-bottom: $spacing-xl;
  }
}

.difficulty-buttons {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;

  .difficulty-btn {
    @include button-reset;
    padding: $spacing-lg;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    text-align: left;
    transition: all $transition-base;
    position: relative;

    span {
      display: block;
      font-size: $font-sm;
      color: $text-secondary;
      margin-top: $spacing-xs;
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

  @media (max-width: $breakpoint-sm) {
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
  padding: calc($spacing-lg + 60px) $spacing-lg $spacing-lg;
  overflow-y: auto;
  @include custom-scrollbar;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.timer-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-full;
  overflow: hidden;
  margin-bottom: $spacing-xl;

  .timer-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff3366, #ffaa00, #00ff88);
    transition: width 0.05s linear;
  }
}

.word-display {
  font-size: clamp(3rem, 10vw, 6rem);
  font-weight: $font-bold;
  margin-bottom: $spacing-2xl;
  min-height: 150px;
  @include flex-center;
  flex: 0 0 auto;
}

.color-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
  flex: 0 0 auto;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-sm;
  }

  .color-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-xl;
    border-radius: $radius-md;
    font-size: $font-xl;
    font-weight: $font-bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

    @media (max-width: $breakpoint-sm) {
      padding: $spacing-lg;
      font-size: $font-lg;
    }
  }
}

.progress {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-full;
  overflow: hidden;
  flex: 0 0 auto;

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, $accent-primary, $accent-secondary);
    transition: width $transition-base;
  }
}

.result-screen {
  flex: 1;
  @include flex-center;
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-md;
  overflow-y: auto;
  @include custom-scrollbar;
}

.result-card {
  @include glass-card;
  padding: $spacing-2xl;
  max-width: 600px;
  width: 100%;

  h2 {
    text-align: center;
    font-size: $font-2xl;
    margin-bottom: $spacing-xl;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;
  margin-bottom: $spacing-2xl;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    background: rgba(255, 255, 255, 0.03);
    border-radius: $radius-md;
    border: 1px solid rgba(255, 255, 255, 0.05);

    .stat-label {
      font-size: $font-base;
      color: $text-secondary;
    }

    .stat-value {
      font-size: $font-xl;
      font-weight: $font-bold;
      color: $accent-primary;
    }
  }
}

.result-actions {
  display: flex;
  gap: $spacing-sm;

  .action-button {
    @include button-reset;
    flex: 1;
    padding: $spacing-md $spacing-lg;
    border-radius: $radius-md;
    font-weight: $font-medium;
    font-size: $font-sm;
    white-space: nowrap;
    transition: all $transition-base;

    @media (max-width: $breakpoint-sm) {
      padding: $spacing-sm $spacing-md;
      font-size: $font-xs;
    }

    &.primary {
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      color: $text-primary;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
      }
    }

    &.secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      color: $text-primary;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: $accent-primary;
      }
    }
  }
}
</style>
