<template>
  <div class="mirror-page">
    <!-- 顶部导航 -->
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">双侧神经协调</h1>
      <button v-if="isDrawing" class="clear-button" @click="clearCanvas">重置</button>
    </header>

    <!-- PC端禁用提示 -->
    <Modal 
      :visible="showPCWarning" 
      :show-close="false" 
      :show-footer="false" 
      :close-on-click-overlay="false"
    >
      <div class="pc-warning-content">
        <div class="warning-icon">📱</div>
        <h2>请使用移动设备</h2>
        <p class="warning-text">本训练依赖多点触控（Multitouch）技术<br>PC端无法实现双侧独立控制</p>
        <button class="primary-button" @click="goBack">返回首页</button>
      </div>
    </Modal>

    <!-- 1. 配置界面 -->
    <div v-if="!isDrawing && !showResult && !isPC" class="config-screen">
      <div class="config-card">
        <div class="section-title">训练模式 (Coordination Mode)</div>
        <div class="mode-list">
          <button
            v-for="mode in trainingModes"
            :key="mode.value"
            :class="['mode-item', { active: selectedMode === mode.value }]"
            @click="selectedMode = mode.value"
          >
            <div class="mode-icon">{{ mode.icon }}</div>
            <div class="mode-info">
              <div class="mode-header">
                <span class="name">{{ mode.name }}</span>
                <div class="stars">
                  <span v-for="n in 3" :key="n" :class="{ filled: n <= mode.difficulty }">★</span>
                </div>
              </div>
              <div class="desc">{{ mode.desc }}</div>
            </div>
          </button>
        </div>

        <div class="section-title mt-6">任务类型 (Task Type)</div>
        <div class="task-tabs">
          <button 
            v-for="task in taskTypes"
            :key="task.value"
            :class="['task-tab', { active: selectedTask === task.value }]"
            @click="selectedTask = task.value"
          >
            {{ task.label }}
          </button>
        </div>

        <div class="hint-box">
          <p v-if="selectedTask === 'trace'">🎯 目标：双手沿着虚线轨迹精准描摹</p>
          <p v-else>🎨 目标：双手在空白画板自由创作，保持运动不停</p>
        </div>

        <button class="start-button" @click="startDrawing">开始神经激活</button>
      </div>
    </div>

    <!-- 2. 绘图训练界面 -->
    <div v-if="isDrawing && !isPC" class="drawing-screen">
      <div class="instruction-banner">
        <span class="icon">🧠</span>
        <span>{{ currentInstruction }}</span>
      </div>

      <!-- 画布容器：核心交互区域 -->
      <div 
        class="canvas-container" 
        ref="canvasContainer"
        @touchstart.prevent="handleGlobalTouch('start', $event)"
        @touchmove.prevent="handleGlobalTouch('move', $event)"
        @touchend.prevent="handleGlobalTouch('end', $event)"
        @touchcancel.prevent="handleGlobalTouch('end', $event)"
      >
        <!-- 左画板 -->
        <div class="canvas-panel left-panel">
          <div class="panel-tag">Left</div>
          <canvas ref="leftCanvas"></canvas>
        </div>

        <!-- 中轴线 -->
        <div class="divider">
          <div class="line"></div>
          <div class="divider-icon">⚡</div>
          <div class="line"></div>
        </div>

        <!-- 右画板 -->
        <div class="canvas-panel right-panel">
          <div class="panel-tag">Right</div>
          <canvas ref="rightCanvas"></canvas>
        </div>
      </div>

      <div class="drawing-controls">
        <div class="timer">{{ formatTime(drawingDuration) }}</div>
        <button class="finish-button" @click="finishDrawing">完成训练</button>
      </div>
    </div>

    <!-- 3. 结果结算界面 -->
    <GameResult
      :visible="showResult"
      :type="resultType"
      :title="resultTitle"
      :subtitle="resultSubtitle"
      :stats="resultStats"
      :show-retry="true"
      close-text="返回菜单"
      @retry="handleRetry"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import GameResult from '@/components/GameResult.vue'
import Modal from '@/components/Modal.vue'
import {trainingModes,taskTypes} from '@/config/mirror.js'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

const isPC = ref(false)
const showPCWarning = ref(false)
const selectedMode = ref('mirror')
const selectedTask = ref('trace')

