<template>
  <div class="schulte-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">舒尔特方格</h1>
      <div class="timer" v-if="isTraining">{{ formatTime(elapsedTime) }}</div>
    </header>

    <!-- 配置界面 -->
    <div v-if="!isTraining && !showResult" class="config-screen">
      <div class="config-card">
        <h2>选择难度</h2>

        <div class="config-group">
          <label>方格尺寸</label>
          <div class="button-group">
            <button
              v-for="size in [3, 5, 7, 9]"
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

        <div class="switch-option">
          <span class="switch-label">高亮已点击数字</span>
          <van-switch v-model="showFeedback" size="24px" />
        </div>

        <button class="start-button" @click="startTraining">开始训练</button>
      </div>
    </div>

    <!-- 训练界面 -->
    <div v-if="isTraining" class="training-screen">
      <div class="grid-container" :style="{ '--grid-size': gridSize }">
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
          已完成: {{ showFeedback ? clickedNumbers.length : currentTarget - 1 }} /
          {{ totalNumbers }}
        </p>
      </div>
    </div>

    <!-- 结果界面 -->
    <div v-if="showResult" class="result-screen">
      <div class="result-card">
        <div class="result-icon" :class="isSuccess ? 'success' : 'timeout'">
          <svg
            v-if="isSuccess"
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2>{{ isSuccess ? '完成！' : '超时' }}</h2>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">用时</span>
            <span class="stat-value">{{ formatTime(finalTime) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">标准时间</span>
            <span class="stat-value">{{ getTimeLimit(gridSize) }}秒</span>
          </div>
          <div class="stat">
            <span class="stat-label">平均反应</span>
            <span class="stat-value">{{ averageReactionTime }}ms</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="secondary-button" @click="resetTraining">再来一次</button>
          <button class="primary-button" @click="goBack">返回首页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import { correctFeedback, errorFeedback } from '@/utils/animations'
import { Switch as VanSwitch } from 'vant'
import 'vant/lib/switch/style'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 配置
const gridSize = ref(5)
const mode = ref('number')
const showFeedback = ref(false) // 是否显示正确点击的视觉反馈

const modeOptions = [
  { value: 'number', label: '数字模式' },
  { value: 'color', label: '多色数字' },
  { value: 'reverse', label: '降序模式' }
]

// 训练状态
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
const isSuccess = ref(false)

let timer = null

const totalNumbers = computed(() => gridSize.value * gridSize.value)

const averageReactionTime = computed(() => {
  if (reactionTimes.value.length === 0) return 0
  const sum = reactionTimes.value.reduce((a, b) => a + b, 0)
  return Math.round(sum / reactionTimes.value.length)
})

function getTimeLimit(size) {
  const limits = { 3: 15, 5: 30, 7: 60, 9: 90 }
  return limits[size] || 30
}

function generateGrid() {
  const numbers = Array.from({ length: totalNumbers.value }, (_, i) => i + 1)
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

function startTraining() {
  isTraining.value = true
  showResult.value = false
  grid.value = generateGrid()
  clickedNumbers.value = []
  currentTarget.value = 1
  startTime.value = Date.now()
  elapsedTime.value = 0
  reactionTimes.value = []
  lastClickWrong.value = false

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

    currentTarget.value++
    lastClickWrong.value = false

    // 根据设置决定是否显示动画反馈
    if (showFeedback.value) {
      const cell = document.querySelectorAll('.grid-cell')[index]
      if (cell) correctFeedback(cell)
    }

    // 检查是否完成
    if (currentTarget.value > totalNumbers.value) {
      endTraining(true)
    }
  } else {
    // 错误点击 - 始终显示错误反馈
    lastClickWrong.value = true
    lastClickIndex.value = index

    // 错误反馈动画
    const cell = document.querySelectorAll('.grid-cell')[index]
    if (cell) errorFeedback(cell)

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
      averageReactionTime: averageReactionTime.value
    }
  })
}

function resetTraining() {
  showResult.value = false
  isTraining.value = false
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const milliseconds = Math.floor((ms % 1000) / 100)
  return `${seconds}.${milliseconds}s`
}

