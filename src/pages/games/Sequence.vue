<template>
  <div class="sequence-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">序列工作记忆</h1>
    </header>

    <!-- 配置界面 -->
    <div v-if="!isTraining && !showResult" class="config-screen">
      <div class="config-card">
        <h2>选择难度</h2>

        <div class="config-group">
          <label>物品数量</label>
          <div class="button-group">
            <button
              v-for="count in [6, 9, 12, 15]"
              :key="count"
              :class="['count-button', { active: itemCount === count }]"
              @click="itemCount = count"
            >
              {{ count }}个
            </button>
          </div>
        </div>

        <div class="config-group">
          <label>显示速度</label>
          <ButtonGroupSelect v-model="displaySpeed" :options="speedOptions" />
        </div>

        <button class="start-button" @click="startTraining">开始训练</button>
      </div>
    </div>

    <!-- 训练界面 - 展示阶段 -->
    <div v-if="isTraining && phase === 'display'" class="training-screen">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${(currentIndex / sequence.length) * 100}%` }"
        ></div>
      </div>

      <div class="item-display">
        <div class="item-card" v-if="currentItem">
          <div class="item-icon">{{ currentItem.icon }}</div>
          <div class="item-name">{{ currentItem.name }}</div>
          <div class="item-category">{{ currentItem.category }}</div>
        </div>
        <p class="hint">请记住物品的品类和顺序</p>
      </div>
    </div>

    <!-- 训练界面 - 回忆阶段 -->
    <div v-if="isTraining && phase === 'recall'" class="training-screen">
      <div class="recall-info">
        <p>请按顺序选择刚才看到的物品</p>
        <p class="recall-progress">{{ userRecall.length }} / {{ sequence.length }}</p>
      </div>

      <div class="item-grid">
        <button
          v-for="item in recallOptions"
          :key="item.name"
          :class="[
            'item-button',
            {
              disabled: isSubmitted || userRecall.some(r => r.name === item.name)
            }
          ]"
          @click="selectItem(item)"
          :disabled="isSubmitted || userRecall.some(r => r.name === item.name)"
        >
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-name">{{ item.name }}</div>
        </button>
      </div>

      <div class="selected-sequence" v-if="userRecall.length > 0">
        <h3>已选择的顺序：</h3>
        <div class="selected-items">
          <span v-for="(item, idx) in userRecall" :key="idx" class="selected-item">
            {{ idx + 1 }}. {{ item.icon }} {{ item.name }}
          </span>
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
          :disabled="userRecall.length !== sequence.length || isSubmitted"
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
            <span class="stat-value">{{ correctItems }} / {{ sequence.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">顺序正确</span>
            <span class="stat-value">{{ correctOrder }} / {{ sequence.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">准确率</span>
            <span class="stat-value">{{ Math.round(accuracy * 100) }}%</span>
          </div>
        </div>

        <div class="answer-comparison">
          <h3>答案对比</h3>
          <div class="comparison-grid">
            <div class="comparison-column">
              <h4>正确答案</h4>
              <div class="answer-list">
                <div v-for="(item, idx) in sequence" :key="idx" class="answer-item">
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
                      correct: item.name === sequence[idx]?.name,
                      wrong: item.name !== sequence[idx]?.name
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

const itemPool = [
  { name: '轿车', category: '交通工具', icon: '🚗' },
  { name: '自行车', category: '交通工具', icon: '🚲' },
  { name: '飞机', category: '交通工具', icon: '✈️' },
  { name: '火车', category: '交通工具', icon: '🚂' },
  { name: '面包', category: '食品', icon: '🍞' },
  { name: '苹果', category: '食品', icon: '🍎' },
  { name: '香蕉', category: '食品', icon: '🍌' },
  { name: '蛋糕', category: '食品', icon: '🍰' },
  { name: '雨伞', category: '日用品', icon: '☂️' },
  { name: '钥匙', category: '日用品', icon: '🔑' },
  { name: '手表', category: '日用品', icon: '⌚' },
  { name: '眼镜', category: '日用品', icon: '👓' },
  { name: '铅笔', category: '文具', icon: '✏️' },
  { name: '笔记本', category: '文具', icon: '📓' },
  { name: '橡皮', category: '文具', icon: '🧹' },
  { name: '尺子', category: '文具', icon: '📏' },
  { name: '手机', category: '电子产品', icon: '📱' },
  { name: '电脑', category: '电子产品', icon: '💻' },
  { name: '相机', category: '电子产品', icon: '📷' },
  { name: '耳机', category: '电子产品', icon: '🎧' },
  { name: 'T恤', category: '服装', icon: '👕' },
  { name: '帽子', category: '服装', icon: '🎩' },
  { name: '鞋子', category: '服装', icon: '👟' },
  { name: '手套', category: '服装', icon: '🧤' }
]

const itemCount = ref(9)
const displaySpeed = ref('normal')

const speedOptions = [
  { label: '慢速', value: 'slow' },
  { label: '正常', value: 'normal' },
  { label: '快速', value: 'fast' }
]
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

function startTraining() {
  isTraining.value = true
  showResult.value = false
  phase.value = 'display'

  const { displaySequence, options } = generateSequence()
  sequence.value = displaySequence
  recallOptions.value = options

  currentIndex.value = 0
  userRecall.value = []
  isSubmitted.value = false
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
  trainingStore.endTraining()
  const score = Math.round(accuracy.value * 100)
  userStore.addTrainingRecord({
    moduleName: 'sequence',
    difficulty: `${itemCount.value}个物品`,
    score,
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

function resetTraining() {
  showResult.value = false
  isTraining.value = false
}
function goBack() {
  router.back()
}
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

  @media (max-width: $breakpoint-sm) {
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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;

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

    @media (max-width: $breakpoint-sm) {
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
  overflow-y: auto;
  @include custom-scrollbar;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-full;
  overflow: hidden;
  margin-bottom: $spacing-xl;
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
  gap: $spacing-xl;

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
    .item-category {
      font-size: $font-lg;
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
  margin-bottom: $spacing-xl;
  p {
    font-size: $font-lg;
    margin-bottom: $spacing-sm;
  }
  .recall-progress {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $accent-primary;
  }
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-xl;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: repeat(3, 1fr);
  }

  .item-button {
    @include button-reset;
    @include glass-card;
    @include click-feedback;
    padding: $spacing-md;
    text-align: center;
    transition: all $transition-base;

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
  margin-bottom: $spacing-xl;
  h3 {
    font-size: $font-base;
    margin-bottom: $spacing-md;
  }
  .selected-items {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    .selected-item {
      padding: $spacing-sm $spacing-md;
      background: rgba(0, 212, 255, 0.2);
      border-radius: $radius-md;
      font-size: $font-sm;
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
    transition: all $transition-base;
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
