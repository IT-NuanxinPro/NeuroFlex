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

        <button class="start-button" @click="startTraining">开始训练</button>
      </div>
    </div>

    <!-- 训练界面 - 记忆阶段 -->
    <div v-if="isTraining && phase === 'memorize'" class="training-screen">
      <div class="phase-title">
        <h2>请记住这些物品并构建故事</h2>
        <p class="timer">剩余时间: {{ remainingTime }}秒</p>
      </div>

      <div class="items-grid">
        <div v-for="(item, idx) in items" :key="idx" class="item-card">
          <div class="item-number">{{ idx + 1 }}</div>
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-name">{{ item.name }}</div>
        </div>
      </div>

      <div class="story-input-section">
        <label>构建你的故事（可选）</label>
        <textarea
          v-model="userStory"
          placeholder="在这里写下你的联想故事，帮助记忆..."
          class="story-textarea"
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
          @click="selectItem(item)"
          :disabled="isSubmitted"
        >
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-name">{{ item.name }}</div>
        </button>
      </div>

      <div class="selected-sequence" v-if="userRecall.length > 0">
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
          @click="undoSelection"
          :disabled="userRecall.length === 0 || isSubmitted"
        >
          撤销
        </button>
        <button
          class="primary-button"
          @click="submitRecall"
          :disabled="userRecall.length !== items.length || isSubmitted"
        >
          提交答案
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
            <span class="stat-label">物品正确</span>
            <span class="stat-value">{{ correctItems }} / {{ items.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">顺序正确</span>
            <span class="stat-value">{{ correctOrder }} / {{ items.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">准确率</span>
            <span class="stat-value">{{ Math.round(accuracy * 100) }}%</span>
          </div>
        </div>

        <div class="story-review" v-if="userStory">
          <h3>你的故事</h3>
          <p class="user-story">{{ userStory }}</p>
        </div>

        <div class="answer-comparison">
          <h3>答案对比</h3>
          <div class="comparison-grid">
            <div class="comparison-column">
              <h4>正确答案</h4>
              <div class="answer-list">
                <div v-for="(item, idx) in items" :key="idx" class="answer-item">
                  {{ idx + 1 }}. {{ item.icon }} {{ item.name }}
                </div>
              </div>
            </div>
            <div class="comparison-column">
              <h4>你的答案</h4>
              <div class="answer-list">
                <div
                  v-for="(item, idx) in userRecall"
                  :key="idx"
                  :class="[
                    'answer-item',
                    {
                      correct: item.name === items[idx]?.name,
                      wrong: item.name !== items[idx]?.name
                    }
                  ]"
                >
                  {{ idx + 1 }}. {{ item.icon }} {{ item.name }}
                </div>
              </div>
            </div>
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
import { itemPool, itemCountOptions } from '@/config/memoryStory.js'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()


// 配置
const itemCount = ref(parseInt(itemCountOptions[0].value))

// 训练状态
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

const availableItems = computed(() => {
  return itemPool.filter(item => !userRecall.value.find(r => r.name === item.name))
})

function generateItems() {
  const shuffled = [...itemPool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, itemCount.value)
}

function startTraining() {
  isTraining.value = true
  showResult.value = false
  phase.value = 'memorize'
  items.value = generateItems()
  userStory.value = ''
  userRecall.value = []
  isSubmitted.value = false
  remainingTime.value = itemCount.value * 10 // 每个物品10秒

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
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
}

function goBack() {
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
  router.back()
}

onUnmounted(() => {
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
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
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-md;
  overflow-y: auto;
  @include custom-scrollbar;
}

.config-card,
.result-card {
  @include glass-card;
  padding: $spacing-2xl;
  max-width: 700px;
  width: 100%;
  @media screen and (max-width: $breakpoint-sm) {
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

  .config-hint {
    margin-top: $spacing-sm;
    font-size: $font-sm;
    color: $text-secondary;
    text-align: center;
  }
}

.button-group {
  @include button-grid(70px,$spacing-sm);

  .count-button {
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

.instruction-box {
  @include glass-card;
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;

  h3 {
    font-size: $font-base;
    margin-bottom: $spacing-md;
    color: $accent-primary;
  }

  ul {
    list-style: none;
    padding: 0;
    margin-bottom: $spacing-md;

    li {
      padding: $spacing-sm 0;
      font-size: $font-sm;

      strong {
        color: $accent-secondary;
      }
    }
  }

  .example {
    font-size: $font-sm;
    color: $text-secondary;
    margin-bottom: $spacing-sm;
  }

  .example-story {
    font-size: $font-sm;
    color: $text-secondary;
    font-style: italic;
    line-height: 1.6;

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

.story-review {
  @include glass-card;
  padding: $spacing-lg;
  margin: $spacing-xl 0;

  h3 {
    font-size: $font-base;
    margin-bottom: $spacing-md;
  }

  .user-story {
    font-size: $font-sm;
    line-height: 1.6;
    color: $text-secondary;
    font-style: italic;
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

    @media (max-width: $breakpoint-sm) {
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
