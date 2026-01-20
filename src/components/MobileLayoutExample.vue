<template>
  <div class="mobile-layout-example">
    <h2>移动端布局优化示例</h2>
    
    <!-- 个人中心数据管理优化 -->
    <div class="example-section">
      <h3>个人中心 - 数据管理优化</h3>
      <div class="actions-section">
        <h4 class="section-title">数据管理</h4>
        <div class="action-buttons">
          <button class="action-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出数据
          </button>
          <button class="action-button danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
            清空记录
          </button>
        </div>
      </div>
    </div>

    <!-- 首页卡片布局优化 -->
    <div class="example-section">
      <h3>首页 - 训练卡片优化</h3>
      <div class="training-grid">
        <div class="training-card">
          <div class="card-header">
            <div class="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h3 class="card-title">舒尔特方格</h3>
          </div>
          <p class="card-description">提升视觉搜索和注意力，实现一目十行</p>
          <button class="enter-button">开始训练</button>
        </div>

        <div class="training-card">
          <div class="card-header">
            <div class="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 class="card-title">Stroop 训练</h3>
          </div>
          <p class="card-description">增强认知控制和多任务处理能力</p>
          <button class="enter-button">开始训练</button>
        </div>
      </div>
    </div>

    <div class="optimization-info">
      <h3>优化要点</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>📱 个人中心优化</h4>
          <ul>
            <li>数据管理按钮移动端单列布局</li>
            <li>按钮高度和内边距压缩</li>
            <li>字体大小适配小屏幕</li>
            <li>图标尺寸自动调整</li>
          </ul>
        </div>
        
        <div class="info-card">
          <h4>🏠 首页布局优化</h4>
          <ul>
            <li>标题和图标放在一行</li>
            <li>形成两行布局更美观</li>
            <li>图标尺寸移动端适配</li>
            <li>间距和字体响应式调整</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 这个组件用于展示移动端布局优化效果
</script>

<style lang="scss" scoped>
.mobile-layout-example {
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
.actions-section {
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
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
}

.action-button {
  @include button-reset;
  @include click-feedback;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-lg;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: $text-primary;
  font-weight: $font-medium;
  transition: all $transition-base;

  @include mobile {
    padding: $spacing-md $spacing-lg;
    font-size: $font-sm;
    
    @media (max-width: 360px) {
      padding: $spacing-sm $spacing-md;
      font-size: $font-xs;
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: $accent-primary;
  }

  &.danger {
    &:hover {
      background: rgba(255, 51, 102, 0.1);
      border-color: $accent-error;
    }
  }
  
  @include mobile {
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    &:active {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(0.98);
    }
    
    &.danger:active {
      background: rgba(255, 51, 102, 0.1);
    }
  }
}

// 复制Home.vue中的样式
.training-grid {
  display: grid;
  gap: $spacing-md;
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.training-card {
  @include glass-card;
  @include click-feedback;
  padding: $spacing-xl;
  cursor: pointer;
  transition: all $transition-base;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @include mobile {
    padding: $spacing-lg;
  }

  @include hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 212, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.3);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
    margin-bottom: $spacing-md;
    
    @include mobile {
      gap: $spacing-sm;
      margin-bottom: $spacing-sm;
    }
  }

  .card-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: $radius-md;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 44, 191, 0.1));
    border: 1px solid rgba(0, 212, 255, 0.2);
    @include flex-center;

    @include mobile {
      width: 40px;
      height: 40px;
    }

    svg {
      color: $accent-primary;
      filter: drop-shadow(0 2px 4px rgba(0, 212, 255, 0.3));
      
      @include mobile {
        width: 24px;
        height: 24px;
      }
    }
  }

  .card-title {
    font-size: $font-lg;
    font-weight: $font-bold;
    color: $text-primary;
    margin: 0;
    text-align: left;
    flex: 1;
    line-height: 1.2;

    @include mobile {
      font-size: $font-base;
    }
  }

  .card-description {
    font-size: $font-sm;
    color: $text-secondary;
    margin-bottom: $spacing-lg;
    line-height: 1.6;
    text-align: left;
    flex: 1;

    @include mobile {
      font-size: $font-xs;
      margin-bottom: $spacing-md;
      line-height: 1.5;
    }
  }

  .enter-button {
    @include button-reset;
    width: 100%;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: linear-gradient(135deg, $accent-primary, $accent-secondary);
    color: $text-primary;
    font-weight: $font-semibold;
    font-size: $font-base;
    transition: all $transition-base;

    @include mobile {
      padding: $spacing-sm $spacing-md;
      font-size: $font-sm;
    }

    @include hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
    }
  }
}

.optimization-info {
  padding: $spacing-xl;
  background: rgba(0, 212, 255, 0.05);
  border-radius: $radius-lg;
  border: 1px solid rgba(0, 212, 255, 0.2);
  
  h3 {
    margin-bottom: $spacing-lg;
    color: $accent-primary;
    text-align: center;
  }
}

.info-grid {
  display: grid;
  gap: $spacing-lg;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.info-card {
  padding: $spacing-lg;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-md;
  border: 1px solid rgba(255, 255, 255, 0.08);
  
  h4 {
    margin-bottom: $spacing-md;
    color: $text-primary;
    font-size: $font-base;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      padding: $spacing-xs 0;
      color: $text-secondary;
      font-size: $font-sm;
      position: relative;
      padding-left: $spacing-md;
      
      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: $accent-primary;
      }
    }
  }
}
</style>