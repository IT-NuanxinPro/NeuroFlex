<template>
  <div class="memory-story-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">情景联想记忆</h1>
    </header>

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
          <p class="config-hint">
            {{ itemCount === 5 ? '基础' : itemCount === 7 ? '进阶' : '高级' }}
          </p>
        </div>

        <div class="instruction-box">
          <h3>记忆三原则</h3>
          <ul>
            <li><strong>具象化：</strong>物品要有颜色、款式等具体特征</li>
            <li><strong>强关联：</strong>物品之间要有连贯的场景关系</li>
            <li><strong>加感官：</strong>场景要包含触感、声音等感官体验</li>
          </ul>
          <p class="example">例如：红色雨伞→火车→面包→吉他→云朵</p>
          <p class="example-story">
            "我撑着一把<em>鲜红的</em>雨伞，走进<em>轰隆作响的</em>火车车厢，
            闻到了<em>香喷喷的</em>面包味道，旁边有人弹着<em>木质</em>吉他，
            透过窗户看到<em>柔软的</em>白云飘过。"
          </p>
        </div>

        <button class="start-button" @click="handleStartTraining">开始训练</button>
      </div>
    </div>

    <!-- 训练界面 - 记忆阶段 -->
    <div v-if="isTraining && phase === 'memorize'" class="training-screen">
      <!-- 倒计时遮罩层 -->
      <GameCountdown
        :current-count="countdown.currentCount.value"
        :progress="countdown.progress.value"
        :is-visible="countdown.isCountingDown.value"
      />

      <div class="phase-title">
        <h2>请记住这些物品并构建故事</h2>
        <p class="timer">剩余时间: {{ remainingTime }}秒</p>
      </div>

      <div class="items-grid" :class="{ disabled: isGameDisabled }">
        <div v-for="(item, idx) in items" :key="idx" class="item-card">
          <div class="item-number">{{ idx + 1 }}</div>
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-name">{{ item.name }}</div>
        </div>
      </div>

      <div class="story-input-section" :class="{ disabled: isGameDisabled }">
        <label>构建你的故事（可选）</label>
        <textarea
          v-model="userStory"
          placeholder="在这里写下你的联想故事，帮助记忆..."
          class="story-textarea"
          :disabled="isGameDisabled"
        ></textarea>
      </div>
    </div>

    <!-- 训练界面 - 回忆阶段 -->
    <div v-if="isTraining && phase === 'recall'" class="training-screen">
      <div class="phase-title">
        <h2>请按顺序回忆物品</h2>
        <p>{{ userRecall.length }} / {{ items.length }}</p>
      </div>

      <div class="recall-grid">
        <button
          v-for="item in availableItems"
          :key="item.name"
          :class="['recall-button', { disabled: isSubmitted }]"
          :disabled="isSubmitted"
          @click="selectItem(item)"
        >
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-name">{{ item.name }}</div>
        </button>
      </div>

      <div v-if="userRecall.length > 0" class="selected-sequence">
        <h3>已选择的顺序：</h3>
        <div class="selected-items">
          <div v-for="(item, idx) in userRecall" :key="idx" class="selected-item">
            <span class="item-number">{{ idx + 1 }}</span>
            <span class="item-icon">{{ item.icon }}</span>
            <span class="item-name">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <div class="recall-actions">
        <button
          class="secondary-button"
          :disabled="userRecall.length === 0 || isSubmitted"
          @click="undoSelection"
        >
          撤销
        </button>
        <button
          class="primary-button"
          :disabled="userRecall.length !== items.length || isSubmitted"
          @click="submitRecall"
        >
          提交答案
        </button>
      </div>
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
import { itemPool, itemCountOptions } from '@/config/memoryStory.js'
import GameCountdown from '@/components/GameCountdown.vue'
import GameResult from '@/components/GameResult.vue'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 配置
const itemCount = ref(parseInt(itemCountOptions[0].value))

// 游戏状态
const gameState = ref('idle') // 'idle' | 'countdown' | 'active' | 'completed'
const isTraining = ref(false)
const showResult = ref(false)
const phase = ref('memorize') // 'memorize' | 'recall'
const items = ref([])
const userStory = ref('')
const userRecall = ref([])
const isSubmitted = ref(false)
const correctItems = ref(0)
const correctOrder = ref(0)
const accuracy = ref(0)
const remainingTime = ref(60)

let memoryTimer = null

// 倒计时设置
const countdown = useGameCountdown({
  duration: 3,
  onComplete: startGame
})

const availableItems = computed(() => {
  return itemPool.filter(item => !userRecall.value.find(r => r.name === item.name))
})

const isGameDisabled = computed(() => {
  return gameState.value === 'countdown'
})

