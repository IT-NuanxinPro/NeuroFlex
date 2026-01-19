<template>
  <div class="schulte-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">舒尔特方格</h1>
      <div v-if="isTraining" class="timer">{{ formatTime(elapsedTime) }}</div>
    </header>

    <!-- 配置界面 -->
    <div v-if="!isTraining && !showResult" class="config-screen">
      <div class="config-card">
        <h2>选择难度</h2>

        <div class="config-group">
          <label>方格尺寸</label>
          <div class="button-group">
            <button
              v-for="size in gridSizes"
              :key="size"
              :class="['size-button', { active: gridSize === size }]"
              @click="gridSize = size"
            >
              {{ size }}×{{ size }}
            </button>
          </div>
          <p class="config-hint">标准时间: {{ getTimeLimit(gridSize) }}秒</p>
        </div>

        <div class="config-group">
          <label>训练模式</label>
          <div class="mode-buttons">
            <button
              v-for="modeOption in modeOptions"
              :key="modeOption.value"
              :class="['mode-button', { active: mode === modeOption.value }]"
              @click="mode = modeOption.value"
            >
              {{ modeOption.label }}
            </button>
          </div>
        </div>

        <div class="settings-section">
          <h4 class="section-title">{{ settingsConfig.sections.assist.title }}</h4>

          <div class="switch-option">
            <span class="switch-label">{{ settingsConfig.options.highlightShown.label }}</span>
            <van-switch v-model="showFeedback" size="24px" @change="saveSettings" />
          </div>
        </div>

        <button class="start-button" @click="handleStartTraining">开始训练</button>
      </div>
    </div>

    <!-- 训练界面 -->
    <div v-if="isTraining" class="training-screen">
      <!-- 倒计时遮罩层 -->
      <GameCountdown
        :current-count="countdown.currentCount.value"
        :progress="countdown.progress.value"
        :is-visible="countdown.isCountingDown.value"
      />

      <div
        class="grid-container"
        :class="{ disabled: isGameDisabled }"
        :style="{ '--grid-size': gridSize }"
      >
        <button
          v-for="(cell, index) in grid"
          :key="index"
          :class="[
            'grid-cell',
            {
              correct: clickedNumbers.includes(cell.value),
              error: lastClickWrong && index === lastClickIndex
            }
          ]"
          :style="cell.color ? { color: cell.color } : {}"
          @click="handleClick(cell.value, index)"
        >
          {{ cell.value }}
        </button>
      </div>

      <div class="progress-info">
        <p>
          当前目标: <strong>{{ currentTarget }}</strong>
        </p>
        <p>
          已完成: {{ showFeedback ? clickedNumbers.length : (mode === 'reverse' ? totalNumbers - currentTarget : currentTarget - 1) }} /
          {{ totalNumbers }}
        </p>
        <p>
          错误次数: <strong class="error-count">{{ wrongCount }}</strong>
        </p>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import { useGameCountdown } from '@/composables/useGameCountdown'
import { gridSizes, modeOptions, timeLimitMap, settingsConfig } from '@/config/schulte.js'
import GameCountdown from '@/components/GameCountdown.vue'
import GameResult from '@/components/GameResult.vue'
import { Switch as VanSwitch } from 'vant'
import 'vant/lib/switch/style'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 配置
const gridSize = ref(gridSizes[1])
const mode = ref('number')
const showFeedback = ref(settingsConfig.options.highlightShown.default) // 使用配置的默认值

// 设置持久化相关
const STORAGE_KEY = settingsConfig.options.highlightShown.storageKey

// 检查 localStorage 是否可用
function isLocalStorageAvailable() {
  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    console.error('localStorage 不可用:', error)
    return false
  }
}

// 从 localStorage 加载设置
function loadSettings() {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage 不可用，使用默认设置')
    return
  }

  try {
    const savedValue = localStorage.getItem(STORAGE_KEY)
    if (savedValue !== null) {
      // 解析保存的值
      const parsedValue = JSON.parse(savedValue)
      showFeedback.value = parsedValue
    }
  } catch (error) {
    console.error('加载设置失败，使用默认值:', error)
    // 如果数据损坏，清除并使用默认值
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (removeError) {
      console.error('清除损坏数据失败:', removeError)
    }
    // 回退到默认值（已经在初始化时设置）
  }
}

// 保存设置到 localStorage
function saveSettings() {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage 不可用，设置仅在会话期间有效')
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(showFeedback.value))
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage 配额已满，无法保存设置:', error)
    } else {
      console.error('保存设置失败:', error)
    }
    // 继续使用内存状态
  }
}

