<template>
  <div class="record-page">
    <header class="page-header">
      <h1 class="page-title">训练记录</h1>
    </header>

    <div class="filters">
      <ButtonGroupSelect v-model="filterModule" :options="moduleOptions" />
    </div>

    <main class="page-content">
      <div v-if="filteredHistory.length === 0" class="empty-state">
        <p>暂无训练记录</p>
        <button class="primary-button" @click="goHome">开始训练</button>
      </div>

      <div v-else class="record-list">
        <div v-for="record in filteredHistory" :key="record.id" class="record-item">
          <div class="record-header">
            <h3 class="record-title">{{ getModuleName(record.moduleName) }}</h3>
            <span class="record-score">{{ record.score }}分</span>
          </div>
          <div class="record-details">
            <span class="record-time">{{ formatDate(record.completedAt) }}</span>
            <span class="record-duration">用时: {{ formatDuration(record.duration) }}</span>
            <span class="record-accuracy">准确率: {{ (record.accuracy * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'

const router = useRouter()
const userStore = useUserStore()

const filterModule = ref('')

const moduleOptions = [
  { label: '全部', value: '' },
  { label: '舒尔特', value: 'schulte' },
  { label: 'Stroop', value: 'stroop' },
  { label: '序列', value: 'sequence' },
  { label: '听觉', value: 'audio' },
  { label: '镜像', value: 'mirror' },
  { label: '情景', value: 'memory-story' }
]

const filteredHistory = computed(() => {
  if (!filterModule.value) {
    return userStore.trainingHistory
  }
  return userStore.trainingHistory.filter(r => r.moduleName === filterModule.value)
})

const moduleNames = {
  schulte: '舒尔特方格',
  stroop: 'Stroop 训练',
  sequence: '序列记忆',
  audio: '听觉注意',
  mirror: '镜像协调',
  categorize: '规则分类',
  'memory-story': '情景记忆'
}

function getModuleName(key) {
  return moduleNames[key] || key
}

function formatDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${remainingSeconds}秒`
}
</script>

<style lang="scss" scoped>
.record-page {
  height: 100vh;
  background: $bg-primary;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  @include safe-area-padding(top);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .page-title {
    font-size: $font-xl;
    font-weight: $font-semibold;
    margin: 0;
  }
}

.filters {
  flex-shrink: 0;
  padding: $spacing-md $spacing-lg $spacing-lg;
  background: $bg-primary;
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
  color: $text-secondary;
  overflow-y: auto;
  @include custom-scrollbar;

  .primary-button {
    @include button-reset;
    padding: $spacing-md $spacing-xl;
    border-radius: $radius-md;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;
    font-weight: $font-medium;
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

.record-item {
  @include glass-card;
  padding: $spacing-lg;

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .record-title {
      font-size: $font-lg;
      font-weight: $font-medium;
      margin: 0;
    }

    .record-score {
      font-size: $font-xl;
      font-weight: $font-bold;
      color: $accent-primary;
    }
  }

  .record-details {
    display: flex;
    gap: $spacing-md;
    font-size: $font-sm;
    color: $text-secondary;
  }
}
</style>
