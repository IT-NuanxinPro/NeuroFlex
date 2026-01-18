<template>
  <div class="categorize-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">规则导向分类</h1>
    </header>

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
      <div class="rules-display">
        <h3>分类规则</h3>
        <p v-if="dimensions === 1">请说出物品的<strong>品类</strong></p>
        <p v-else>请说出物品的<strong>品类+价格等级</strong>（高价>10元，低价≤10元）</p>
      </div>

      <div class="progress-info">
        <p>进度: {{ currentIndex }} / {{ items.length }}</p>
      </div>

      <div class="item-display" v-if="currentItem">
        <div class="item-card">
          <div class="item-icon">{{ currentItem.icon }}</div>
          <div class="item-name">{{ currentItem.name }}</div>
          <div class="item-price" v-if="dimensions === 2">¥{{ currentItem.price }}</div>
        </div>
      </div>

      <div class="answer-options" v-if="currentItem">
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
          @click="selectAnswer(option)"
          :disabled="showFeedback"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <!-- 结果界面 -->
    <div v-if="showResult" class="result-screen">
      <div class="result-card">
        <div class="result-icon" :class="accuracy >= 0.8 ? 'success' : 'partial'">
          <svg
            v-if="accuracy >= 0.8"
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
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h2>{{ accuracy >= 0.8 ? '完成！' : '继续努力' }}</h2>

        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">正确数</span>
            <span class="stat-value">{{ correctCount }} / {{ items.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">准确率</span>
            <span class="stat-value">{{ Math.round(accuracy * 100) }}%</span>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 物品库
const itemPool = [
  { name: '面包', category: '食品', price: 5, icon: '🍞' },
  { name: '蛋糕', category: '食品', price: 15, icon: '🍰' },
  { name: '苹果', category: '食品', price: 3, icon: '🍎' },
  { name: '牛排', category: '食品', price: 50, icon: '🥩' },
  { name: '铅笔', category: '文具', price: 2, icon: '✏️' },
  { name: '笔记本', category: '文具', price: 8, icon: '📓' },
  { name: '钢笔', category: '文具', price: 25, icon: '🖊️' },
  { name: '书包', category: '文具', price: 80, icon: '🎒' },
  { name: '牙刷', category: '日用品', price: 10, icon: '🪥' },
  { name: '毛巾', category: '日用品', price: 15, icon: '🧻' },
  { name: '雨伞', category: '日用品', price: 30, icon: '☂️' },
  { name: '水杯', category: '日用品', price: 20, icon: '🥤' },
  { name: '手机', category: '电子产品', price: 3000, icon: '📱' },
  { name: '耳机', category: '电子产品', price: 200, icon: '🎧' },
  { name: '充电宝', category: '电子产品', price: 100, icon: '🔋' },
  { name: 'U盘', category: '电子产品', price: 50, icon: '💾' }
]

// 配置
const dimensions = ref(1)
const itemCount = ref('10')
const displayTime = ref('2000')

const itemCountOptions = [
  { label: '10个', value: '10' },
  { label: '15个', value: '15' },
  { label: '20个', value: '20' }
]

const displayTimeOptions = [
  { label: '2秒', value: '2000' },
  { label: '1.5秒', value: '1500' },
  { label: '1秒', value: '1000' }
]

// 训练状态
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
const reactionTimes = ref([])
const itemStartTime = ref(0)

const correctCount = computed(() => results.value.filter(r => r.correct).length)
const accuracy = computed(() => correctCount.value / items.value.length)
const averageReactionTime = computed(() => {
  if (reactionTimes.value.length === 0) return 0
  const sum = reactionTimes.value.reduce((a, b) => a + b, 0)
  return Math.round(sum / reactionTimes.value.length)
})

function generateItems() {
  const shuffled = [...itemPool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, parseInt(itemCount.value))
}

function generateOptions(item) {
  if (dimensions.value === 1) {
    // 单维度：只有品类
    const categories = ['食品', '文具', '日用品', '电子产品']
    return categories
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
  isTraining.value = true
  showResult.value = false
  items.value = generateItems()
  currentIndex.value = 0
  results.value = []
  reactionTimes.value = []

  trainingStore.startTraining('categorize')

  showNextItem()
}

function showNextItem() {
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
}

function selectAnswer(option) {
  if (showFeedback.value) return

  const reactionTime = Date.now() - itemStartTime.value
  reactionTimes.value.push(reactionTime)

  userAnswer.value = option
  showFeedback.value = true

  const isCorrect = option === correctAnswer.value
  results.value.push({
    item: currentItem.value.name,
    userAnswer: option,
    correctAnswer: correctAnswer.value,
    correct: isCorrect,
    reactionTime
  })

  // 延迟显示下一题
  setTimeout(() => {
    currentIndex.value++
    showNextItem()
  }, 1000)
}

function endTraining() {
  isTraining.value = false
  showResult.value = true

  trainingStore.endTraining()

  // 保存训练记录
  const score = Math.round(accuracy.value * 100)
  userStore.addTrainingRecord({
    moduleName: 'categorize',
    difficulty: dimensions.value === 1 ? '单维度' : '双维度',
    score,
    duration: reactionTimes.value.reduce((a, b) => a + b, 0),
    accuracy: accuracy.value,
    details: {
      dimensions: dimensions.value,
      itemCount: items.value.length,
      displayTime: displayTime.value,
      correctCount: correctCount.value,
      averageReactionTime: averageReactionTime.value,
      results: results.value
    }
  })
}

function resetTraining() {
  showResult.value = false
  isTraining.value = false
}

function goBack() {
  router.back()
}
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;

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
  display: flex;
  flex-direction: column;
  padding: calc($spacing-lg + 60px) $spacing-lg $spacing-lg;
  gap: $spacing-lg;
  overflow-y: auto;
  @include custom-scrollbar;
}

.rules-display {
  @include glass-card;
  padding: $spacing-lg;
  text-align: center;

  h3 {
    font-size: $font-base;
    margin-bottom: $spacing-sm;
  }

  p {
    font-size: $font-lg;
    color: $text-secondary;

    strong {
      color: $accent-primary;
    }
  }
}

.progress-info {
  text-align: center;
  font-size: $font-lg;
  color: $text-secondary;
}

.item-display {
  flex: 1;
  @include flex-center;

  .item-card {
    @include glass-card;
    padding: $spacing-3xl;
    text-align: center;
    min-width: 300px;

    .item-icon {
      font-size: 6rem;
      margin-bottom: $spacing-lg;
    }

    .item-name {
      font-size: $font-2xl;
      font-weight: $font-bold;
      margin-bottom: $spacing-sm;
    }

    .item-price {
      font-size: $font-lg;
      color: $accent-warning;
    }
  }
}

.answer-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  max-width: 600px;
  margin: 0 auto;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
  }

  .option-button {
    @include button-reset;
    @include glass-card;
    @include click-feedback;
    padding: $spacing-lg;
    font-size: $font-lg;
    font-weight: $font-medium;
    transition: all $transition-base;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    &:disabled {
      cursor: not-allowed;
    }

    &.correct {
      background: rgba(0, 255, 136, 0.2);
      border-color: $accent-success;
    }

    &.wrong {
      background: rgba(255, 51, 102, 0.2);
      border-color: $accent-error;
    }
  }
}

.result-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto $spacing-lg;
  border-radius: $radius-full;
  @include flex-center;

  &.success {
    background: rgba(0, 255, 136, 0.2);
    color: $accent-success;
  }

  &.partial {
    background: rgba(255, 170, 0, 0.2);
    color: $accent-warning;
  }
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin: $spacing-xl 0;

  .stat {
    text-align: center;

    .stat-label {
      display: block;
      font-size: $font-sm;
      color: $text-secondary;
      margin-bottom: $spacing-xs;
    }

    .stat-value {
      display: block;
      font-size: $font-xl;
      font-weight: $font-bold;
      color: $accent-primary;
    }
  }
}

.result-actions {
  display: flex;
  gap: $spacing-sm;

  button {
    @include button-reset;
    @include click-feedback;
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
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .primary-button {
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
    }
  }
}
</style>
