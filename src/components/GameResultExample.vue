<template>
  <div class="game-result-example">
    <h2>游戏结果组件示例</h2>
    
    <div class="example-buttons">
      <button @click="showNormalResult = true" class="example-btn">
        显示普通结果
      </button>
      <button @click="showCompactResult = true" class="example-btn">
        显示紧凑结果
      </button>
      <button @click="showResultWithExtra = true" class="example-btn">
        显示带扩展内容
      </button>
    </div>

    <!-- 普通模式 -->
    <GameResult
      :visible="showNormalResult"
      type="success"
      title="完成！"
      subtitle="你的表现很棒"
      :stats="[
        { label: '用时', value: '5.2s', highlight: true },
        { label: '准确率', value: '95%' },
        { label: '得分', value: '850', highlight: true },
        { label: '排名', value: 'Top 10%' }
      ]"
      :show-retry="true"
      close-text="返回首页"
      @close="showNormalResult = false"
      @retry="handleRetry"
    />

    <!-- 紧凑模式 -->
    <GameResult
      :visible="showCompactResult"
      type="success"
      title="完成！"
      subtitle="紧凑模式显示"
      :stats="[
        { label: '用时', value: '3.8s', highlight: true },
        { label: '准确率', value: '98%' },
        { label: '得分', value: '920', highlight: true },
        { label: '排名', value: 'Top 5%' }
      ]"
      :show-retry="true"
      close-text="继续"
      :compact="true"
      @close="showCompactResult = false"
      @retry="handleRetry"
    />

    <!-- 带扩展内容 -->
    <GameResult
      :visible="showResultWithExtra"
      type="success"
      title="恭喜！新纪录"
      subtitle="你创造了个人最佳成绩"
      :stats="[
        { label: '用时', value: '4.1s', highlight: true },
        { label: '准确率', value: '100%', highlight: true },
        { label: '得分', value: '1000', highlight: true },
        { label: '连击', value: '15', highlight: true }
      ]"
      :show-retry="true"
      close-text="分享成绩"
      :compact="true"
      @close="showResultWithExtra = false"
      @retry="handleRetry"
    >
      <template #extra>
        <div class="achievement-section">
          <h4>🏆 解锁成就</h4>
          <div class="achievements">
            <div class="achievement-item">
              <span class="achievement-icon">🎯</span>
              <span class="achievement-name">完美射手</span>
            </div>
            <div class="achievement-item">
              <span class="achievement-icon">⚡</span>
              <span class="achievement-name">闪电反应</span>
            </div>
          </div>
          
          <div class="next-challenge">
            <p>下一个挑战：连续完成10局游戏</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 60%"></div>
            </div>
            <span class="progress-text">6/10</span>
          </div>
        </div>
      </template>
    </GameResult>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import GameResult from './GameResult.vue'

const showNormalResult = ref(false)
const showCompactResult = ref(false)
const showResultWithExtra = ref(false)

function handleRetry() {
  console.log('重试游戏')
}
</script>

<style lang="scss" scoped>
.game-result-example {
  padding: $spacing-2xl;
  max-width: 800px;
  margin: 0 auto;
  
  h2 {
    text-align: center;
    margin-bottom: $spacing-2xl;
    color: $text-primary;
  }
}

.example-buttons {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  margin-bottom: $spacing-2xl;
  flex-wrap: wrap;
  
  @include mobile {
    flex-direction: column;
    align-items: center;
  }
}

.example-btn {
  @include button-reset;
  padding: $spacing-md $spacing-lg;
  background: linear-gradient(135deg, $accent-primary, $accent-secondary);
  color: $text-primary;
  border-radius: $radius-md;
  font-weight: $font-medium;
  transition: all $transition-base;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
  }
  
  @include mobile {
    width: 200px;
    
    &:hover {
      transform: none;
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
}

// 扩展内容样式
.achievement-section {
  text-align: center;
  
  h4 {
    margin: 0 0 $spacing-md;
    color: $accent-primary;
    font-size: $font-lg;
  }
}

.achievements {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  margin-bottom: $spacing-lg;
  flex-wrap: wrap;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: rgba(0, 212, 255, 0.1);
  border-radius: $radius-md;
  border: 1px solid rgba(0, 212, 255, 0.3);
  
  .achievement-icon {
    font-size: $font-lg;
  }
  
  .achievement-name {
    font-size: $font-sm;
    color: $text-primary;
    font-weight: $font-medium;
  }
}

.next-challenge {
  p {
    margin: 0 0 $spacing-sm;
    color: $text-secondary;
    font-size: $font-sm;
  }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-sm;
  overflow: hidden;
  margin-bottom: $spacing-xs;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $accent-primary, $accent-secondary);
    border-radius: $radius-sm;
    transition: width 0.3s ease;
  }
}

.progress-text {
  font-size: $font-xs;
  color: $text-secondary;
}
</style>