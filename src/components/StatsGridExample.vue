<template>
  <div class="stats-grid-example">
    <h2>训练统计方格布局示例</h2>
    
    <div class="example-section">
      <h3>标准布局</h3>
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">39</div>
            <div class="stat-label">训练次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">13分钟</div>
            <div class="stat-label">训练时长</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">34</div>
            <div class="stat-label">平均分数</div>
          </div>
        </div>
      </div>
    </div>

    <div class="example-section">
      <h3>更多数据示例</h3>
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">156</div>
            <div class="stat-label">总训练</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">2.5小时</div>
            <div class="stat-label">本周时长</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">92%</div>
            <div class="stat-label">准确率</div>
          </div>
        </div>
      </div>
    </div>

    <div class="example-section">
      <h3>紧凑布局 (超小屏幕)</h3>
      <div class="stats-section compact">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">999+</div>
            <div class="stat-label">训练次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">10小时</div>
            <div class="stat-label">训练时长</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">100</div>
            <div class="stat-label">最高分</div>
          </div>
        </div>
      </div>
    </div>

    <div class="layout-info">
      <h3>布局特点</h3>
      <ul>
        <li>✅ 三个方格在一行显示</li>
        <li>✅ 数值在上，标签在下的垂直布局</li>
        <li>✅ 保持方形比例 (aspect-ratio: 1)</li>
        <li>✅ 响应式间距调整</li>
        <li>✅ 移动端和APK优化</li>
        <li>✅ 防止文字换行</li>
        <li>✅ 悬停和点击反馈效果</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
// 这个组件用于展示新的方格布局效果
</script>

<style lang="scss" scoped>
.stats-grid-example {
  padding: $spacing-2xl;
  max-width: 800px;
  margin: 0 auto;
  background: $bg-primary;
  color: $text-primary;
  
  h2 {
    text-align: center;
    margin-bottom: $spacing-2xl;
    color: $accent-primary;
  }
}

.example-section {
  margin-bottom: $spacing-2xl;
  padding: $spacing-xl;
  background: rgba(255, 255, 255, 0.02);
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  h3 {
    margin-bottom: $spacing-lg;
    color: $text-primary;
    font-size: $font-lg;
  }
}

// 复制Profile.vue中的样式
.stats-section {
  margin-bottom: $spacing-xl;

  .section-title {
    font-size: $font-lg;
    font-weight: $font-semibold;
    margin-bottom: $spacing-md;
    color: $text-primary;
    
    @include mobile {
      font-size: $font-base;
      margin-bottom: $spacing-sm;
    }
  }
  
  // 紧凑模式演示
  &.compact .stats-grid {
    gap: $spacing-xs;
    
    .stat-item {
      min-height: 65px;
      padding: $spacing-sm;
      
      .stat-value {
        font-size: $font-base;
        margin-bottom: 2px;
      }
      
      .stat-label {
        font-size: 11px;
      }
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;

  @include mobile {
    gap: $spacing-sm;
  }
  
  @media (max-width: 360px) {
    gap: $spacing-xs;
  }
}

.stat-item {
  @include glass-card;
  padding: $spacing-lg;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  aspect-ratio: 1;
  position: relative;
  transition: all $transition-base;
  
  @include mobile {
    padding: $spacing-md;
    min-height: 80px;
    
    @media (max-width: 360px) {
      padding: $spacing-sm;
      min-height: 70px;
    }
  }
  
  @include hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
  }
  
  @include mobile {
    &:active {
      transform: scale(0.98);
    }
  }

  .stat-value {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $accent-primary;
    margin-bottom: $spacing-xs;
    line-height: 1.2;
    
    @include mobile {
      font-size: $font-xl;
      margin-bottom: $spacing-xs;
      
      @media (max-width: 360px) {
        font-size: $font-lg;
        margin-bottom: 2px;
      }
    }
  }

  .stat-label {
    font-size: $font-sm;
    color: $text-secondary;
    font-weight: $font-medium;
    line-height: 1.2;
    white-space: nowrap;
    
    @include mobile {
      font-size: $font-xs;
      
      @media (max-width: 360px) {
        font-size: 11px;
      }
    }
  }
}

.layout-info {
  padding: $spacing-xl;
  background: rgba(0, 212, 255, 0.05);
  border-radius: $radius-lg;
  border: 1px solid rgba(0, 212, 255, 0.2);
  
  h3 {
    margin-bottom: $spacing-md;
    color: $accent-primary;
  }
  
  ul {
    list-style: none;
    padding: 0;
    
    li {
      padding: $spacing-xs 0;
      color: $text-secondary;
      
      &::before {
        content: '';
        margin-right: $spacing-sm;
      }
    }
  }
}
</style>