<template>
  <div class="sequence-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">序列工作记忆</h1>
      <button v-if="!isTraining" class="help-button" @click="showGuide = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="2" />
          <path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </header>

    <!-- 游戏说明弹窗 -->
    <GameGuide
      :visible="showGuide"
      title="序列工作记忆"
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
          <label>物品数量</label>
          <div class="button-group">
            <button
              v-for="opt in itemCountOptions"
              :key="opt.value"
              :class="['count-button', { active: itemCount === parseInt(opt.value) }]"
              @click="itemCount = parseInt(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="config-group">
          <label>显示速度</label>
          <ButtonGroupSelect v-model="displaySpeed" :options="speedOptions" />
        </div>

        <button class="start-button" @click="handleStartTraining">开始训练</button>
      </div>
    </div>

    <!-- 训练界面 - 展示阶段 -->
    <div v-if="isTraining && phase === 'display'" class="training-screen">
      <!-- 倒计时遮罩层 -->
      <GameCountdown
        :current-count="countdown.currentCount.value"
        :progress="countdown.progress.value"
        :is-visible="countdown.isCountingDown.value"
      />

      <div class="progress-bar" :class="{ disabled: isGameDisabled }">
        <div
          class="progress-fill"
          :style="{ width: `${(currentIndex / sequence.length) * 100}%` }"
        ></div>
      </div>

      <div class="item-display" :class="{ disabled: isGameDisabled }">
        <div v-if="currentItem" class="item-card">
          <div class="item-icon">{{ currentItem.icon }}</div>
          <div class="item-name">{{ currentItem.name }}</div>
          <div class="item-category">{{ currentItem.category }}</div>
        </div>
        <p class="hint">请记住物品的品类和顺序</p>
      </div>
    </div>

    <!-- 训练界面 - 回忆阶段 -->
    <div v-if="isTraining && phase === 'recall'" class="training-screen">
      <!-- 倒计时遮罩层 -->
      <GameCountdown
        :current-count="countdown.currentCount.value"
        :progress="countdown.progress.value"
        :is-visible="countdown.isCountingDown.value"
      />

      <div class="recall-info" :class="{ disabled: isGameDisabled }">
        <p>请按顺序选择刚才看到的物品</p>
        <p class="recall-progress">{{ userRecall.length }} / {{ sequence.length }}</p>
      </div>

      <div class="item-grid" :class="{ disabled: isGameDisabled }">
        <button
          v-for="item in recallOptions"
          :key="item.name"
          :class="[
            'item-button',
            {
              disabled: isSubmitted || userRecall.some(r => r.name === item.name)
            }
          ]"
          :disabled="isSubmitted || userRecall.some(r => r.name === item.name)"
          @click="selectItem(item)"
        >
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-name">{{ item.name }}</div>
        </button>
      </div>

      <div
        v-if="userRecall.length > 0"
        class="selected-sequence"
        :class="{ disabled: isGameDisabled }"
      >
        <h3>已选择的顺序：</h3>
        <div class="selected-items">
          <span v-for="(item, idx) in userRecall" :key="idx" class="selected-item">
            {{ idx + 1 }}. {{ item.icon }} {{ item.name }}
          </span>
        </div>
      </div>

      <div class="recall-actions" :class="{ disabled: isGameDisabled }">
        <button
          class="secondary-button"
          :disabled="userRecall.length === 0 || isSubmitted"
          @click="undoSelection"
        >
          撤销
        </button>
        <button
          class="primary-button"
          :disabled="userRecall.length !== sequence.length || isSubmitted"
          @click="submitRecall"
        >
          提交答案
        </button>
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
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import { useGameCountdown } from '@/composables/useGameCountdown'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'
import GameCountdown from '@/components/GameCountdown.vue'
import GameGuide from '@/components/GameGuide.vue'
import GameResult from '@/components/GameResult.vue'
import { itemPool, itemCountOptions, speedOptions } from '@/config/sequence.js'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 游戏说明
const showGuide = ref(false)
const guideContent = {
  howToPlay: `
    <p>记住物品的<strong>品类和顺序</strong>，然后按顺序回忆。</p>
    <ul>
      <li>展示阶段：依次展示物品，记住它们的品类和顺序</li>
      <li>回忆阶段：从所有物品中按顺序选择刚才看到的</li>
      <li>可以撤销上一次选择</li>
      <li>选够数量后提交答案</li>
    </ul>
  `,
  benefits: `
    <p>序列工作记忆训练可以提升：</p>
    <ul>
      <li><strong>工作记忆</strong> - 短期记忆和信息保持</li>
      <li><strong>顺序记忆</strong> - 记住信息的先后顺序</li>
      <li><strong>注意力</strong> - 集中注意力观察</li>
      <li><strong>信息编码</strong> - 有效编码和存储信息</li>
    </ul>
  `,
  tips: `
    <p>训练技巧：</p>
    <ul>
      <li>展示时<em>专注观察</em>每个物品</li>
      <li>可以在心里复述物品顺序</li>
      <li>尝试将物品分组记忆</li>
      <li>从少量物品开始，逐步增加难度</li>
    </ul>
  `
}

