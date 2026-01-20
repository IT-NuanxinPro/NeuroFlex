# Composables 使用指南

## 📦 可用的 Hooks

### 1. `useReactionTime()` - 反应时间追踪

**用途：** 记录用户点击时间戳并计算反应时间统计

**返回值：**
```javascript
{
  // 状态（只读）
  timestamps: Ref<number[]>,        // 所有点击的时间戳数组
  clickCount: ComputedRef<number>,  // 点击次数
  averageReactionTime: ComputedRef<number>, // 平均反应时间（ms）
  intervals: ComputedRef<number[]>, // 所有相邻点击的时间间隔
  fastestReaction: ComputedRef<number>,     // 最快反应时间（ms）
  slowestReaction: ComputedRef<number>,     // 最慢反应时间（ms）
  
  // 方法
  recordClick: () => void,          // 记录一次点击
  reset: () => void                 // 重置所有数据
}
```

**使用示例：**
```javascript
import { useReactionTime } from '@/composables/useReactionTime'

const reaction = useReactionTime()

// 记录点击
reaction.recordClick()

// 查看统计
console.log(reaction.averageReactionTime.value) // 612
console.log(reaction.fastestReaction.value)     // 450
console.log(reaction.clickCount.value)          // 9

// 重置
reaction.reset()
```

---

### 2. `useSchulteGame(gridSize)` - 舒尔特方格游戏逻辑

**用途：** 完整的舒尔特方格游戏逻辑，组合反应时间追踪

**参数：**
- `gridSize: Ref<number>` - 方格尺寸的响应式引用（如 `ref(5)` 表示 5×5）

**返回值：**
```javascript
{
  // 游戏状态
  currentTarget: Ref<number>,       // 当前应点击的数字
  errorCount: Ref<number>,          // 错误点击次数
  correctCount: ComputedRef<number>, // 正确点击次数
  isCompleted: ComputedRef<boolean>, // 是否完成
  totalNumbers: ComputedRef<number>, // 总数字数量
  
  // 性能指标
  totalTime: ComputedRef<number|null>,        // 总耗时（ms）
  accuracy: ComputedRef<number>,              // 准确率（%）
  averageReactionTime: ComputedRef<number>,   // 平均反应时间（ms）
  fastestReaction: ComputedRef<number>,       // 最快反应（ms）
  slowestReaction: ComputedRef<number>,       // 最慢反应（ms）
  intervals: ComputedRef<number[]>,           // 时间间隔数组
  timestamps: Ref<number[]>,                  // 时间戳数组
  
  // 完整统计
  gameStats: ComputedRef<Object>,   // 所有统计数据的对象
  
  // 方法
  startGame: () => void,            // 开始游戏
  handleNumberClick: (number: number) => boolean, // 处理点击，返回是否正确
  resetGame: () => void             // 重置游戏
}
```

**使用示例：**
```javascript
import { ref } from 'vue'
import { useSchulteGame } from '@/composables/useSchulteGame'

const gridSize = ref(5) // 5×5 方格
const game = useSchulteGame(gridSize)

// 开始游戏
game.startGame()

// 处理点击
function handleClick(number) {
  const isCorrect = game.handleNumberClick(number)
  
  if (isCorrect) {
    console.log('正确！当前目标:', game.currentTarget.value)
    
    if (game.isCompleted.value) {
      console.log('完成！统计数据:', game.gameStats.value)
    }
  } else {
    console.log('错误！错误次数:', game.errorCount.value)
  }
}

// 查看实时数据
console.log('当前目标:', game.currentTarget.value)
console.log('正确次数:', game.correctCount.value)
console.log('错误次数:', game.errorCount.value)
console.log('准确率:', game.accuracy.value, '%')

// 重置游戏
game.resetGame()
```

---

## 🎯 核心设计原则

### 1. 反应时间计算
```
平均反应时间 = Σ(相邻正确点击间隔) / (正确点击数 - 1)
```
- ✅ 基于相邻点击的实际间隔
- ✅ 只统计正确点击
- ❌ 不使用 `startTime` 或人为补偿

### 2. 总耗时计算
```
总耗时 = 最后一次点击时间 - 游戏开始时间
```
- ✅ 包含所有时间（包括错误点击）
- ✅ 反映真实游戏时长

