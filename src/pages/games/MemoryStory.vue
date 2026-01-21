<template>
  <div class="memory-story-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">情景联想记忆</h1>
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
      title="情景联想记忆"
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
import GameGuide from '@/components/GameGuide.vue'
import GameResult from '@/components/GameResult.vue'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 游戏说明
const showGuide = ref(false)
const guideContent = {
  howToPlay: `
    <p>通过<strong>编故事</strong>的方式记住物品，然后从混合选项中选出正确的物品。</p>
    <ul>
      <li>记忆阶段：观察物品，构建联想故事（可选）</li>
      <li>回忆阶段：从包含干扰项的选项中选出正确物品</li>
      <li>不需要记住顺序，只需记住物品本身</li>
      <li>选项位置完全打乱，避免位置记忆</li>
    </ul>
  `,
  benefits: `
    <p>情景联想记忆训练可以提升：</p>
    <ul>
      <li><strong>联想记忆</strong> - 通过故事增强记忆</li>
      <li><strong>创造力</strong> - 构建生动的联想场景</li>
      <li><strong>长期记忆</strong> - 有意义的记忆更持久</li>
      <li><strong>抗干扰能力</strong> - 从干扰项中识别目标</li>
    </ul>
  `,
  tips: `
    <p>记忆三原则：</p>
    <ul>
      <li><strong>具象化</strong>：物品要有<em>颜色、款式</em>等具体特征</li>
      <li><strong>强关联</strong>：物品之间要有<em>连贯的场景</em>关系</li>
      <li><strong>加感官</strong>：场景要包含<em>触感、声音</em>等感官体验</li>
      <li>故事越生动、越荒诞，记忆效果越好</li>
    </ul>
  `
}

// 配置
const itemCount = ref(parseInt(itemCountOptions[0].value))

// 游戏状态
const gameState = ref('idle') // 'idle' | 'countdown' | 'active' | 'completed'
const isTraining = ref(false)
const showResult = ref(false)
const phase = ref('memorize') // 'memorize' | 'recall'
const items = ref([])
const recallOptions = ref([]) // 回忆阶段的选项（包含正确答案+干扰项）
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
  // 从回忆选项中过滤掉已选择的
  return recallOptions.value.filter(item => !userRecall.value.find(r => r.name === item.name))
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

function generateRecallOptions() {
  // 生成回忆选项：原物品 + 3-5个干扰项
  const distractorCount = Math.floor(Math.random() * 3) + 3 // 随机3-5个干扰项
  
  // 获取不在原物品中的其他物品作为干扰项
  const distractors = itemPool
    .filter(item => !items.value.find(i => i.name === item.name))
    .sort(() => Math.random() - 0.5)
    .slice(0, distractorCount)
  
  // 合并所有选项
  const allOptions = [...items.value, ...distractors]
  
  // 使用 Fisher-Yates 洗牌算法彻底打乱顺序
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]]
  }
  
  return allOptions
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
      // 进入回忆阶段，生成回忆选项
      recallOptions.value = generateRecallOptions()
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

  // 计算顺序正确的数量（仅供参考，不影响准确率）
  let correctOrderCount = 0
  for (let i = 0; i < items.value.length; i++) {
    if (userRecall.value[i]?.name === items.value[i].name) {
      correctOrderCount++
    }
  }

  correctItems.value = correctItemCount
  correctOrder.value = correctOrderCount
  // 准确率基于物品正确数，不考虑顺序
  accuracy.value = correctItemCount / items.value.length

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

  // 计算新的评分系统分数
  const score = calculateMemoryStoryScore()
  
  userStore.addTrainingRecord({
    moduleName: 'memory-story',
    difficulty: `${itemCount.value}个物品`,
    score: Math.round(score),
    duration: itemCount.value * 10 * 1000,
    accuracy: accuracy.value,
    details: {
      itemCount: itemCount.value,
      correctItems: correctItems.value,
      correctOrder: correctOrder.value,
      userStory: userStory.value,
      memoryTime: memoryTime.value
    }
  })
}

function calculateMemoryStoryScore() {
  // 记忆准确率分数 (70%) - 结合物品准确率和位置准确率
  const itemAccuracy = correctItems.value / itemCount.value
  const locationAccuracy = correctOrder.value / itemCount.value
  const accuracyScore = (itemAccuracy * 0.6 + locationAccuracy * 0.4) * 100

  // 联想效率分数 (20%) - 基于记忆时间
  const standardMemoryTime = itemCount.value * 5000 // 每个物品5秒
  const actualMemoryTime = memoryTime.value || standardMemoryTime
  const speedRatio = standardMemoryTime / actualMemoryTime
  const speedScore = Math.min(100, speedRatio * 100)

  // 记忆保持分数 (10%) - 基于整体表现（简化版本）
  const retentionScore = accuracyScore // 使用准确率作为记忆保持指标

  // 最终分数
  const finalScore = accuracyScore * 0.7 + speedScore * 0.2 + retentionScore * 0.1
  return Math.max(0, Math.min(100, finalScore))
}