const itemCount = ref(parseInt(itemCountOptions[1].value)) // 默认9个
const displaySpeed = ref('normal')

// 游戏状态
const gameState = ref('idle') // 'idle' | 'countdown' | 'active' | 'completed'
const isTraining = ref(false)
const showResult = ref(false)
const phase = ref('display')
const sequence = ref([]) // 展示的物品序列
const recallOptions = ref([]) // 回忆时的选项（展示的 + 3个干扰项）
const currentIndex = ref(0)
const currentItem = ref(null)
const userRecall = ref([])
const isSubmitted = ref(false)
const correctItems = ref(0)
const correctOrder = ref(0)
const accuracy = ref(0)

const speedMap = { slow: 2000, normal: 1500, fast: 1000 }

// 倒计时设置
const countdown = useGameCountdown({
  duration: 3,
  onComplete: startGame
})

const isGameDisabled = computed(() => {
  return gameState.value === 'countdown'
})

// 结果弹窗相关
const resultType = computed(() => 'success')

const resultTitle = computed(() => '训练完成')

const resultSubtitle = computed(() => {
  if (accuracy.value >= 0.9) {
    return '出色的记忆力！'
  } else if (accuracy.value >= 0.7) {
    return '继续努力！'
  }
  return '多加练习，你会做得更好！'
})

const resultStats = computed(() => [
  { label: '正确项', value: `${correctItems.value}/${itemCount.value}`, highlight: true },
  { label: '顺序正确', value: `${correctOrder.value}/${itemCount.value}`, highlight: true },
  { label: '准确率', value: `${(accuracy.value * 100).toFixed(0)}%`, highlight: false },
  { label: '显示速度', value: speedOptions.find(s => s.value === displaySpeed.value)?.label || '', highlight: false }
])

function generateSequence() {
  // 从物品池中随机选择 itemCount + 3 个物品
  const shuffled = [...itemPool].sort(() => Math.random() - 0.5)
  const totalItems = shuffled.slice(0, itemCount.value + 3)

  // 前 itemCount 个作为展示序列
  const displaySequence = totalItems.slice(0, itemCount.value)

  // 所有 itemCount + 3 个作为回忆选项（打乱顺序）
  const options = [...totalItems].sort(() => Math.random() - 0.5)

  return { displaySequence, options }
}

function handleStartTraining() {
  // 立即进入训练界面并准备游戏
  isTraining.value = true
  showResult.value = false
  phase.value = 'display'

  const { displaySequence, options } = generateSequence()
  sequence.value = displaySequence
  recallOptions.value = options

  currentIndex.value = 0
  userRecall.value = []
  isSubmitted.value = false

  // 设置为倒计时状态
  gameState.value = 'countdown'

  // 启动倒计时
  countdown.start()
}

function startGame() {
  // 倒计时结束后，开始游戏
  gameState.value = 'active'
  trainingStore.startTraining('sequence')
  displayNextItem()
}

function displayNextItem() {
  if (currentIndex.value < sequence.value.length) {
    currentItem.value = sequence.value[currentIndex.value]
    currentIndex.value++
    setTimeout(() => {
      displayNextItem()
    }, speedMap[displaySpeed.value])
  } else {
    currentItem.value = null
    setTimeout(() => {
      phase.value = 'recall'
    }, 1000)
  }
}