// 游戏状态
const gameState = ref('idle') // 'idle' | 'countdown' | 'active' | 'completed'
const isTraining = ref(false)
const showResult = ref(false)
const grid = ref([])
const clickedNumbers = ref([])
const currentTarget = ref(1)
const startTime = ref(0)
const elapsedTime = ref(0)
const finalTime = ref(0)
const lastClickWrong = ref(false)
const lastClickIndex = ref(-1)
const reactionTimes = ref([])
const wrongCount = ref(0)
const isSuccess = ref(false)

let timer = null

// 倒计时设置
const countdown = useGameCountdown({
  duration: 3,
  onComplete: startGame
  // onTick 回调可选，暂不使用
})

const totalNumbers = computed(() => gridSize.value * gridSize.value)

const isGameDisabled = computed(() => {
  return gameState.value === 'countdown'
})

const averageReactionTime = computed(() => {
  if (reactionTimes.value.length === 0) return 0
  const sum = reactionTimes.value.reduce((a, b) => a + b, 0)
  return Math.round(sum / reactionTimes.value.length)
})

// 结果弹窗相关
const resultType = computed(() => (isSuccess.value ? 'success' : 'timeout'))

const resultTitle = computed(() => (isSuccess.value ? '完成！' : '超时'))

const resultSubtitle = computed(() => {
  if (isSuccess.value) {
    return wrongCount.value === 0 ? '完美表现！' : '继续努力！'
  }
  return '再试一次，你可以做得更好！'
})

const resultStats = computed(() => [
  {
    label: '用时',
    value: formatTime(finalTime.value),
    highlight: true
  },
  {
    label: '标准时间',
    value: `${getTimeLimit(gridSize.value)}秒`,
    highlight: false
  },
  {
    label: '平均反应',
    value: `${averageReactionTime.value}ms`,
    highlight: true
  },
  {
    label: '错误次数',
    value: `${wrongCount.value}`,
    highlight: false
  }
])

function getTimeLimit(size) {
  return timeLimitMap[size] || 30
}

function generateGrid() {
  // 根据模式生成数字序列
  let numbers
  if (mode.value === 'reverse') {
    // 降序模式：从大到小
    numbers = Array.from({ length: totalNumbers.value }, (_, i) => totalNumbers.value - i)
  } else {
    // 正常模式和多色模式：从小到大
    numbers = Array.from({ length: totalNumbers.value }, (_, i) => i + 1)
  }
  
  // Fisher-Yates 洗牌算法
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }

  // 如果是多色模式，为每个数字分配颜色
  if (mode.value === 'color') {
    return numbers.map(num => ({
      value: num,
      color: getRandomColor()
    }))
  }

  return numbers.map(num => ({ value: num, color: null }))
}