const isDrawing = ref(false)
const showResult = ref(false)
const drawingDuration = ref(0)
const strokeCountLeft = ref(0)
const strokeCountRight = ref(0) // 分别记录以计算同步率

const leftCanvas = ref(null)
const rightCanvas = ref(null)
const leftCanvasImage = ref(null)
const rightCanvasImage = ref(null)

let leftCtx = null
let rightCtx = null
let timerInterval = null
let startTime = 0
let leftPaths = []
let rightPaths = []

// --- 计算属性 ---
const currentInstruction = computed(() => {
  const map = {
    mirror: '双手对称动作，保持速度一致',
    parallel: '双手向同一方向移动',
    dissociation: '左手画圆，右手画方，互不干扰'
  }
  return map[selectedMode.value]
})

const resultType = computed(() => 'success')
const resultTitle = computed(() => '神经激活完成')
const resultSubtitle = computed(() => {
  if (syncScore.value > 90) return '太棒了！你的左右脑配合完美无缺'
  if (syncScore.value > 70) return '表现不错，继续加强弱侧训练'
  return '协调性有待提高，请放慢速度再试一次'
})

// 计算同步率 (简单的算法：基于左右手笔画数量和时间的差异)
const syncScore = computed(() => {
  const total = strokeCountLeft.value + strokeCountRight.value
  if (total === 0) return 0
  const diff = Math.abs(strokeCountLeft.value - strokeCountRight.value)
  // 基础分100，每差一个采样点扣分，最低0分
  return Math.max(0, Math.round(100 - (diff / total) * 100))
})

const resultStats = computed(() => [
  { label: '双侧同步率', value: `${syncScore.value}%`, highlight: true },
  { label: '训练时长', value: formatTime(drawingDuration.value), highlight: false },
  { label: '训练模式', value: trainingModes.find(m => m.value === selectedMode.value)?.name, highlight: false }
])

// --- 核心逻辑 ---

function detectPC() {
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())
  const isTablet = /ipad|android(?!.*mobile)/i.test(navigator.userAgent.toLowerCase())
  isPC.value = !isMobile && !isTablet && window.innerWidth > 1024
  return isPC.value
}

function startDrawing() {
  isDrawing.value = true
  showResult.value = false
  strokeCountLeft.value = 0
  strokeCountRight.value = 0
  drawingDuration.value = 0
  leftPaths = []
  rightPaths = []
  
  trainingStore.startTraining('mirror')
  
  nextTick(() => {
    initCanvas()
    startTime = Date.now()
    timerInterval = setInterval(() => {
      drawingDuration.value = Date.now() - startTime
    }, 1000)
  })
}

function initCanvas() {
  if (!leftCanvas.value || !rightCanvas.value) return

  // 获取容器实际像素大小
  const width = leftCanvas.value.parentElement.offsetWidth
  const height = leftCanvas.value.parentElement.offsetHeight

  // 设置物理像素
  ;[leftCanvas.value, rightCanvas.value].forEach(c => {
    c.width = width
    c.height = height
  })

  leftCtx = leftCanvas.value.getContext('2d', { willReadFrequently: false })
  rightCtx = rightCanvas.value.getContext('2d', { willReadFrequently: false })
  
  // 设置画笔样式
  ;[leftCtx, rightCtx].forEach(ctx => {
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  })

  // 如果是描摹模式，绘制背景虚线
  if (selectedTask.value === 'trace') {
    drawTemplates(width, height)
  }
}