function goBack() {
  router.back()
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
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

.config-card,
.result-card {
  @include glass-card;
  padding: $spacing-2xl;
  max-width: 600px; // 从500px增加到600px
  width: 100%;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  @media (max-width: $breakpoint-sm) {
    padding: 20px;
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

    @media (max-width: $breakpoint-sm) {
      font-size: 20px;
      margin-bottom: 20px;
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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;

  @media (max-width: $breakpoint-sm) {
    gap: 8px;
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

    @media (max-width: $breakpoint-sm) {
      padding: 12px 8px;
      font-size: 14px;
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
      transform: translateY(-2px);
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

  @media (max-width: $breakpoint-sm) {
    padding: 14px;
    font-size: 16px;
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
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 12px 32px rgba(0, 212, 255, 0.5),
      0 0 60px rgba(0, 212, 255, 0.3);

    &::before {
      width: 300px;
      height: 300px;
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
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

  @media (max-width: $breakpoint-sm) {
    padding: 16px;
  }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(var(--grid-size), 1fr);
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.02);
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.05);

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

  @media (max-width: $breakpoint-sm) {
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
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    aspect-ratio: 1;
    border-radius: $radius-md;
    position: relative;
    overflow: hidden;

    // PC端：字体大小 - 更大更清晰
    // 3×3: 3.4rem, 5×5: 2.5rem, 7×7: 1.8rem, 9×9: 1.3rem
    font-size: calc(4rem - var(--grid-size) * 0.3rem);

    @media (max-width: $breakpoint-sm) {
      // 移动端：更大的字体，方便识别
      // 3×3: 2.3rem, 5×5: 1.7rem, 7×7: 1.25rem, 9×9: 0.9rem
      font-size: calc(2.9rem - var(--grid-size) * 0.2rem);
      border-radius: 8px;
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

    @media (max-width: $breakpoint-sm) {
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

    // 桌面端悬停效果
    @media (hover: hover) and (pointer: fine) {
      &:hover:not(.correct):not(.error) {
        background: linear-gradient(
          135deg,
          rgba(0, 212, 255, 0.15) 0%,
          rgba(123, 44, 191, 0.1) 100%
        );
        transform: translateY(-4px) scale(1.02);
        border-color: rgba(0, 212, 255, 0.6);
        box-shadow:
          0 12px 40px rgba(0, 212, 255, 0.4),
          0 0 60px rgba(0, 212, 255, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);

        &::before {
          opacity: 1;
        }
      }
    }

    &:active:not(.correct):not(.error) {
      transform: translateY(-2px) scale(0.98);
      box-shadow:
        0 6px 24px rgba(0, 212, 255, 0.3),
        inset 0 2px 4px rgba(0, 0, 0, 0.2);
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

  @media (max-width: $breakpoint-sm) {
    min-width: auto;
    padding: 16px;
    bottom: 16px;
    right: 16px;
    font-size: 14px;
  }

  p {
    margin-bottom: $spacing-sm;
    color: $text-secondary;
    font-weight: $font-medium;

    @media (max-width: $breakpoint-sm) {
      margin-bottom: 6px;
      font-size: 12px;
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

      @media (max-width: $breakpoint-sm) {
        font-size: 24px;
        margin: 0 4px;
      }
    }
  }
}

.result-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto $spacing-lg;
  border-radius: $radius-full;
  @include flex-center;
  position: relative;

  @media (max-width: $breakpoint-sm) {
    width: 80px;
    height: 80px;
    margin-bottom: 16px;
  }

  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: $radius-full;
    padding: 4px;
    background: linear-gradient(135deg, currentColor, transparent);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.5;
  }

  svg {
    @media (max-width: $breakpoint-sm) {
      width: 48px;
      height: 48px;
    }
  }

  &.success {
    background: rgba(0, 255, 136, 0.2);
    color: $accent-success;
    box-shadow:
      0 8px 32px rgba(0, 255, 136, 0.4),
      0 0 60px rgba(0, 255, 136, 0.2);
    animation: successPulse 2s ease-in-out infinite;
  }

  &.timeout {
    background: rgba(255, 170, 0, 0.2);
    color: $accent-warning;
    box-shadow:
      0 8px 32px rgba(255, 170, 0, 0.4),
      0 0 60px rgba(255, 170, 0, 0.2);
  }
}

@keyframes successPulse {
  0%,
  100% {
    box-shadow:
      0 8px 32px rgba(0, 255, 136, 0.4),
      0 0 60px rgba(0, 255, 136, 0.2);
  }
  50% {
    box-shadow:
      0 8px 32px rgba(0, 255, 136, 0.6),
      0 0 80px rgba(0, 255, 136, 0.4);
  }
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;
  margin: $spacing-2xl 0;

  @media (max-width: $breakpoint-sm) {
    // 移动端：垂直堆叠，每行一个stat
    grid-template-columns: 1fr;
    gap: 12px;
    margin: 20px 0;
  }

  .stat {
    text-align: center;
    padding: $spacing-lg;
    background: rgba(255, 255, 255, 0.03);
    border-radius: $radius-md;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all $transition-base;

    @media (max-width: $breakpoint-sm) {
      // 移动端：横向布局，label和value在一行
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      text-align: left;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(0, 212, 255, 0.3);
      transform: translateY(-2px);
    }

    .stat-label {
      display: block;
      font-size: $font-sm;
      color: $text-secondary;
      margin-bottom: $spacing-sm;
      font-weight: $font-medium;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      @media (max-width: $breakpoint-sm) {
        margin-bottom: 0;
        font-size: 13px;
        text-transform: none;
        letter-spacing: 0;
      }
    }

    .stat-value {
      display: block;
      font-size: $font-2xl;
      font-weight: $font-bold;
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;

      @media (max-width: $breakpoint-sm) {
        font-size: 18px;
      }
    }
  }
}

.result-actions {
  display: flex;
  gap: $spacing-sm;

  button {
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
  }

  .secondary-button {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.15);
    color: $text-primary;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .primary-button {
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow:
        0 6px 16px rgba(0, 212, 255, 0.4),
        0 0 30px rgba(0, 212, 255, 0.2);
    }

    &:active {
      transform: translateY(0);
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
  margin-bottom: $spacing-xl;

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
</style>