function getRandomColor() {
  const colors = [
    '#ff3366', // 红色
    '#00d4ff', // 青色
    '#00ff88', // 绿色
    '#ffaa00', // 橙色
    '#ff66cc', // 粉色
    '#7b2cbf', // 紫色
    '#00ffff', // 亮青色
    '#ffff00' // 黄色
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

function handleStartTraining() {
  // 立即进入训练界面并显示宫格
  isTraining.value = true
  showResult.value = false
  grid.value = generateGrid()
  wrongCount.value = 0
  clickedNumbers.value = []
  
  // 根据模式设置初始目标
  if (mode.value === 'reverse') {
    currentTarget.value = totalNumbers.value // 降序模式从最大数字开始
  } else {
    currentTarget.value = 1 // 正常模式从1开始
  }
  
  reactionTimes.value = []
  lastClickWrong.value = false

  // 设置为倒计时状态
  gameState.value = 'countdown'

  // 启动倒计时
  countdown.start()
}

function startGame() {
  // 倒计时结束后，开始游戏
  gameState.value = 'active'
  startTime.value = Date.now()
  elapsedTime.value = 0

  trainingStore.startTraining('schulte')

  // 开始计时
  timer = setInterval(() => {
    elapsedTime.value = Date.now() - startTime.value

    // 检查超时
    if (elapsedTime.value >= getTimeLimit(gridSize.value) * 1000) {
      endTraining(false)
    }
  }, 100)
}

function handleClick(num, index) {
  if (num === currentTarget.value) {
    // 正确点击
    const reactionTime = Date.now() - startTime.value - clickedNumbers.value.length * 100
    reactionTimes.value.push(reactionTime)

    // 根据设置决定是否添加到已点击列表（控制绿色高亮）
    if (showFeedback.value) {
      clickedNumbers.value.push(num)
    }

    lastClickWrong.value = false

    // 根据模式更新目标
    if (mode.value === 'reverse') {
      currentTarget.value-- // 降序模式递减
      // 检查是否完成（降序模式到0结束）
      if (currentTarget.value < 1) {
        endTraining(true)
      }
    } else {
      currentTarget.value++ // 正常模式递增
      // 检查是否完成（正常模式超过最大值结束）
      if (currentTarget.value > totalNumbers.value) {
        endTraining(true)
      }
    }
  } else {
    // 错误点击 - 始终显示错误反馈
    wrongCount.value++
    lastClickWrong.value = true
    lastClickIndex.value = index

    setTimeout(() => {
      lastClickWrong.value = false
    }, 400)
  }
}

function endTraining(success) {
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  gameState.value = 'completed'
  isTraining.value = false
  showResult.value = true
  finalTime.value = elapsedTime.value
  isSuccess.value = success

  trainingStore.endTraining()

  // 保存训练记录
  const score = success ? Math.max(0, 100 - Math.floor(finalTime.value / 1000)) : 0
  userStore.addTrainingRecord({
    moduleName: 'schulte',
    difficulty: `${gridSize.value}x${gridSize.value}`,
    score,
    duration: finalTime.value,
    accuracy: (currentTarget.value - 1) / totalNumbers.value,
    details: {
      gridSize: gridSize.value,
      mode: mode.value,
      reactionTimes: reactionTimes.value,
      averageReactionTime: averageReactionTime.value,
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

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const milliseconds = Math.floor((ms % 1000) / 100)
  return `${seconds}.${milliseconds}s`
}

function goBack() {
  router.back()
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  // 清理倒计时
  countdown.cleanup()
})
</script>

<style lang="scss" scoped>
.schulte-page {
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
    @include click-feedback;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;
    @include flex-center;
    position: absolute;
    left: $spacing-lg;
  }

  .page-title {
    font-size: $font-xl;
    font-weight: $font-semibold;
    margin: 0;
    text-align: center;
  }

  .timer {
    font-size: $font-xl;
    font-weight: $font-bold;
    color: $accent-primary;
    min-width: 80px;
    text-align: right;
    position: absolute;
    right: $spacing-lg;
  }
}

.config-screen,
.result-screen {
  flex: 1;
  @include flex-center;
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-md;
  overflow-y: auto;
  @include custom-scrollbar;
}

.config-card {
  @include glass-card;
  padding: $spacing-2xl;
  max-width: 600px; // 从500px增加到600px
  width: 100%;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  @include mobile {
    padding: $fluid-spacing-lg;
    max-width: 90vw;
    margin: 0 auto;
  }

  h2 {
    text-align: center;
    margin-bottom: $spacing-xl;
    font-size: $font-2xl;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @include mobile {
      font-size: $fluid-font-xl;
      margin-bottom: $fluid-spacing-lg;
    }
  }
}

.config-group {
  margin-bottom: $spacing-xl;

  label {
    display: block;
    font-weight: $font-medium;
    margin-bottom: $spacing-md;
  }

  .config-hint {
    margin-top: $spacing-sm;
    font-size: $font-sm;
    color: $text-secondary;
    text-align: center;
  }
}

.button-group {
  @include button-grid;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;

  @include mobile {
    gap: $spacing-sm;
  }

  .size-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-lg;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-semibold;
    font-size: $font-lg;
    transition: all $transition-base;
    position: relative;

    @include mobile {
      padding: $spacing-md;
      font-size: $fluid-font-sm;
    }

    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: $accent-primary;
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
      transform: scale(1.05);
    }

    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(0, 212, 255, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
}

.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  .mode-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-medium;
    text-align: left;
    transition: all $transition-base;

    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: $accent-primary;
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
    }

    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(0, 212, 255, 0.3);
    }
  }
}

