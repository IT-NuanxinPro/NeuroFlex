# 训练记录系统设计文档

## 概述

本文档详细说明了训练记录系统的数据结构、UI设计和扩展性设计，为后续的排行榜功能和数据库接入提供基础。

## 数据结构

### 训练记录标准格式

```javascript
{
  id: 'uuid',                    // 记录唯一ID
  userId: 'user-uuid',           // 用户ID（预留）
  moduleName: 'schulte',         // 训练模块名称
  difficulty: '5x5',             // 难度描述
  score: 95,                     // 分数 (0-100)
  duration: 12500,               // 训练时长（毫秒）
  accuracy: 0.95,                // 准确率 (0-1)
  completedAt: Date,             // 完成时间
  details: {                     // 详细数据（根据模块不同）
    // 舒尔特方格特有字段
    gridSize: 5,
    mode: 'number',              // 'number' | 'color' | 'reverse'
    averageReactionTime: 450,
    fastestReaction: 280,
    errorCount: 2,
    totalNumbers: 25,
    clickCount: 25,
    
    // 听觉注意特有字段
    snr: 20,                     // 信噪比
    backgroundType: 'white',     // 背景音类型
    digitCount: 6,               // 数字数量
    correctDigits: 5,            // 正确数字数
    correctOrder: 4,             // 顺序正确数
    
    // Stroop训练特有字段
    timeMode: 'limited',         // 时间模式
    totalQuestions: 20,          // 题目总数
    correctCount: 18,            // 正确数量
    wrongCount: 2,               // 错误数量
    timeoutCount: 0,             // 超时数量
    averageReactionTime: 650,
    fastestReaction: 420,
    slowestReaction: 980
  }
}
```

### 模块名称映射

| 模块代码 | 中文名称 | 图标 |
|---------|---------|------|
| schulte | 舒尔特方格 | 🔢 |
| stroop | Stroop训练 | 🎨 |
| sequence | 序列记忆 | 🧩 |
| audio | 听觉注意 | 🎧 |
| mirror | 镜像协调 | 🪞 |
| categorize | 规则分类 | 📊 |
| memory-story | 情景记忆 | 📖 |

## UI设计

### 训练记录页面 (Record.vue)

#### 功能特性

1. **筛选功能**
   - 按训练模块筛选
   - 支持查看全部或单个模块的记录

2. **统计卡片**
   - 训练次数统计
   - 平均分数
   - 平均准确率

3. **记录卡片**
   - 模块图标和名称
   - 完成时间（智能显示：今天/昨天/X天前/日期）
   - 分数徽章（根据分数等级显示不同颜色）
   - 难度、用时、准确率
   - 可展开查看详细信息

4. **详细信息展开**
   - 点击卡片展开/收起详细信息
   - 根据不同模块显示不同的详细字段
   - 平滑的展开/收起动画

#### 分数等级

| 分数范围 | 等级 | 颜色 | 样式 |
|---------|------|------|------|
| 90-100 | excellent | 绿色 | 成功渐变 |
| 75-89 | good | 蓝色 | 主题色渐变 |
| 60-74 | normal | 橙色 | 警告色渐变 |
| 0-59 | poor | 红色 | 错误色渐变 |

### 排行榜页面 (Leaderboard.vue)

#### 功能特性

1. **筛选器**
   - 训练模块选择
   - 时间范围选择（今日/本周/本月/全部）

2. **前三名特殊展示**
   - 大卡片展示
   - 金银铜牌图标
   - 特殊背景渐变

3. **排名列表**
   - 排名编号
   - 用户头像（首字母）
   - 用户名
   - 分数和准确率
   - 当前用户高亮显示

4. **云端同步提示**
   - 未启用时显示友好提示
   - 说明功能即将上线

## 数据库接口设计

### 接口文件 (utils/database.js)

提供以下功能接口：

1. **上传训练记录**
   ```javascript
   uploadTrainingRecord(record)
   ```

2. **批量上传记录**
   ```javascript
   batchUploadRecords(records)
   ```