// 结果弹窗相关
const resultType = computed(() => (accuracy.value >= 0.8 ? 'success' : 'warning'))

const resultTitle = computed(() => (accuracy.value >= 0.8 ? '完成！' : '继续努力'))

const resultSubtitle = computed(() => {
  if (accuracy.value >= 0.9) return '记忆力超群！'
  if (accuracy.value >= 0.8) return '表现不错，继续保持！'
  return '多加练习，提升记忆力！'
})

const resultStats = computed(() => [
  { label: '物品正确', value: `${correctItems.value}/${items.value.length}`, highlight: true },
  { label: '顺序正确', value: `${correctOrder.value}/${items.value.length}`, highlight: true },
  { label: '准确率', value: `${Math.round(accuracy.value * 100)}%`, highlight: false },
  { label: '记忆时间', value: `${itemCount.value * 10}秒`, highlight: false }
])

function generateItems() {
  const shuffled = [...itemPool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, itemCount.value)
}

function handleStartTraining() {
  // 立即进入训练界面并显示物品
  isTraining.value = true
  showResult.value = false
  phase.value = 'memorize'
  items.value = generateItems()
  userStory.value = ''
  userRecall.value = []
  isSubmitted.value = false
  remainingTime.value = itemCount.value * 10 // 每个物品10秒

  // 设置为倒计时状态
  gameState.value = 'countdown'

  // 启动倒计时
  countdown.start()
}

function startGame() {
  // 倒计时结束后，开始游戏
  gameState.value = 'active'

  trainingStore.startTraining('memory-story')

  // 开始倒计时
  memoryTimer = setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      clearInterval(memoryTimer)
      memoryTimer = null
      phase.value = 'recall'
    }
  }, 1000)
}

function selectItem(item) {
  if (isSubmitted.value) return
  userRecall.value.push(item)
}

function undoSelection() {
  if (userRecall.value.length > 0 && !isSubmitted.value) {
    userRecall.value.pop()
  }
}

function submitRecall() {
  if (userRecall.value.length !== items.value.length) return

  isSubmitted.value = true

  // 计算正确的物品数量（不考虑顺序）
  let correctItemCount = 0
  for (const recallItem of userRecall.value) {
    if (items.value.find(item => item.name === recallItem.name)) {
      correctItemCount++
    }
  }

  // 计算顺序正确的数量
  let correctOrderCount = 0
  for (let i = 0; i < items.value.length; i++) {
    if (userRecall.value[i]?.name === items.value[i].name) {
      correctOrderCount++
    }
  }

  correctItems.value = correctItemCount
  correctOrder.value = correctOrderCount
  accuracy.value = correctOrderCount / items.value.length

  setTimeout(() => {
    endTraining()
  }, 1000)
}

function endTraining() {
  isTraining.value = false
  showResult.value = true
  gameState.value = 'completed'

  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }

  trainingStore.endTraining()

  // 保存训练记录
  const score = Math.round(accuracy.value * 100)
  userStore.addTrainingRecord({
    moduleName: 'memory-story',
    difficulty: `${itemCount.value}个物品`,
    score,
    duration: itemCount.value * 10 * 1000,
    accuracy: accuracy.value,
    details: {
      itemCount: itemCount.value,
      correctItems: correctItems.value,
      correctOrder: correctOrder.value,
      userStory: userStory.value
    }
  })
}

function resetTraining() {
  showResult.value = false
  isTraining.value = false
  gameState.value = 'idle'
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
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
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
  // 清理倒计时
  countdown.cancel()
  router.back()
}

onUnmounted(() => {
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
  // 清理倒计时
  countdown.cleanup()
})
</script>

<style lang="scss" scoped>
.memory-story-page {
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
  padding: calc($spacing-md + 60px) $spacing-md $spacing-md;
  overflow: hidden;
  min-height: 0;
}

.config-card,
.result-card {
  @include glass-card;
  padding: $spacing-lg;
  max-width: 600px;
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  @include custom-scrollbar;

  @include mobile {
    padding: $spacing-md;
  }

  h2 {
    text-align: center;
    margin-bottom: $spacing-md;
    font-size: $font-xl;

    @include mobile {
      font-size: $font-lg;
      margin-bottom: $spacing-sm;
    }
  }
}

.config-group {
  margin-bottom: $spacing-md;

  @include mobile {
    margin-bottom: $spacing-sm;
  }

  label {
    display: block;
    font-weight: $font-medium;
    margin-bottom: $spacing-sm;
    font-size: $font-sm;
  }

  .config-hint {
    margin-top: $spacing-xs;
    font-size: $font-xs;
    color: $text-secondary;
    text-align: center;
  }
}

