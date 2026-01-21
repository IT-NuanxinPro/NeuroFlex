<template>
  <div class="categorize-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">规则导向分类</h1>
      <button v-if="!isTraining" class="help-button" @click="showGuide = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="2" />
          <path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span>规则</span>
      </button>
    </header>

    <!-- 游戏说明弹窗 -->
    <GameGuide
      :visible="showGuide"
      title="规则导向分类"
      :how-to-play="guideContent.howToPlay"
      :benefits="guideContent.benefits"
      :tips="guideContent.tips"
      @close="showGuide = false"
    />

    <!-- 配置界面 -->
    <div v-if="!isTraining && !showResult" class="config-screen">
      <div class="config-card">
        <h2>选择难度</h2>

        <div class="config-group">
          <label>分类维度</label>
          <div class="button-group">
            <button :class="['dim-button', { active: dimensions === 1 }]" @click="dimensions = 1">
              单维度（品类）
            </button>
            <button :class="['dim-button', { active: dimensions === 2 }]" @click="dimensions = 2">
              双维度（品类+价格）
            </button>
          </div>
        </div>

        <div class="config-group">
          <label>物品数量</label>
          <ButtonGroupSelect v-model="itemCount" :options="itemCountOptions" />
        </div>

        <div class="config-group">
          <label>显示时长</label>
          <ButtonGroupSelect v-model="displayTime" :options="displayTimeOptions" />
        </div>

        <button class="start-button" @click="startTraining">开始训练</button>
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

      <div class="rules-display">
        <h3>分类规则</h3>
        <p v-if="dimensions === 1">请选择物品的<strong>品类</strong></p>
        <p v-else>请选择物品的<strong>品类+价格等级</strong>（高价&gt;10元，低价≤10元）</p>
      </div>

      <div class="progress-info">
        <p class="progress-text">{{ currentIndex }} / {{ items.length }}</p>
        <p class="remaining-time">{{ (remainingMs / 1000).toFixed(1) }}s</p>
      </div>

      <Transition name="item-fade" mode="out-in">
        <div v-if="currentItem" :key="currentIndex" class="item-display" :class="{ disabled: isGameDisabled }">
          <div class="item-card">
            <div class="item-icon">{{ currentItem.icon }}</div>
            <div class="item-name">{{ currentItem.name }}</div>
            <div v-if="dimensions === 2" class="item-price">¥{{ currentItem.price }}</div>
          </div>
        </div>
      </Transition>

      <Transition name="options-fade" mode="out-in">
        <div v-if="currentItem" :key="currentIndex" class="answer-options" :class="{ disabled: isGameDisabled }">
          <button
            v-for="option in currentOptions"
            :key="option"
            :class="[
              'option-button',
              {
                correct: showFeedback && option === correctAnswer,
                wrong: showFeedback && option === userAnswer && option !== correctAnswer
              }
            ]"
            :disabled="showFeedback || isGameDisabled"
            @click="selectAnswer(option)"
          >
            {{ option }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- 结果界面 -->
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
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import { useGameCountdown } from '@/composables/useGameCountdown'
import { useReactionTime } from '@/composables/useReactionTime'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'
import GameCountdown from '@/components/GameCountdown.vue'
import GameGuide from '@/components/GameGuide.vue'
import GameResult from '@/components/GameResult.vue'
import { itemPool, itemCountOptions, displayTimeOptions } from '@/config/categorize.js'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 游戏说明
const showGuide = ref(false)
const guideContent = {
  howToPlay: `
    <p>根据规则快速判断物品的<strong>品类</strong>或<strong>品类+价格</strong>。</p>
    <ul>
      <li><strong>单维度</strong>：只判断品类（食品/文具/日用品/电子产品）</li>
      <li><strong>双维度</strong>：同时判断品类和价格等级（高价>10元，低价≤10元）</li>
      <li>在限定时间内选择正确答案</li>
      <li>超时自动进入下一题</li>
    </ul>
  `,
  benefits: `
    <p>规则导向分类训练可以提升：</p>
    <ul>
      <li><strong>分类思维</strong> - 快速归类信息</li>
      <li><strong>规则理解</strong> - 理解并应用规则</li>
      <li><strong>多维判断</strong> - 同时处理多个维度信息</li>
      <li><strong>决策速度</strong> - 提高快速决策能力</li>
    </ul>
  `,
  tips: `
    <p>训练技巧：</p>
    <ul>
      <li>先熟悉<em>单维度</em>模式</li>
      <li>双维度需要同时关注品类和价格</li>
      <li>选项位置每次都会打乱，避免记忆位置</li>
      <li>保持冷静，快速但准确地判断</li>
    </ul>
  `
}

// 配置
const dimensions = ref(1)
const itemCount = ref('10')
const displayTime = ref('2500')

// 游戏状态
const gameState = ref('idle') // 'idle' | 'countdown' | 'active' | 'completed'
const isTraining = ref(false)
const showResult = ref(false)
const items = ref([])
const currentIndex = ref(0)
const currentItem = ref(null)
const currentOptions = ref([])
const correctAnswer = ref('')
const userAnswer = ref('')
const showFeedback = ref(false)
const results = ref([])

// 使用反应时间 Hook
const reaction = useReactionTime()

let itemTimer = null
const itemStartTime = ref(0)
const remainingMs = ref(0)
let countdownInterval = null

// 倒计时设置
const countdown = useGameCountdown({
  duration: 3,
  onComplete: startGameAfterCountdown
})

const correctCount = computed(() => results.value.filter(r => r.correct).length)
const accuracy = computed(() => correctCount.value / items.value.length)

const isGameDisabled = computed(() => {
  return gameState.value === 'countdown'
})

// 结果弹窗相关
const resultType = computed(() => (accuracy.value >= 0.8 ? 'success' : 'warning'))

const resultTitle = computed(() => (accuracy.value >= 0.8 ? '完成！' : '继续努力'))

const resultSubtitle = computed(() => {
  if (accuracy.value >= 0.9) return '完美表现！'
  if (accuracy.value >= 0.8) return '表现不错，继续保持！'
  return '多加练习，你会更好！'
})

const resultStats = computed(() => [
  { label: '正确率', value: `${Math.round(accuracy.value * 100)}%`, highlight: true },
  { label: '正确数', value: `${correctCount.value}/${items.value.length}`, highlight: false },
  { label: '平均反应', value: `${reaction.averageReactionTime.value}ms`, highlight: true },
  { label: '错误数', value: `${items.value.length - correctCount.value}`, highlight: false }
])

function generateItems() {
  const shuffled = [...itemPool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, parseInt(itemCount.value))
}

function generateOptions(item) {
  if (dimensions.value === 1) {
    // 单维度：只有品类，每次随机打乱顺序
    const categories = ['食品', '文具', '日用品', '电子产品']
    return categories.sort(() => Math.random() - 0.5)
  } else {
    // 双维度：品类+价格
    const priceLevel = item.price > 10 ? '高价' : '低价'
    const options = [
      `${item.category}${priceLevel}`,
      `${item.category}${priceLevel === '高价' ? '低价' : '高价'}`
    ]

    // 添加其他品类的选项
    const otherCategories = ['食品', '文具', '日用品', '电子产品'].filter(c => c !== item.category)
    const randomCategory = otherCategories[Math.floor(Math.random() * otherCategories.length)]
    options.push(`${randomCategory}高价`)
    options.push(`${randomCategory}低价`)

    return options.sort(() => Math.random() - 0.5).slice(0, 4)
  }
}

function startTraining() {
  // 立即进入训练界面
  isTraining.value = true
  showResult.value = false
  items.value = generateItems()
  currentIndex.value = 0
  results.value = []
  reaction.reset()

  // 设置为倒计时状态
  gameState.value = 'countdown'

  // 启动倒计时
  countdown.start()
}

function startGameAfterCountdown() {
  // 倒计时结束后，开始游戏
  gameState.value = 'active'

  trainingStore.startTraining('categorize')

  showNextItem()
}

function showNextItem() {
  if (itemTimer) {
    clearTimeout(itemTimer)
    itemTimer = null
  }
  if (countdownInterval) clearInterval(countdownInterval)
  if (currentIndex.value >= items.value.length) {
    endTraining()
    return
  }

  currentItem.value = items.value[currentIndex.value]
  currentOptions.value = generateOptions(currentItem.value)

  if (dimensions.value === 1) {
    correctAnswer.value = currentItem.value.category
  } else {
    const priceLevel = currentItem.value.price > 10 ? '高价' : '低价'
    correctAnswer.value = `${currentItem.value.category}${priceLevel}`
  }

  showFeedback.value = false
  userAnswer.value = ''
  itemStartTime.value = Date.now()
  remainingMs.value = parseInt(displayTime.value)
  countdownInterval = setInterval(() => {
    remainingMs.value -= 100
    if (remainingMs.value <= 0) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }, 100)

  // 如果在限定时间内未作答，自动判错并进入下一题
  itemTimer = setTimeout(() => {
    // 超时不记录反应时间

    results.value.push({
      item: currentItem.value.name,
      userAnswer: '(超时)',
      correctAnswer: correctAnswer.value,
      correct: false
    })

    currentIndex.value++
    showNextItem()
  }, parseInt(displayTime.value))
}

function selectAnswer(option) {
  if (itemTimer) {
    clearTimeout(itemTimer)
    itemTimer = null
  }
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  if (showFeedback.value) return

  const reactionTime = Date.now() - itemStartTime.value
  
  // 立即更新状态，提供即时反馈
  userAnswer.value = option
  showFeedback.value = true

  const isCorrect = option === correctAnswer.value
  
  // 只有正确答案才记录反应时间
  if (isCorrect) {
    reaction.recordClick()
  }
  
  results.value.push({
    item: currentItem.value.name,
    userAnswer: option,
    correctAnswer: correctAnswer.value,
    correct: isCorrect,
    reactionTime
  })

  // 快速切换到下一题（缩短延迟，配合快速动画）
  setTimeout(() => {
    currentIndex.value++
    showNextItem()
  }, 350)
}

function endTraining() {
  gameState.value = 'completed'
  isTraining.value = false
  showResult.value = true

  trainingStore.endTraining()

  // 计算新的评分系统分数
  const score = calculateCategorizeScore()
  const totalTime = reaction.timestamps.value.length > 0
    ? reaction.timestamps.value[reaction.timestamps.value.length - 1] - reaction.timestamps.value[0]
    : 0
    
  userStore.addTrainingRecord({
    moduleName: 'categorize',
    difficulty: dimensions.value === 1 ? '单维度' : '双维度',
    score: Math.round(score),
    duration: totalTime,
    accuracy: accuracy.value,
    details: {
      dimensions: dimensions.value,
      itemCount: items.value.length,
      displayTime: displayTime.value,
      correctCount: correctCount.value,
      averageReactionTime: reaction.averageReactionTime.value,
      results: results.value
    }
  })
}

function calculateCategorizeScore() {
  // 分类准确率分数 (70%)
  const accuracyScore = accuracy.value * 100

  // 规则理解速度分数 (20%) - 基于学习试次
  const standardLearningTrials = dimensions.value === 1 ? 8 : 15
  const actualLearningTrials = items.value.length // 使用总试次数作为学习指标
  const speedRatio = standardLearningTrials / actualLearningTrials
  const speedScore = Math.min(100, speedRatio * 100)

  // 认知灵活性分数 (10%) - 基于错误率和反应时间一致性
  const errorRate = (items.value.length - correctCount.value) / items.value.length
  const flexibilityScore = Math.max(0, (1 - errorRate * 2) * 100)

  // 最终分数
  const finalScore = accuracyScore * 0.7 + speedScore * 0.2 + flexibilityScore * 0.1
  return Math.max(0, Math.min(100, finalScore))
}

function resetTraining() {
  showResult.value = false
  isTraining.value = false
  gameState.value = 'idle'
}

function handleRetry() {
  showResult.value = false
  resetTraining()
  startTraining()
}

function handleClose() {
  showResult.value = false
  goBack()
}

function goBack() {
  router.back()
}

onUnmounted(() => {
  if (itemTimer) {
    clearTimeout(itemTimer)
  }
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  // 清理倒计时
  countdown.cleanup()
})
</script>

<style lang="scss" scoped>
.categorize-page {
  min-height: 100vh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: fixed;
  top: env(safe-area-inset-top, 0px);
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

  .help-button {
    @include button-reset;
    @include click-feedback;
    height: 40px;
    padding: 0 $spacing-md;
    border-radius: $radius-full;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: $accent-primary;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    position: absolute;
    right: $spacing-lg;
    transition: all $transition-base;
    font-size: $font-sm;
    font-weight: $font-medium;

    &:hover {
      background: rgba(0, 212, 255, 0.2);
      border-color: $accent-primary;
      transform: scale(1.05);
    }

    svg {
      flex-shrink: 0;
    }

    span {
      white-space: nowrap;
    }
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
  max-width: 500px;
  width: 100%;
  @include mobile {
    padding: $spacing-lg;
  }

  h2 {
    text-align: center;
    margin-bottom: $spacing-xl;
  }
}

.config-group {
  margin-bottom: $spacing-xl;

  label {
    display: block;
    font-weight: $font-medium;
    margin-bottom: $spacing-md;
  }
}

.button-group {
  @include button-grid;

  .dim-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-medium;
    transition: all $transition-base;
    @include mobile {
      padding: $spacing-sm;
    }

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
  @include click-feedback;
  width: 100%;
  padding: $spacing-lg;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
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
  display: flex;
  flex-direction: column;
  padding: calc($spacing-lg + 60px) $spacing-md $spacing-md;
  gap: $spacing-sm;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.rules-display {
  @include glass-card;
  padding: $spacing-md;
  text-align: center;
  flex-shrink: 0;

  h3 {
    font-size: $font-sm;
    margin-bottom: $spacing-xs;
  }

  p {
    font-size: $font-base;
    color: $text-secondary;

    strong {
      color: $accent-primary;
    }
  }
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  flex-shrink: 0;

  .progress-text {
    font-size: $font-sm;
    color: $text-secondary;
  }

  .remaining-time {
    font-size: clamp(1.5rem, 6vw, 2.5rem);
    font-weight: $font-bold;
    color: $accent-primary;
    letter-spacing: 1px;
  }
}

.item-display {
  flex: 1;
  @include flex-center;
  transition: opacity 0.3s ease;
  min-height: 0;

  &.disabled {
    opacity: 0.3;
    pointer-events: none;
  }

  .item-card {
    @include glass-card;
    padding: $spacing-xl;
    text-align: center;
    max-width: 400px;
    width: 100%;

    @include mobile {
      padding: $spacing-lg;
    }

    .item-icon {
      font-size: clamp(2.5rem, 8vw, 4rem);
      margin-bottom: $spacing-md;
    }

    .item-name {
      font-size: clamp($font-lg, 4vw, $font-2xl);
      font-weight: $font-bold;
      margin-bottom: $spacing-sm;
    }

    .item-price {
      font-size: $font-base;
      color: $accent-warning;
    }
  }
}

.answer-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
  width: 100%;
  box-sizing: border-box;
  padding: 0 $spacing-md;
  transition: opacity 0.3s ease;
  flex-shrink: 0;

  &.disabled {
    opacity: 0.3;
    pointer-events: none;
  }

  .option-button {
    @include button-reset;
    @include glass-card;
    @include click-feedback;
    padding: clamp($spacing-md, 3vh, $spacing-xl);
    font-size: clamp($font-sm, 2.5vw, $font-lg);
    font-weight: $font-medium;
    transition: all 0.15s ease; // 加快按钮响应速度

    // 只在桌面端启用 hover 效果
    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
    }

    &:disabled {
      cursor: not-allowed;
    }

    &.correct {
      background: rgba(0, 255, 136, 0.2);
      border-color: $accent-success;
      transition: all 0.1s ease; // 即时显示正确反馈
    }

    &.wrong {
      background: rgba(255, 51, 102, 0.2);
      border-color: $accent-error;
      transition: all 0.1s ease; // 即时显示错误反馈
    }
  }
}

// 物品卡片过渡动画 - 快速流畅
.item-fade-enter-active {
  transition: all 0.15s ease-out;
}

.item-fade-leave-active {
  transition: all 0.12s ease-in;
}

.item-fade-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

.item-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

// 选项按钮过渡动画 - 快速流畅
.options-fade-enter-active {
  transition: all 0.15s ease-out;
}

.options-fade-leave-active {
  transition: all 0.12s ease-in;
}

.options-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.options-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