3. **获取排行榜**
   ```javascript
   getLeaderboard({ moduleName, difficulty, timeRange, limit })
   ```

4. **获取用户排名**
   ```javascript
   getUserRank(userId, moduleName, difficulty)
   ```

5. **同步本地记录**
   ```javascript
   syncRecords(userId, localRecords)
   ```

6. **配置数据库**
   ```javascript
   configureDatabase({ enabled, endpoint, apiKey })
   ```

7. **检查连接状态**
   ```javascript
   checkConnection()
   ```

### 数据库配置

```javascript
const DB_CONFIG = {
  enabled: false,        // 是否启用云端同步
  endpoint: '',          // 数据库端点
  apiKey: ''            // API密钥
}
```

## 扩展性设计

### 1. 云端数据库接入

系统已预留云端数据库接口，支持以下数据库：

- **Supabase** - 推荐，开源且功能强大
- **Firebase** - Google提供，易于集成
- **自建后端** - 完全自主控制

接入步骤：

1. 在 `utils/database.js` 中实现具体的API调用
2. 配置数据库连接信息
3. 启用云端同步功能
4. 测试上传和查询功能

### 2. 排行榜功能

排行榜功能已完成UI设计，待云端数据库接入后即可启用：

- 全局排行榜
- 模块排行榜
- 难度排行榜
- 时间范围排行榜
- 好友排行榜（预留）

### 3. 数据分析

基于详细的训练记录，可以实现：

- 训练趋势分析
- 进步曲线图表
- 强弱项分析
- 个性化训练建议

### 4. 社交功能（预留）

- 好友系统
- 训练挑战
- 成就系统
- 分享功能

## 最佳实践

### 1. 保存训练记录

在游戏结束时调用：

```javascript
userStore.addTrainingRecord({
  moduleName: 'schulte',
  difficulty: `${gridSize}x${gridSize}`,
  score: calculateScore(),
  duration: totalTime,
  accuracy: accuracy / 100,
  details: {
    gridSize: gridSize,
    mode: mode,
    averageReactionTime: avgReaction,
    fastestReaction: fastReaction,
    errorCount: errors,
    // ... 其他详细信息
  }
})
```

### 2. 详细信息字段命名规范

- 使用驼峰命名法
- 字段名要清晰明确
- 数值类型要统一（时间用毫秒，准确率用0-1）
- 避免使用缩写

### 3. 性能优化

- 本地存储使用 localStorage
- 大量数据时使用分页加载
- 云端同步使用增量更新
- 缓存常用查询结果

## 后续开发计划

### Phase 1: 基础完善（当前）
- ✅ 优化训练记录UI
- ✅ 完善数据结构
- ✅ 设计数据库接口
- ✅ 创建排行榜页面

### Phase 2: 云端集成
- ⏳ 选择并配置云端数据库
- ⏳ 实现数据上传功能
- ⏳ 实现排行榜查询
- ⏳ 添加用户认证

### Phase 3: 功能增强
- ⏳ 数据可视化图表
- ⏳ 训练分析报告
- ⏳ 成就系统
- ⏳ 社交功能

### Phase 4: 优化提升
- ⏳ 性能优化
- ⏳ 离线支持
- ⏳ 数据导出
- ⏳ 多语言支持

## 技术栈

- **前端框架**: Vue 3
- **状态管理**: Pinia
- **本地存储**: localStorage
- **云端数据库**: 待定（推荐 Supabase）
- **UI组件**: 自定义组件
- **样式**: SCSS

## 注意事项

1. **数据隐私**
   - 用户数据仅在本地存储
   - 云端同步需用户授权
   - 遵守数据保护法规

2. **数据安全**
   - API密钥不要硬编码
   - 使用环境变量管理敏感信息
   - 实现数据加密传输

3. **兼容性**
   - 保持向后兼容
   - 数据迁移要平滑
   - 版本升级要优雅

4. **用户体验**
   - 加载状态要明确
   - 错误提示要友好
   - 操作反馈要及时

## 参考资料

- [Supabase 文档](https://supabase.com/docs)
- [Firebase 文档](https://firebase.google.com/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