.button-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;

  @include mobile {
    gap: $spacing-xs;
  }

  .count-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-sm;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-medium;
    font-size: $font-sm;
    transition: all $transition-base;

    @include mobile {
      padding: $spacing-xs;
      font-size: $font-xs;
    }

    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: $accent-primary;
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
    }

    // 只在桌面端启用 hover
    @media (hover: hover) and (pointer: fine) {
      &:hover:not(.active) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(0, 212, 255, 0.3);
      }
    }
  }
}

.instruction-box {
  @include glass-card;
  padding: $spacing-md;
  margin-bottom: $spacing-md;

  @include mobile {
    padding: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  h3 {
    font-size: $font-sm;
    margin-bottom: $spacing-sm;
    color: $accent-primary;

    @include mobile {
      font-size: $font-xs;
      margin-bottom: $spacing-xs;
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin-bottom: $spacing-sm;

    li {
      padding: $spacing-xs 0;
      font-size: $font-xs;
      line-height: 1.4;

      @include mobile {
        font-size: 10px;
      }

      strong {
        color: $accent-secondary;
      }
    }
  }

  .example {
    font-size: 10px;
    color: $text-secondary;
    margin-bottom: $spacing-xs;

    @include mobile {
      font-size: 9px;
    }
  }

  .example-story {
    font-size: 10px;
    color: $text-secondary;
    font-style: italic;
    line-height: 1.5;

    @include mobile {
      font-size: 9px;
    }

    em {
      color: $accent-primary;
      font-style: normal;
    }
  }
}

.start-button {
  @include button-reset;
  @include click-feedback;
  width: 100%;
  padding: clamp($spacing-sm, 2.5vh, $spacing-md);
  border-radius: $radius-md;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  font-size: clamp($font-sm, 2.5vw, $font-base);
  font-weight: $font-bold;
  transition: all $transition-base;
  box-shadow:
    0 8px 24px rgba(0, 212, 255, 0.3),
    0 0 40px rgba(0, 212, 255, 0.1);

  // 只在桌面端启用 hover
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 12px 32px rgba(0, 212, 255, 0.5),
        0 0 60px rgba(0, 212, 255, 0.3);
    }
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
  @include custom-scrollbar;
  position: relative;
  min-height: 0;
}

.phase-title {
  text-align: center;

  h2 {
    font-size: $font-xl;
    margin-bottom: $spacing-sm;
  }

  p {
    font-size: $font-lg;
    color: $text-secondary;
  }

  .timer {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $accent-warning;
  }
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: $spacing-md;
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .item-card {
    @include glass-card;
    padding: $spacing-lg;
    text-align: center;
    position: relative;

    .item-number {
      position: absolute;
      top: $spacing-sm;
      left: $spacing-sm;
      width: 24px;
      height: 24px;
      border-radius: $radius-full;
      background: $accent-primary;
      color: $bg-primary;
      font-size: $font-xs;
      font-weight: $font-bold;
      @include flex-center;
    }

    .item-icon {
      font-size: 3rem;
      margin-bottom: $spacing-sm;
    }

    .item-name {
      font-size: $font-base;
      font-weight: $font-medium;
    }
  }
}

.story-input-section {
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  label {
    display: block;
    font-weight: $font-medium;
    margin-bottom: $spacing-sm;
  }

  .story-textarea {
    width: 100%;
    min-height: 120px;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-size: $font-base;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: $accent-primary;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }
}

.recall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: $spacing-md;

  .recall-button {
    @include button-reset;
    @include glass-card;
    @include click-feedback;
    padding: $spacing-lg;
    text-align: center;
    transition: all $transition-base;

    &:hover:not(.disabled) {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .item-icon {
      font-size: 3rem;
      margin-bottom: $spacing-sm;
    }

    .item-name {
      font-size: $font-sm;
      font-weight: $font-medium;
    }
  }
}

.selected-sequence {
  @include glass-card;
  padding: $spacing-lg;

  h3 {
    font-size: $font-base;
    margin-bottom: $spacing-md;
  }

  .selected-items {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    .selected-item {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-sm $spacing-md;
      background: rgba(0, 212, 255, 0.2);
      border-radius: $radius-md;
      font-size: $font-sm;

      .item-number {
        width: 20px;
        height: 20px;
        border-radius: $radius-full;
        background: $accent-primary;
        color: $bg-primary;
        font-size: $font-xs;
        font-weight: $font-bold;
        @include flex-center;
      }

      .item-icon {
        font-size: 1.2rem;
      }
    }
  }
}

.recall-actions {
  display: flex;
  gap: $spacing-md;

  button {
    @include button-reset;
    @include click-feedback;
    flex: 1;
    padding: $spacing-lg;
    border-radius: $radius-md;
    font-weight: $font-medium;

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
</style>
