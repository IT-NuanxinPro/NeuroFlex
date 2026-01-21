<template>
  <div class="record-page">
    <!-- 标题栏 -->
    <header v-if="!isPCDevice" class="page-header">
      <h1 class="page-title">训练记录</h1>
      <button class="sort-button" @click="toggleSort">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 6h18M7 12h10M11 18h2" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span class="sort-label">{{ sortLabel }}</span>
      </button>
    </header>

    <!-- 筛选和统计 -->
    <div class="filters-section">
      <div class="filters">
        <ButtonGroupSelect v-model="filterModule" :options="moduleOptions" />
      </div>
      
      <!-- 统计卡片 -->
      <div v-if="filteredHistory.length > 0" class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ filteredHistory.length }}</div>
            <div class="stat-label">训练次数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-value">{{ averageScore }}</div>
            <div class="stat-label">平均分数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-value">{{ averageAccuracy }}%</div>
            <div class="stat-label">平均准确率</div>
          </div>
        </div>
      </div>
    </div>

    <main class="page-content">
      <div v-if="filteredHistory.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">暂无训练记录</p>
        <p class="empty-hint">开始你的第一次训练吧！</p>
        <button class="primary-button" @click="goHome">开始训练</button>
      </div>

      <div v-else class="record-list">
        <div 
          v-for="record in sortedHistory" 
          :key="record.id" 
          class="record-card"
          @click="toggleRecordDetail(record.id)"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="header-left">
              <div class="module-icon">{{ getModuleIcon(record.moduleName) }}</div>
              <div class="header-info">
                <h3 class="module-name">{{ getModuleName(record.moduleName) }}</h3>
                <p class="record-time">{{ formatDate(record.completedAt) }}</p>
              </div>
            </div>
            <div class="score-badge" :class="getScoreLevel(record.score)">
              {{ record.score }}
            </div>
          </div>

          <!-- 主要信息 -->
          <div class="card-main">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">难度</span>
                <span class="info-value">{{ record.difficulty }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">用时</span>
                <span class="info-value">{{ formatDuration(record.duration) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">准确率</span>
                <span class="info-value accuracy">{{ (record.accuracy * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>

          <!-- 详细信息（可展开） -->
          <transition name="expand">
            <div v-if="expandedRecords.has(record.id)" class="card-details">
              <div class="details-divider"></div>
              
              <!-- 根据不同模块显示不同的详细信息 -->
              <div v-if="record.moduleName === 'schulte'" class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">方格尺寸</span>
                  <span class="detail-value">{{ record.details?.gridSize }}×{{ record.details?.gridSize }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">训练模式</span>
                  <span class="detail-value">{{ getModeLabel(record.details?.mode) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">平均反应</span>
                  <span class="detail-value">{{ record.details?.averageReactionTime }}ms</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">最快反应</span>
                  <span class="detail-value">{{ record.details?.fastestReaction }}ms</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">错误次数</span>
                  <span class="detail-value error">{{ record.details?.errorCount || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">完成度</span>
                  <span class="detail-value">{{ record.details?.correctCount || 0 }}/{{ record.details?.totalNumbers || 0 }}</span>
                </div>
              </div>

              <div v-else-if="record.moduleName === 'audio'" class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">信噪比</span>
                  <span class="detail-value">SNR {{ record.details?.snr }}%</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">背景音</span>
                  <span class="detail-value">{{ getBackgroundLabel(record.details?.backgroundType) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">数字数量</span>
                  <span class="detail-value">{{ record.details?.digitCount }}个</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">正确数字</span>
                  <span class="detail-value">{{ record.details?.correctDigits }}/{{ record.details?.digitCount }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">顺序正确</span>
                  <span class="detail-value">{{ record.details?.correctOrder }}/{{ record.details?.digitCount }}</span>
                </div>
              </div>

              <div v-else-if="record.moduleName === 'stroop'" class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">题目数量</span>
                  <span class="detail-value">{{ record.details?.totalQuestions }}题</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">正确数</span>
                  <span class="detail-value">{{ record.details?.correctCount }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">平均反应</span>
                  <span class="detail-value">{{ record.details?.averageReactionTime }}ms</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">最快反应</span>
                  <span class="detail-value">{{ record.details?.fastestReaction }}ms</span>
                </div>
              </div>

              <div v-else class="detail-grid">
                <div v-for="(value, key) in record.details" :key="key" class="detail-item">
                  <span class="detail-label">{{ formatDetailKey(key) }}</span>
                  <span class="detail-value">{{ formatDetailValue(value) }}</span>
                </div>
              </div>
            </div>
          </transition>

          <!-- 展开指示器 -->
          <div class="expand-indicator">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              :class="{ expanded: expandedRecords.has(record.id) }"
            >
              <path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'
import { isPC } from '@/utils/device'

const router = useRouter()
const userStore = useUserStore()

const filterModule = ref('')
const isPCDevice = ref(isPC())
const sortBy = ref('time') // 'time' | 'score' | 'accuracy'
const expandedRecords = ref(new Set())

// 排序标签映射
const sortLabels = {
  time: '时间',
  score: '分数',
  accuracy: '准确率'
}

const sortLabel = computed(() => sortLabels[sortBy.value])

function handleResize() {
  isPCDevice.value = isPC()
}

const moduleOptions = [
  { label: '全部', value: '' },
  { label: '舒尔特', value: 'schulte' },
  { label: 'Stroop', value: 'stroop' },
  { label: '序列', value: 'sequence' },
  { label: '听觉', value: 'audio' },
  { label: '镜像', value: 'mirror' },
  { label: '分类', value: 'categorize' },
  { label: '情景', value: 'memory-story' }
]

const moduleNames = {
  schulte: '舒尔特方格',
  stroop: 'Stroop 训练',
  sequence: '序列记忆',
  audio: '听觉注意',
  mirror: '镜像协调',
  categorize: '规则分类',
  'memory-story': '情景记忆'
}

const moduleIcons = {
  schulte: '🔢',
  stroop: '🎨',
  sequence: '🧩',
  audio: '🎧',
  mirror: '🪞',
  categorize: '📊',
  'memory-story': '📖'
}

// 筛选后的记录
const filteredHistory = computed(() => {
  if (!filterModule.value) {
    return userStore.trainingHistory
  }
  return userStore.trainingHistory.filter(r => r.moduleName === filterModule.value)
})

// 排序后的记录
const sortedHistory = computed(() => {
  const records = [...filteredHistory.value]
  
  switch (sortBy.value) {
    case 'score':
      return records.sort((a, b) => b.score - a.score)
    case 'accuracy':
      return records.sort((a, b) => b.accuracy - a.accuracy)
    case 'time':
    default:
      return records.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  }
})

// 统计数据
const averageScore = computed(() => {
  if (filteredHistory.value.length === 0) return 0
  const total = filteredHistory.value.reduce((sum, r) => sum + r.score, 0)
  return Math.round(total / filteredHistory.value.length)
})

const averageAccuracy = computed(() => {
  if (filteredHistory.value.length === 0) return 0
  const total = filteredHistory.value.reduce((sum, r) => sum + r.accuracy, 0)
  return Math.round((total / filteredHistory.value.length) * 100)
})

// 工具函数
function getModuleName(key) {
  return moduleNames[key] || key
}

function getModuleIcon(key) {
  return moduleIcons[key] || '🎯'
}

function getScoreLevel(score) {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'normal'
  return 'poor'
}

function getModeLabel(mode) {
  const modes = {
    number: '数字模式',
    color: '多色模式',
    reverse: '降序模式'
  }
  return modes[mode] || mode
}

function getBackgroundLabel(type) {
  const types = {
    white: '白噪音',
    pink: '粉噪音',
    brown: '棕噪音'
  }
  return types[type] || type
}

function formatDate(date) {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  // 今天
  if (days === 0) {
    return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  // 昨天
  if (days === 1) {
    return `昨天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  // 一周内
  if (days < 7) {
    return `${days}天前`
  }
  // 更早
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  if (seconds > 0) {
    return `${seconds}秒`
  }
  return `${ms}ms`
}

function formatDetailKey(key) {
  const keyMap = {
    gridSize: '方格尺寸',
    mode: '训练模式',
    averageReactionTime: '平均反应',
    fastestReaction: '最快反应',
    errorCount: '错误次数',
    totalNumbers: '总数字数',
    clickCount: '点击次数',
    snr: '信噪比',
    backgroundType: '背景音',
    digitCount: '数字数量',
    correctDigits: '正确数字',
    correctOrder: '顺序正确',
    totalQuestions: '题目数量',
    correctCount: '正确数量'
  }
  return keyMap[key] || key
}

function formatDetailValue(value) {
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  if (typeof value === 'number') {
    return value
  }
  return value
}

function toggleSort() {
  const sortOptions = ['time', 'score', 'accuracy']
  const currentIndex = sortOptions.indexOf(sortBy.value)
  sortBy.value = sortOptions[(currentIndex + 1) % sortOptions.length]
}

function toggleRecordDetail(id) {
  if (expandedRecords.value.has(id)) {
    expandedRecords.value.delete(id)
  } else {
    expandedRecords.value.add(id)
  }
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  isPCDevice.value = isPC()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.record-page {
  height: 100%;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;

  .page-title {
    font-size: $font-xl;
    font-weight: $font-semibold;
    margin: 0;
  }

  .sort-button {
    @include button-reset;
    @include click-feedback;
    position: absolute;
    right: $spacing-lg;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-md;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: $accent-primary;
    transition: all $transition-base;

    svg {
      flex-shrink: 0;
    }

    .sort-label {
      font-size: $font-sm;
      font-weight: $font-medium;
      white-space: nowrap;
    }

    &:hover {
      background: rgba(0, 212, 255, 0.2);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.filters-section {
  flex-shrink: 0;
  padding: $spacing-lg;
  background: $bg-primary;

  .filters {
    margin-bottom: $spacing-lg;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;

  @include mobile {
    gap: $spacing-sm;
  }

  .stat-card {
    @include glass-card;
    padding: $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-md;
    transition: all $transition-base;

    @include mobile {
      padding: $spacing-sm;
      gap: $spacing-sm;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
    }

    .stat-icon {
      font-size: $font-2xl;
      flex-shrink: 0;

      @include mobile {
        font-size: $font-xl;
      }
    }

    .stat-content {
      flex: 1;
      min-width: 0;

      .stat-value {
        font-size: $font-xl;
        font-weight: $font-bold;
        color: $accent-primary;
        line-height: 1.2;

        @include mobile {
          font-size: $font-lg;
        }
      }

      .stat-label {
        font-size: $font-xs;
        color: $text-secondary;
        margin-top: 2px;

        @include mobile {
          font-size: 10px;
        }
      }
    }
  }
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.empty-state {
  flex: 1;
  @include flex-center;
  flex-direction: column;
  gap: $spacing-lg;
  padding: $spacing-2xl;
  padding-bottom: calc($spacing-2xl + 70px + env(safe-area-inset-bottom));
  text-align: center;
  overflow-y: auto;
  @include custom-scrollbar;

  .empty-icon {
    font-size: 64px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: $font-xl;
    font-weight: $font-medium;
    color: $text-primary;
    margin: 0;
  }

  .empty-hint {
    font-size: $font-sm;
    color: $text-secondary;
    margin: 0;
  }

  .primary-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-md $spacing-xl;
    border-radius: $radius-md;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;
    font-weight: $font-medium;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
    transition: all $transition-base;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 212, 255, 0.4);
    }
  }
}

.record-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 $spacing-lg calc($spacing-lg + 70px + env(safe-area-inset-bottom));
  @include custom-scrollbar;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  min-height: 0;
}

.record-card {
  @include glass-card;
  padding: $spacing-lg;
  cursor: pointer;
  transition: all $transition-base;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    .header-left {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      flex: 1;
      min-width: 0;

      .module-icon {
        font-size: $font-2xl;
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        border-radius: $radius-md;
        background: rgba(0, 212, 255, 0.1);
        @include flex-center;

        @include mobile {
          width: 40px;
          height: 40px;
          font-size: $font-xl;
        }
      }

      .header-info {
        flex: 1;
        min-width: 0;

        .module-name {
          font-size: $font-lg;
          font-weight: $font-semibold;
          margin: 0 0 4px;
          color: $text-primary;

          @include mobile {
            font-size: $font-base;
          }
        }

        .record-time {
          font-size: $font-sm;
          color: $text-secondary;
          margin: 0;

          @include mobile {
            font-size: $font-xs;
          }
        }
      }
    }

    .score-badge {
      font-size: $font-2xl;
      font-weight: $font-bold;
      padding: $spacing-sm $spacing-md;
      border-radius: $radius-md;
      flex-shrink: 0;

      @include mobile {
        font-size: $font-xl;
        padding: $spacing-xs $spacing-sm;
      }

      &.excellent {
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
        color: $accent-success;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
      }

      &.good {
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.1));
        color: $accent-primary;
        box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
      }

      &.normal {
        background: linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(255, 170, 0, 0.1));
        color: $accent-warning;
        box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
      }

      &.poor {
        background: linear-gradient(135deg, rgba(255, 51, 102, 0.2), rgba(255, 51, 102, 0.1));
        color: $accent-error;
        box-shadow: 0 0 20px rgba(255, 51, 102, 0.3);
      }
    }
  }

  .card-main {
    .info-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-md;

      @include mobile {
        gap: $spacing-sm;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: $spacing-sm;
        border-radius: $radius-sm;
        background: rgba(255, 255, 255, 0.03);

        .info-label {
          font-size: $font-xs;
          color: $text-secondary;

          @include mobile {
            font-size: 10px;
          }
        }

        .info-value {
          font-size: $font-base;
          font-weight: $font-semibold;
          color: $text-primary;

          @include mobile {
            font-size: $font-sm;
          }

          &.accuracy {
            color: $accent-primary;
          }
        }
      }
    }
  }

  .card-details {
    margin-top: $spacing-md;

    .details-divider {
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1) 50%,
        transparent
      );
      margin-bottom: $spacing-md;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-sm;

      @include mobile {
        grid-template-columns: 1fr;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-sm $spacing-md;
        border-radius: $radius-sm;
        background: rgba(255, 255, 255, 0.02);

        .detail-label {
          font-size: $font-sm;
          color: $text-secondary;

          @include mobile {
            font-size: $font-xs;
          }
        }

        .detail-value {
          font-size: $font-sm;
          font-weight: $font-medium;
          color: $accent-primary;

          @include mobile {
            font-size: $font-xs;
          }

          &.error {
            color: $accent-error;
          }
        }
      }
    }
  }

  .expand-indicator {
    position: absolute;
    bottom: $spacing-sm;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 20px;
    @include flex-center;
    color: $text-secondary;
    transition: all $transition-base;

    svg {
      transition: transform $transition-base;

      &.expanded {
        transform: rotate(180deg);
      }
    }
  }
}

// 展开动画
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