function saveTrainingRecord() {
  userStore.addTrainingRecord({
    gameType: 'memory-story',
    score: calculateMemoryStoryScore(),
    duration: Date.now() - startTime.value,
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
  recallOptions.value = [] // 清空回忆选项
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
    font-size: $font-base; // 从 sm 增大到 base
    margin-bottom: $spacing-sm;
    color: $accent-primary;

    @include mobile {
      font-size: $font-sm; // 从 xs 增大到 sm
      margin-bottom: $spacing-xs;
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin-bottom: $spacing-sm;

    li {
      padding: $spacing-xs 0;
      font-size: $font-sm; // 从 xs 增大到 sm
      line-height: 1.5; // 从 1.4 增加到 1.5

      @include mobile {
        font-size: $font-xs; // 从 10px 增大到 xs
      }

      strong {
        color: $accent-secondary;
      }
    }
  }

  .example {
    font-size: $font-xs; // 从 10px 增大到 xs
    color: $text-secondary;
    margin-bottom: $spacing-xs;

    @include mobile {
      font-size: 11px; // 从 9px 增大到 11px
    }
  }

  .example-story {
    font-size: $font-xs; // 从 10px 增大到 xs
    color: $text-secondary;
    font-style: italic;
    line-height: 1.6; // 增加行高，更易读

    @include mobile {
      font-size: 11px; // 从 9px 增大到 11px
    }

    em {
      color: $accent-primary; // 强调文字颜色更明显
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
  overflow-y: auto; // 允许滚动
  overflow-x: hidden;
  @include custom-scrollbar;
  position: relative;
  min-height: 0;
  
  @include mobile {
    padding: calc($spacing-md + 60px) $spacing-sm $spacing-sm; // 移动端减小内边距
    gap: $spacing-xs; // 移动端减小间距
  }
}

.phase-title {
  text-align: center;
  margin-bottom: $spacing-md; // 添加底部间距控制

  @include mobile {
    margin-bottom: $spacing-sm; // 移动端减小间距
  }

  h2 {
    font-size: $font-xl;
    margin-bottom: $spacing-sm;
    
    @include mobile {
      font-size: $font-lg; // 移动端缩小标题
      margin-bottom: $spacing-xs;
    }
  }

  p {
    font-size: $font-lg;
    color: $text-secondary;
    
    @include mobile {
      font-size: $font-base; // 移动端缩小字体
    }
  }

  .timer {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $accent-warning;
    
    @include mobile {
      font-size: $font-xl; // 移动端缩小字体
    }
  }
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg; // 添加底部间距
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @include mobile {
    grid-template-columns: repeat(3, 1fr); // 移动端固定3列
    gap: $spacing-xs; // 移动端减小间距
    margin-bottom: $spacing-md;
  }

  .item-card {
    @include glass-card;
    padding: $spacing-lg;
    text-align: center;
    position: relative;

    @include mobile {
      padding: $spacing-sm $spacing-xs; // 移动端大幅减小内边距
    }

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
      
      @include mobile {
        width: 18px; // 移动端缩小序号
        height: 18px;
        font-size: 10px;
        top: 4px;
        left: 4px;
      }
    }

    .item-icon {
      font-size: 3rem;
      margin-bottom: $spacing-sm;
      
      @include mobile {
        font-size: 1.8rem; // 移动端进一步缩小图标
        margin-bottom: 4px;
      }
    }

    .item-name {
      font-size: $font-base;
      font-weight: $font-medium;
      
      @include mobile {
        font-size: 11px; // 移动端缩小文字
      }
    }
  }
}

.story-input-section {
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @include mobile {
    margin-bottom: $spacing-sm; // 移动端减小底部间距
  }

  label {
    display: block;
    font-weight: $font-medium;
    margin-bottom: $spacing-sm;
    
    @include mobile {
      font-size: $font-sm; // 移动端缩小标签
      margin-bottom: $spacing-xs;
    }
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

    @include mobile {
      min-height: 80px; // 移动端减小高度
      padding: $spacing-sm; // 移动端减小内边距
      font-size: $font-sm; // 移动端缩小字体
    }

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
  margin-bottom: $spacing-lg; // 添加底部间距

  @include mobile {
    grid-template-columns: repeat(3, 1fr); // 移动端固定3列
    gap: $spacing-xs; // 移动端减小间距
    margin-bottom: $spacing-md;
  }

  .recall-button {
    @include button-reset;
    @include glass-card;
    @include click-feedback;
    padding: $spacing-lg;
    text-align: center;
    transition: all $transition-base;

    @include mobile {
      padding: $spacing-sm $spacing-xs; // 移动端大幅减小内边距
    }

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
      
      @include mobile {
        font-size: 1.8rem; // 移动端进一步缩小图标
        margin-bottom: 4px;
      }
    }

    .item-name {
      font-size: $font-sm;
      font-weight: $font-medium;
      
      @include mobile {
        font-size: 11px; // 移动端缩小文字
      }
    }
  }
}

.selected-sequence {
  @include glass-card;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg; // 添加底部间距

  @include mobile {
    padding: $spacing-md; // 移动端减小内边距
    margin-bottom: $spacing-md;
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
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-sm $spacing-md;
      background: rgba(0, 212, 255, 0.2);
      border-radius: $radius-md;
      font-size: $font-sm;

      @include mobile {
        padding: $spacing-xs $spacing-sm; // 移动端减小内边距
        font-size: $font-xs; // 移动端缩小字体
        gap: 4px;
      }

      .item-number {
        width: 20px;
        height: 20px;
        border-radius: $radius-full;
        background: $accent-primary;
        color: $bg-primary;
        font-size: $font-xs;
        font-weight: $font-bold;
        @include flex-center;
        
        @include mobile {
          width: 16px; // 移动端缩小序号
          height: 16px;
          font-size: 10px;
        }
      }

      .item-icon {
        font-size: 1.2rem;
        
        @include mobile {
          font-size: 1rem; // 移动端缩小图标
        }
      }
    }
  }
}

.recall-actions {
  display: flex;
  gap: $spacing-md;

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

    @include mobile {
      padding: $spacing-sm $spacing-md; // 移动端减小内边距（高度）
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
</style>