// 智能模版绘制系统
function drawTemplates(w, h) {
  const pad = 40
  const midX = w / 2
  const midY = h / 2
  const size = Math.min(w, h) / 2 - pad

  // 辅助函数：绘制虚线
  const drawGuide = (ctx, drawFn) => {
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.setLineDash([8, 8])
    ctx.lineWidth = 3
    ctx.beginPath()
    drawFn(ctx)
    ctx.stroke()
    ctx.restore()
  }

  // 1. 左侧画板永远是基准 (例如画三角形)
  drawGuide(leftCtx, (ctx) => {
    if (selectedMode.value === 'dissociation') {
      // 分离模式：左圆
      ctx.arc(midX, midY, size, 0, Math.PI * 2)
    } else {
      // 其他模式：左三角
      ctx.moveTo(midX, midY - size)
      ctx.lineTo(midX - size, midY + size)
      ctx.lineTo(midX + size, midY + size)
      ctx.closePath()
    }
  })

  // 2. 右侧画板根据模式变化
  drawGuide(rightCtx, (ctx) => {
    if (selectedMode.value === 'mirror') {
      // 镜像模式：左右对称 (三角形翻转或保持对称中心)
      // 对于等腰三角形，镜像后看起来一样，为了明显，我们画直角三角形或者波浪更好
      // 这里演示简单的镜像逻辑：
      ctx.moveTo(midX, midY - size)
      ctx.lineTo(midX - size, midY + size) // 注意：这里视觉上其实是一样的
      ctx.lineTo(midX + size, midY + size)
      ctx.closePath()
    } else if (selectedMode.value === 'parallel') {
      // 平行模式：完全复制左侧 (同向)
      ctx.moveTo(midX, midY - size)
      ctx.lineTo(midX - size, midY + size)
      ctx.lineTo(midX + size, midY + size)
      ctx.closePath()
    } else if (selectedMode.value === 'dissociation') {
      // 分离模式：右方 (与左圆不同)
      ctx.rect(midX - size, midY - size, size * 2, size * 2)
    }
  })
}

// 全局触摸事件分发 (核心修复逻辑)
function handleGlobalTouch(type, event) {
  if (!leftCanvas.value || !rightCanvas.value) return

  const leftRect = leftCanvas.value.getBoundingClientRect()
  const rightRect = rightCanvas.value.getBoundingClientRect()
  const touches = event.changedTouches
  
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i]
    const cx = touch.clientX
    const cy = touch.clientY
    
    let target = null
    let rect = null
    
    // 判定触点属于哪个区域
    if (cx >= leftRect.left && cx <= leftRect.right && cy >= leftRect.top && cy <= leftRect.bottom) {
      target = 'left'
      rect = leftRect
    } else if (cx >= rightRect.left && cx <= rightRect.right && cy >= rightRect.top && cy <= rightRect.bottom) {
      target = 'right'
      rect = rightRect
    }

    if (!target) continue

    const x = cx - rect.left
    const y = cy - rect.top
    const ctx = target === 'left' ? leftCtx : rightCtx
    const pathArray = target === 'left' ? leftPaths : rightPaths

    if (type === 'start') {
      target === 'left' ? strokeCountLeft.value++ : strokeCountRight.value++
      ctx.beginPath()
      ctx.moveTo(x, y)
      pathArray.push({ x, y, t: Date.now() })
    } else if (type === 'move') {
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, y)
      pathArray.push({ x, y, t: Date.now() })
    } else if (type === 'end') {
      ctx.beginPath()
    }
  }
}

function clearCanvas() {
  if (leftCtx && rightCtx) {
    leftCtx.clearRect(0, 0, leftCanvas.value.width, leftCanvas.value.height)
    rightCtx.clearRect(0, 0, rightCanvas.value.width, rightCanvas.value.height)
    leftPaths = []
    rightPaths = []
    strokeCountLeft.value = 0
    strokeCountRight.value = 0
    // 如果是描摹模式，清除后要重绘模版
    initCanvas()
  }
}

function finishDrawing() {
  clearInterval(timerInterval)
  
  if (leftCanvas.value) leftCanvasImage.value = leftCanvas.value.toDataURL()
  if (rightCanvas.value) rightCanvasImage.value = rightCanvas.value.toDataURL()

  isDrawing.value = false
  trainingStore.endTraining()

  nextTick(() => {
    showResult.value = true
  })
  
  saveRecord()
}

function saveRecord() {
  userStore.addTrainingRecord({
    moduleName: 'mirror',
    difficulty: trainingModes.find(m => m.value === selectedMode.value)?.name,
    score: syncScore.value,
    duration: drawingDuration.value,
    details: {
      mode: selectedMode.value,
      syncRate: syncScore.value
    }
  })
}

function handleRetry() {
  showResult.value = false
  startDrawing()
}

function handleClose() {
  showResult.value = false
  goBack()
}

function goBack() {
  if (timerInterval) clearInterval(timerInterval)
  router.back()
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rs = s % 60
  return `${m}:${rs.toString().padStart(2, '0')}`
}