function selectItem(item) {
  if (isSubmitted.value) return
  if (userRecall.value.some(r => r.name === item.name)) return
  // 限制选择数量不能超过展示的物品数量
  if (userRecall.value.length >= sequence.value.length) return
  userRecall.value.push(item)
}

function undoSelection() {
  if (userRecall.value.length > 0 && !isSubmitted.value) userRecall.value.pop()
}

function submitRecall() {
  if (userRecall.value.length !== sequence.value.length) return
  isSubmitted.value = true
  let correctCat = 0,
    correctSeq = 0
  for (let i = 0; i < sequence.value.length; i++) {
    if (userRecall.value[i].name === sequence.value[i].name) correctSeq++
    if (sequence.value.some(item => item.name === userRecall.value[i].name)) correctCat++
  }
  correctItems.value = correctCat
  correctOrder.value = correctSeq
  accuracy.value = correctSeq / sequence.value.length
  setTimeout(() => {
    endTraining()
  }, 1000)
}

function endTraining() {
  isTraining.value = false
  showResult.value = true
  gameState.value = 'completed'
  trainingStore.endTraining()
  
  // 计算新的评分系统分数
  const score = calculateSequenceScore()
  
  userStore.addTrainingRecord({
    moduleName: 'sequence',
    difficulty: `${itemCount.value}个物品`,
    score: Math.round(score),
    duration: itemCount.value * speedMap[displaySpeed.value],
    accuracy: accuracy.value,
    details: {
      itemCount: itemCount.value,
      displaySpeed: displaySpeed.value,
      correctItems: correctItems.value,
      correctOrder: correctOrder.value
    }
  })
}

function calculateSequenceScore() {
  // 准确率分数 (70%) - 结合物品准确率和顺序准确率
  const itemAccuracy = correctItems.value / itemCount.value
  const orderAccuracy = correctOrder.value / itemCount.value
  const accuracyScore = (itemAccuracy * 0.6 + orderAccuracy * 0.4) * 100

  // 速度分数 (20%) - 基于记忆时间
  const standardMemoryTime = itemCount.value * 1000 // 每项1秒
  const actualMemoryTime = itemCount.value * speedMap[displaySpeed.value]
  const speedRatio = standardMemoryTime / actualMemoryTime
  const speedScore = Math.min(100, speedRatio * 100)

  // 记忆广度分数 (10%) - 基于处理的序列长度
  const spanScore = Math.min(100, (itemCount.value / 8) * 100)

  // 最终分数
  const finalScore = accuracyScore * 0.7 + speedScore * 0.2 + spanScore * 0.1
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
  handleStartTraining()
}

function handleClose() {
  showResult.value = false
  goBack()
}

function goBack() {
  // 清理倒计时
  countdown.cancel()
  router.back()
}

onUnmounted(() => {
  // 清理倒计时
  countdown.cleanup()
})
</script>