.start-button {
  @include button-reset;
  width: 100%;
  padding: $spacing-lg;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  font-size: $font-lg;
  font-weight: $font-bold;
  transition: all $transition-base;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 8px 24px rgba(0, 212, 255, 0.3),
    0 0 40px rgba(0, 212, 255, 0.1);

  @include mobile {
    padding: $spacing-md;
    font-size: $font-base;
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition:
      width 0.6s,
      height 0.6s;
  }

  &:hover {
    box-shadow:
      0 12px 32px rgba(0, 212, 255, 0.5),
      0 0 60px rgba(0, 212, 255, 0.3);

    &::before {
      width: 300px;
      height: 300px;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.training-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  // 精确计算：100vh - 标题栏60px
  height: calc(100vh - 60px);
  padding: $spacing-lg;
  overflow: hidden;
  position: relative;

  @include mobile {
    padding: $spacing-md;
  }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(var(--grid-size), 1fr);
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.02);
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &.disabled {
    opacity: 0.3;
    pointer-events: none;
    filter: blur(12px);
  }

  // 根据格子数量动态设置间距和内边距
  gap: calc(36px - var(--grid-size) * 2px);
  padding: calc(44px - var(--grid-size) * 2.5px);

  // 关键：同时限制宽度和高度，取较小值
  // 宽度：根据格子数量计算理想尺寸
  // 高度：不超过可用高度（100vh - 标题60px - 上下padding - 底部进度条预留）
  width: min(
    calc(140px * var(--grid-size) - var(--grid-size) * 12px),
    90vw,
    calc(100vh - 60px - 48px - 120px)
  );
  max-height: calc(100vh - 60px - 48px - 120px);

  @include mobile {
    // 移动端：根据格子数量动态调整间距
    // 3×3: 18px大间距, 5×5: 12px, 7×7: 8px, 9×9: 5px
    gap: calc(24px - var(--grid-size) * 2px);
    padding: calc(24px - var(--grid-size) * 1.5px);

    // 移动端：充分利用屏幕宽度，让格子尽可能大
    // 使用85vw作为基准，确保3×3有足够大的按钮
    width: min(85vw, calc(100vh - 60px - 32px - 120px));
    max-height: calc(100vh - 60px - 32px - 120px);
  }

  .grid-cell {
    @include button-reset;
    @include flex-center;
    font-weight: $font-bold;
    color: $text-primary;
    transition: none !important;
    transform: none !important;
    cursor: pointer;
    aspect-ratio: 1;
    border-radius: $radius-md;
    position: relative;
    overflow: hidden;

    // PC端：字体大小 - 更大更清晰
    // 3×3: 3.4rem, 5×5: 2.5rem, 7×7: 1.8rem, 9×9: 1.3rem
    font-size: calc(4rem - var(--grid-size) * 0.3rem);

    @include mobile {
      // 移动端：更大的字体，方便识别
      // 3×3: 2.3rem, 5×5: 1.7rem, 7×7: 1.25rem, 9×9: 0.9rem
      font-size: calc(2.9rem - var(--grid-size) * 0.2rem);
      border-radius: $radius-sm;
    }

    // 玻璃拟态背景
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.03) 100%
    );
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    // 边框和阴影
    border: 2px solid rgba(255, 255, 255, 0.15);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);

    @include mobile {
      border-width: 1px;
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    // 光泽效果
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
      opacity: 0;
      transition: opacity $transition-base;
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: none !important;
        box-shadow: none !important;
      }
    }

    &:active {
      transform: none !important;
      box-shadow: none !important;
    }

    &.correct {
      background: linear-gradient(135deg, rgba(0, 255, 136, 0.25) 0%, rgba(0, 255, 136, 0.12) 100%);
      border-color: rgba(0, 255, 136, 0.6);
      box-shadow:
        0 4px 20px rgba(0, 255, 136, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      pointer-events: none;

      // 在高亮模式下，覆盖颜色为绿色
      color: $accent-success !important;
    }

    &.error {
      background: linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 51, 102, 0.1) 100%);
      border-color: rgba(255, 51, 102, 0.6);
      box-shadow:
        0 4px 16px rgba(255, 51, 102, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
  }
}

.progress-info {
  position: fixed;
  bottom: $spacing-xl;
  right: $spacing-xl;
  text-align: center;
  font-size: $font-lg;
  padding: $spacing-xl;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  min-width: 200px;
  z-index: 50;

  @include mobile {
    min-width: auto;
    padding: $spacing-md;
    bottom: $spacing-md;
    right: $spacing-md;
    font-size: $fluid-font-sm;
  }

  p {
    margin-bottom: $spacing-sm;
    color: $text-secondary;
    font-weight: $font-medium;

    @include mobile {
      margin-bottom: $spacing-xs;
      font-size: $font-xs;
    }

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      color: $accent-primary;
      font-size: $font-3xl;
      text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
      display: inline-block;
      margin: 0 $spacing-xs;

      @include mobile {
        font-size: $fluid-font-2xl;
        margin: 0 $spacing-xs;
      }
    }

    .error-count {
      color: $accent-error;
      font-size: $font-2xl;
      text-shadow: 0 0 20px rgba(255, 51, 102, 0.5);

      @include mobile {
        font-size: $fluid-font-xl;
      }
    }
  }
}

.switch-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all $transition-base;
  margin-bottom: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.3);
  }

  .switch-label {
    font-size: $font-base;
    font-weight: $font-medium;
    color: $text-primary;
  }

  // 自定义Vant Switch样式
  :deep(.van-switch) {
    --van-switch-on-background: linear-gradient(135deg, #00d4ff, #7b2cbf);
    --van-switch-background: rgba(255, 255, 255, 0.15);
    --van-switch-node-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}

.settings-section {
  margin-bottom: $spacing-xl;

  .section-title {
    font-size: $font-base;
    font-weight: $font-medium;
    color: $text-primary;
    margin-bottom: 12px;
    margin-top: 0;
  }
}
</style>