onMounted(() => {
  if (detectPC()) showPCWarning.value = true
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style lang="scss" scoped>
// 变量定义 (如果没有全局 SCSS 变量，这里作为 fallback)
$bg-dark: #121212;
$card-bg: #1e1e1e;
$accent: #00d4ff;
$text-main: #ffffff;
$text-sub: #aaaaaa;

.mirror-page {
  min-height: 100vh;
  background-color: $bg-dark;
  color: $text-main;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  touch-action: none; // 禁止页面级滚动
}

// 头部样式
.page-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 10;
  
  .page-title {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .back-button, .clear-button {
    background: none;
    border: none;
    color: $text-main;
    padding: 8px;
    font-size: 14px;
  }
  
  .clear-button {
    color: $accent;
    font-weight: 500;
  }
}

// 配置界面样式
.config-screen {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  touch-action: auto; // 配置页允许滚动
  
  .config-card {
    background: $card-bg;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  
  .section-title {
    font-size: 14px;
    color: $text-sub;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    
    &.mt-6 { margin-top: 24px; }
  }
  
  // 模式列表
  .mode-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .mode-item {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 16px;
    color: $text-main;
    text-align: left;
    transition: all 0.2s;
    
    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: $accent;
    }
    
    .mode-icon {
      font-size: 24px;
      margin-right: 16px;
    }
    
    .mode-info {
      flex: 1;
      
      .mode-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        .name { font-weight: 600; font-size: 16px; }
        .stars {
          color: #333;
          font-size: 12px;
          .filled { color: #ffb400; }
        }
      }
      
      .desc {
        font-size: 12px;
        color: $text-sub;
        line-height: 1.3;
      }
    }
  }
  
  // 任务切换
  .task-tabs {
    display: flex;
    background: rgba(0,0,0,0.2);
    padding: 4px;
    border-radius: 10px;
    
    .task-tab {
      flex: 1;
      background: none;
      border: none;
      color: $text-sub;
      padding: 10px;
      font-size: 14px;
      border-radius: 8px;
      
      &.active {
        background: $card-bg; // 或者 accent
        color: $text-main;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
    }
  }
  
  .hint-box {
    margin-top: 20px;
    padding: 12px;
    background: rgba(0, 212, 255, 0.05);
    border-radius: 8px;
    color: $accent;
    font-size: 12px;
    text-align: center;
  }
  
  .start-button {
    width: 100%;
    margin-top: 30px;
    padding: 16px;
    background: linear-gradient(90deg, #00d4ff, #005bea);
    border: none;
    border-radius: 30px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
    
    &:active { transform: scale(0.98); }
  }
}

// 绘图界面样式
.drawing-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px;
  
  .instruction-banner {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 8px;
    color: $text-sub;
    font-size: 12px;
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    margin-bottom: 10px;
  }
  
  .canvas-container {
    flex: 1;
    display: flex;
    background: #181818;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.05);
    position: relative;
    overflow: hidden;
    touch-action: none; // 关键：禁止浏览器手势
    
    .divider {
      width: 2px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      z-index: 5;
      
      .line {
        width: 1px;
        flex: 1;
        background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent);
      }
      .divider-icon {
        font-size: 12px;
        color: rgba(255,255,255,0.2);
      }
    }
    
    .canvas-panel {
      flex: 1;
      position: relative;
      
      .panel-tag {
        position: absolute;
        top: 10px;
        left: 0; 
        right: 0;
        text-align: center;
        font-size: 10px;
        color: rgba(255,255,255,0.1);
        text-transform: uppercase;
        pointer-events: none;
      }
      
      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    }
  }
  
  .drawing-controls {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    
    .timer {
      font-family: monospace;
      font-size: 20px;
      color: $text-main;
      background: rgba(255,255,255,0.05);
      padding: 8px 16px;
      border-radius: 8px;
    }
    
    .finish-button {
      background: $text-main;
      color: $bg-dark;
      border: none;
      padding: 12px 24px;
      border-radius: 30px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(255,255,255,0.2);
    }
  }
}

// PC警告弹窗
.pc-warning-content {
  text-align: center;
  padding: 20px;
  color: #333; // Modal内通常是白底黑字
  
  .warning-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  h2 { font-size: 20px; margin-bottom: 10px; }
  .warning-text { color: #666; margin-bottom: 24px; line-height: 1.5; }
  
  .primary-button {
    background: $accent;
    color: #fff;
    border: none;
    padding: 12px 30px;
    border-radius: 8px;
    font-size: 16px;
  }
}
</style>