<style lang="scss" scoped>
.sequence-page {
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

  .help-button {
    @include button-reset;
    @include click-feedback;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: $accent-primary;
    @include flex-center;
    position: absolute;
    right: $spacing-lg;
    transition: all $transition-base;

    &:hover {
      background: rgba(0, 212, 255, 0.2);
      border-color: $accent-primary;
      transform: scale(1.1);
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
  max-width: 600px;
  width: 100%;

  @include mobile {
    padding: $spacing-lg $spacing-md;
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

  .count-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-md $spacing-sm;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-medium;
    transition: all $transition-base;

    @include mobile {
      padding: $spacing-sm $spacing-xs;
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
  overflow: hidden;
  position: relative;
  min-height: 0;
  gap: $spacing-sm;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-full;
  overflow: hidden;
  flex-shrink: 0;
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $accent-primary, $accent-secondary);
    transition: width 0.3s ease;
  }
}

.item-display {
  flex: 1;
  @include flex-center;
  flex-direction: column;
  gap: $spacing-md;
  transition: opacity 0.3s ease;
  min-height: 0;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .item-card {
    @include glass-card;
    padding: clamp($spacing-xl, 4vh, $spacing-3xl);
    text-align: center;
    max-width: 400px;
    width: 100%;
    
    .item-icon {
      font-size: clamp(3rem, 8vw, 5rem);
      margin-bottom: $spacing-md;
    }
    .item-name {
      font-size: clamp($font-lg, 3vw, $font-2xl);
      font-weight: $font-bold;
      margin-bottom: $spacing-xs;
    }
    .item-category {
      font-size: clamp($font-base, 2vw, $font-lg);
      color: $accent-primary;
    }
  }
  .hint {
    font-size: $font-lg;
    color: $text-secondary;
  }
}

.recall-info {
  text-align: center;
  margin-bottom: $spacing-lg; // 从 xl 减小到 lg
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @include mobile {
    margin-bottom: $spacing-md; // 移动端进一步减小
  }

  p {
    font-size: $font-lg;
    margin-bottom: $spacing-sm;
    
    @include mobile {
      font-size: $font-base; // 移动端缩小字体
      margin-bottom: $spacing-xs;
    }
  }
  .recall-progress {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $accent-primary;
    
    @include mobile {
      font-size: $font-xl; // 移动端缩小字体
    }
  }
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg; // 从 xl 减小到 lg
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @include mobile {
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-sm; // 移动端减小间距
    margin-bottom: $spacing-md; // 移动端进一步减小
  }

  .item-button {
    @include button-reset;
    @include glass-card;
    @include click-feedback;
    padding: $spacing-md;
    text-align: center;
    transition: all $transition-base;

    @include mobile {
      padding: $spacing-sm; // 移动端减小内边距
    }

    &:hover:not(.disabled) {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
    &.disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .item-icon {
      font-size: 2.5rem;
      margin-bottom: $spacing-xs;
      
      @include mobile {
        font-size: 2rem; // 移动端缩小图标
        margin-bottom: 4px;
      }
    }
    .item-name {
      font-size: $font-sm;
      font-weight: $font-medium;
      
      @include mobile {
        font-size: $font-xs; // 移动端缩小文字
      }
    }
  }
}

.selected-sequence {
  @include glass-card;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg; // 从 xl 减小到 lg
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @include mobile {
    padding: $spacing-md; // 移动端减小内边距
    margin-bottom: $spacing-md; // 移动端进一步减小
  }

  h3 {
    font-size: $font-base;
    margin-bottom: $spacing-md;
    
    @include mobile {
      font-size: $font-sm; // 移动端缩小标题
      margin-bottom: $spacing-sm;
    }
  }
  .selected-items {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    
    @include mobile {
      gap: $spacing-xs; // 移动端减小间距
    }
    
    .selected-item {
      padding: $spacing-sm $spacing-md;
      background: rgba(0, 212, 255, 0.2);
      border-radius: $radius-md;
      font-size: $font-sm;
      
      @include mobile {
        padding: $spacing-xs $spacing-sm; // 移动端减小内边距
        font-size: $font-xs; // 移动端缩小字体
      }
    }
  }
}

.recall-actions {
  display: flex;
  gap: $spacing-md;
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @include mobile {
    gap: $spacing-sm; // 移动端减小间距
  }

  button {
    @include button-reset;
    @include click-feedback;
    flex: 1;
    padding: $spacing-lg;
    border-radius: $radius-md;
    font-weight: $font-medium;
    font-size: $font-base;
    transition: all $transition-base;
    
    @include mobile {
      padding: $spacing-sm $spacing-md; // 移动端大幅减小内边距（高度）
      font-size: $font-sm; // 移动端缩小字体
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  .secondary-button {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
  }
  .primary-button {
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;
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

.answer-comparison {
  margin: $spacing-xl 0;
  h3 {
    text-align: center;
    margin-bottom: $spacing-lg;
  }
  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-lg;

    @include mobile {
      grid-template-columns: 1fr;
    }
    .comparison-column {
      h4 {
        font-size: $font-base;
        margin-bottom: $spacing-md;
        text-align: center;
      }
      .answer-list {
        @include glass-card;
        padding: $spacing-md;
        .answer-item {
          padding: $spacing-sm;
          margin-bottom: $spacing-xs;
          border-radius: $radius-sm;
          font-size: $font-sm;
          &.correct {
            background: rgba(0, 255, 136, 0.2);
          }
          &.wrong {
            background: rgba(255, 51, 102, 0.2);
          }
        }
      }
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

    @include mobile {
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