### 3. 准确率计算
```
准确率 = 正确点击数 / (正确点击数 + 错误点击数) × 100%
```

---

## 📊 数据验证示例

**场景：** 3×3 方格，用时 5.5 秒，1 次错误

**点击序列：**
```
时间戳: [1000, 1600, 2300, 3000, 3700, 4400, 5100, 5800, 6500]
间隔:   [     600,  700,  700,  700,  700,  700,  700,  700]
```

**计算结果：**
```javascript
{
  totalTime: 5500,              // 6500 - 1000 = 5500ms ✓
  correctCount: 9,              // 9 次正确点击 ✓
  errorCount: 1,                // 1 次错误点击 ✓
  accuracy: 90,                 // 9 / (9+1) = 90% ✓
  averageReactionTime: 612,     // (600 + 700×7) / 8 = 612ms ✓
  fastestReaction: 600,         // min(600, 700, ...) = 600ms ✓
  slowestReaction: 700,         // max(600, 700, ...) = 700ms ✓
}
```

---

## 🔄 Hook 组合关系

```
useSchulteGame(gridSize)
  │
  ├─ 内部组合 useReactionTime()
  │   ├─ 管理时间戳
  │   ├─ 计算反应时间
  │   └─ 提供统计数据
  │
  ├─ 扩展游戏逻辑
  │   ├─ 当前目标数字
  │   ├─ 错误统计
  │   └─ 完成状态
  │
  └─ 提供完整接口
      ├─ 游戏控制方法
      ├─ 实时状态
      └─ 性能指标
```

---

## 🚀 最佳实践

### 1. 在组件中使用
```javascript
// ✅ 推荐：使用高层 Hook
const game = useSchulteGame(gridSize)

// ❌ 不推荐：直接使用底层 Hook（除非有特殊需求）
const reaction = useReactionTime()
```

### 2. 数据保存
```javascript
// 使用 gameStats 获取完整数据
function saveRecord() {
  const stats = game.gameStats.value
  
  userStore.addTrainingRecord({
    moduleName: 'schulte',
    difficulty: `${gridSize.value}x${gridSize.value}`,
    score: calculateScore(stats),
    duration: stats.totalTime,
    accuracy: stats.accuracy,
    details: stats // 保存完整统计
  })
}
```

### 3. 结果展示
```javascript
// 直接使用 Hook 的计算属性
const resultStats = computed(() => [
  { label: '用时', value: `${(game.totalTime.value / 1000).toFixed(1)}s` },
  { label: '平均反应', value: `${game.averageReactionTime.value}ms` },
  { label: '准确率', value: `${game.accuracy.value}%` },
  { label: '错误次数', value: `${game.errorCount.value}` }
])
```

---

## 📝 注意事项

1. **gridSize 必须是 ref**
   ```javascript
   // ✅ 正确
   const gridSize = ref(5)
   const game = useSchulteGame(gridSize)
   
   // ❌ 错误
   const game = useSchulteGame(5)
   ```

2. **timestamps 是只读的**
   ```javascript
   // ✅ 正确：读取数据
   console.log(game.timestamps.value)
   
   // ❌ 错误：直接修改
   game.timestamps.value.push(Date.now())
   
   // ✅ 正确：使用方法
   game.handleNumberClick(1)
   ```

3. **totalTime 在未完成时为 null**
   ```javascript
   // ✅ 正确：检查 null
   if (game.totalTime.value !== null) {
     console.log('耗时:', game.totalTime.value)
   }
   ```

---

## 🧪 测试建议

```javascript
// 单元测试示例
import { ref } from 'vue'
import { useSchulteGame } from '@/composables/useSchulteGame'

test('正确计算平均反应时间', () => {
  const gridSize = ref(3)
  const game = useSchulteGame(gridSize)
  
  game.startGame()
  
  // 模拟点击
  game.handleNumberClick(1)
  game.handleNumberClick(2)
  game.handleNumberClick(3)
  
  expect(game.correctCount.value).toBe(3)
  expect(game.averageReactionTime.value).toBeGreaterThan(0)
})
```

---

## 📚 更多示例

查看 `useSchulteGame.example.js` 获取更多详细的使用示例和集成方案。
