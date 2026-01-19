<template>
  <div class="mirror-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">双侧肢体镜像协调</h1>
      <button v-if="isDrawing && !countdown.isCountingDown.value" class="clear-button" @click="clearCanvas">清除</button>
    </header>

    <!-- PC端提示弹窗 -->
    <Modal 
      :visible="showPCWarning" 
      :show-close="false" 
      :show-footer="false" 
      :close-on-click-overlay="false"
      @close="handlePCWarningClose"
    >
      <div class="pc-warning-content">
        <div class="warning-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2>功能提示</h2>
        <p class="warning-text">
          镜像协调训练需要双手同时操作，<br />
          建议使用<strong>移动设备</strong>或<strong>平板电脑</strong>进行训练。
        </p>
        <p class="warning-subtext">
          PC端无法实现双手独立绘制的最佳体验
        </p>
        <div class="warning-actions">
          <button class="primary-button" @click="goBack">返回首页</button>
        </div>
      </div>
    </Modal>

    <!-- 配置界面 -->
    <div v-if="!isDrawing && !showResult && !isPC" class="config-screen">
      <div class="config-card">
        <h2>选择难度</h2>

        <div class="config-group">
          <label>训练模式</label>
          <div class="mode-grid">
            <button
              v-for="mode in modes"
              :key="mode.value"
              :class="['mode-button', { active: selectedMode === mode.value }]"
              @click="selectedMode = mode.value"
            >
              <div class="mode-icon">{{ mode.icon }}</div>
              <div class="mode-name">{{ mode.name }}</div>
              <div class="mode-desc">{{ mode.desc }}</div>
            </button>
          </div>
        </div>

        <div class="config-group">
          <label>模板类型</label>
          <ButtonGroupSelect v-model="templateType" :options="templateOptions" />
        </div>

        <button class="start-button" @click="startDrawing">开始训练</button>
      </div>
    </div>

    <!-- 绘图界面 -->
    <div v-if="isDrawing && !isPC" class="drawing-screen">
      <!-- 倒计时遮罩层 -->
      <GameCountdown
        :current-count="countdown.currentCount.value"
        :progress="countdown.progress.value"
        :is-visible="countdown.isCountingDown.value"
      />

      <div v-if="!countdown.isCountingDown.value" class="instruction-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>左右两侧画板独立操作，双手同时绘制</span>
      </div>

      <div v-if="!countdown.isCountingDown.value" class="canvas-container" :class="{ disabled: isGameDisabled }">
        <div class="canvas-panel left-panel">
          <h3>✍️ 左手画板</h3>
          <canvas
            ref="leftCanvas"
            @mousedown="startDraw('left', $event)"
            @mousemove="draw('left', $event)"
            @mouseup="endDraw('left')"
            @mouseleave="endDraw('left')"
            @touchstart="startDraw('left', $event)"
            @touchmove="draw('left', $event)"
            @touchend="endDraw('left')"
            @touchcancel="endDraw('left')"
          ></canvas>
        </div>

        <div class="divider">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="17 8 21 12 17 16" />
            <polyline points="7 8 3 12 7 16" />
          </svg>
        </div>

        <div class="canvas-panel right-panel">
          <h3>✍️ 右手画板</h3>
          <canvas
            ref="rightCanvas"
            @mousedown="startDraw('right', $event)"
            @mousemove="draw('right', $event)"
            @mouseup="endDraw('right')"
            @mouseleave="endDraw('right')"
            @touchstart="startDraw('right', $event)"
            @touchmove="draw('right', $event)"
            @touchend="endDraw('right')"
            @touchcancel="endDraw('right')"
          >
          </canvas>
        </div>
      </div>

      <div v-if="!countdown.isCountingDown.value" class="drawing-controls">
        <button class="control-button" @click="clearCanvas">清除画布</button>
        <button class="control-button primary" @click="finishDrawing">完成训练</button>
      </div>

      <div v-if="!countdown.isCountingDown.value" class="drawing-hint">
        <p v-if="templateType !== 'free'">💡 提示：左手绘制{{ templateHint.left }}，右手绘制{{ templateHint.right }}</p>
        <p v-else>💡 自由绘制，锻炼双手协调能力</p>
      </div>
    </div>

    <!-- 结果界面 -->
    <GameResult
      :visible="showResult"
      :type="resultType"
      :title="resultTitle"
      :subtitle="resultSubtitle"
      :stats="resultStats"
      :show-retry="true"
      close-text="返回首页"
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
import { useGameCountdown } from '@/composables/useGameCountdown'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'
import GameCountdown from '@/components/GameCountdown.vue'
import GameResult from '@/components/GameResult.vue'
import Modal from '@/components/Modal.vue'
import { modes, templateOptions } from '@/config/mirror.js'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// PC端检测
const showPCWarning = ref(false)
const isPC = ref(false)

// 配置
const selectedMode = ref('different')
const templateType = ref('free')

// 游戏状态
const gameState = ref('idle') // 'idle' | 'countdown' | 'active' | 'completed'

// 绘图状态
const isDrawing = ref(false)
const showResult = ref(false)
const leftCanvas = ref(null)
const rightCanvas = ref(null)
const previewLeft = ref(null)
const previewRight = ref(null)
const drawingDuration = ref(0)
const strokeCount = ref(0)

// 倒计时设置
const countdown = useGameCountdown({
  duration: 3,
  onComplete: startDrawingAfterCountdown
})

// 保存画布图像数据
const leftCanvasImage = ref(null)
const rightCanvasImage = ref(null)

let leftCtx = null
let rightCtx = null
let startTime = 0
let leftPaths = []
let rightPaths = []

// 跟踪每个画板的绘制状态
let drawingLeft = false
let drawingRight = false

const templateHint = ref({ left: '', right: '' })

const templateHints = {
  circle: { left: '圆形', right: '圆形' },
  square: { left: '方形', right: '方形' },
  wave: { left: '波浪线', right: '波浪线' },
  different: { left: '圆形', right: '方形' }
}

const isGameDisabled = computed(() => {
  return gameState.value === 'countdown'
})

// 结果弹窗相关
const resultType = computed(() => 'success')

const resultTitle = computed(() => '训练完成！')

const resultSubtitle = computed(() => '继续保持，提升双侧协调能力')

const resultStats = computed(() => [
  { label: '绘制时长', value: formatTime(drawingDuration.value), highlight: true },
  { label: '笔画数', value: `${strokeCount.value}`, highlight: false },
  { label: '训练模式', value: getModeText(selectedMode.value), highlight: false }
])

// 检测是否为PC端
function detectPC() {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // 如果不是移动设备，且屏幕宽度大于1024px，认为是PC
  isPC.value = !isMobile && !isTablet && window.innerWidth > 1024
  
  return isPC.value
}

function handlePCWarningClose() {
  showPCWarning.value = false
}

function startDrawing() {
  // 立即进入绘图界面
  isDrawing.value = true
  showResult.value = false
  strokeCount.value = 0
  leftPaths = []
  rightPaths = []
  
  // 根据模式设置提示
  if (selectedMode.value === 'different') {
    templateHint.value = templateHints.different
  } else {
    templateHint.value = templateHints[templateType.value] || { left: '', right: '' }
  }

  // 设置为倒计时状态
  gameState.value = 'countdown'

  // 先启动倒计时，再初始化画布
  countdown.start()
  
  // 延迟初始化画布，确保倒计时先显示
  setTimeout(() => {
    nextTick(() => {
      initCanvas()
    })
  }, 100)
}

function startDrawingAfterCountdown() {
  // 倒计时结束后，开始实际绘图
  gameState.value = 'active'
  startTime = Date.now()

  trainingStore.startTraining('mirror')
}

function initCanvas() {
  if (!leftCanvas.value || !rightCanvas.value) return

  const width = leftCanvas.value.parentElement.clientWidth - 40
  const height = Math.min(width, 400)

  ;[leftCanvas.value, rightCanvas.value].forEach(c => {
    c.width = width
    c.height = height
  })

  leftCtx = leftCanvas.value.getContext('2d')
  rightCtx = rightCanvas.value.getContext('2d')
  ;[leftCtx, rightCtx].forEach(ctx => {
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  })

  // 渲染模板参考线（仅辅助显示）
  if (selectedMode.value === 'different') {
    drawTemplate(leftCtx, 'circle', width, height)
    drawTemplate(rightCtx, 'square', width, height)
  } else if (selectedMode.value === 'same' && templateType.value !== 'free') {
    drawTemplate(leftCtx, templateType.value, width, height)
    drawTemplate(rightCtx, templateType.value, width, height)
  }
}

function drawTemplate(ctx, type, w, h) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  const pad = 20
  if (type === 'circle') {
    ctx.arc(w / 2, h / 2, (w - pad * 2) / 2, 0, Math.PI * 2)
  } else if (type === 'square') {
    ctx.rect(pad, pad, w - pad * 2, h - pad * 2)
  } else if (type === 'wave') {
    const amp = (h - pad * 2) / 4
    const midY = h / 2
    const steps = 20
    for (let i = 0; i <= steps; i++) {
      const x = (w / steps) * i
      const y = midY + Math.sin((i / steps) * Math.PI * 2) * amp
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.restore()
}

function getCanvasCoords(canvas, event) {
  const rect = canvas.getBoundingClientRect()
  const e = event.touches ? event.touches[0] : event
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function startDraw(side, event) {
  // 阻止默认行为和事件冒泡
  if (event.preventDefault) event.preventDefault()
  if (event.stopPropagation) event.stopPropagation()
  
  if (side === 'left') {
    drawingLeft = true
  } else {
    drawingRight = true
  }
  
  strokeCount.value++

  const canvas = side === 'left' ? leftCanvas.value : rightCanvas.value
  const ctx = side === 'left' ? leftCtx : rightCtx
  const coords = getCanvasCoords(canvas, event)

  ctx.beginPath()
  ctx.moveTo(coords.x, coords.y)

  const pathArray = side === 'left' ? leftPaths : rightPaths
  pathArray.push({ x: coords.x, y: coords.y, t: Date.now() })
}

function draw(side, event) {
  const isDrawing = side === 'left' ? drawingLeft : drawingRight
  if (!isDrawing) return
  
  // 阻止默认行为和事件冒泡
  if (event.preventDefault) event.preventDefault()
  if (event.stopPropagation) event.stopPropagation()

  const canvas = side === 'left' ? leftCanvas.value : rightCanvas.value
  const ctx = side === 'left' ? leftCtx : rightCtx

  const coords = getCanvasCoords(canvas, event)

  ctx.lineTo(coords.x, coords.y)
  ctx.stroke()

  const pathArray = side === 'left' ? leftPaths : rightPaths
  pathArray.push({ x: coords.x, y: coords.y, t: Date.now() })
}

function endDraw(side) {
  if (side === 'left') {
    drawingLeft = false
  } else if (side === 'right') {
    drawingRight = false
  } else {
    // 如果没有指定 side，清除所有
    drawingLeft = false
    drawingRight = false
  }
}

function clearCanvas() {
  if (leftCtx && rightCtx) {
    leftCtx.clearRect(0, 0, leftCanvas.value.width, leftCanvas.value.height)
    rightCtx.clearRect(0, 0, rightCanvas.value.width, rightCanvas.value.height)
    leftPaths = []
    rightPaths = []
    strokeCount.value = 0
  }
}

function finishDrawing() {
  drawingDuration.value = Date.now() - startTime

  // 保存画布为图像数据URL
  if (leftCanvas.value && rightCanvas.value) {
    leftCanvasImage.value = leftCanvas.value.toDataURL('image/png')
    rightCanvasImage.value = rightCanvas.value.toDataURL('image/png')
  }

  // 结束训练
  isDrawing.value = false
  trainingStore.endTraining()

  // 显示结果并加载预览
  nextTick(() => {
    showResult.value = true

    // 再次使用 nextTick 确保预览画布已渲染
    nextTick(() => {
      loadPreviewImages()
    })
  })

  saveTrainingRecord()
}

function loadPreviewImages() {
  if (!previewLeft.value || !previewRight.value) return
  if (!leftCanvasImage.value || !rightCanvasImage.value) return

  const previewWidth = 200
  const previewHeight = 200

  // 加载左侧预览
  const leftImg = new Image()
  leftImg.onload = () => {
    previewLeft.value.width = previewWidth
    previewLeft.value.height = previewHeight
    const ctx = previewLeft.value.getContext('2d')
    ctx.drawImage(leftImg, 0, 0, previewWidth, previewHeight)
  }
  leftImg.src = leftCanvasImage.value

  // 加载右侧预览
  const rightImg = new Image()
  rightImg.onload = () => {
    previewRight.value.width = previewWidth
    previewRight.value.height = previewHeight
    const ctx = previewRight.value.getContext('2d')
    ctx.drawImage(rightImg, 0, 0, previewWidth, previewHeight)
  }
  rightImg.src = rightCanvasImage.value
}

function saveTrainingRecord() {
  // 保存训练记录
  const score = Math.max(0, 100 - Math.floor(drawingDuration.value / 1000))
  userStore.addTrainingRecord({
    moduleName: 'mirror',
    difficulty: getModeText(selectedMode.value),
    score,
    duration: drawingDuration.value,
    accuracy: 1, // 镜像协调没有准确率概念
    details: {
      mode: selectedMode.value,
      templateType: templateType.value,
      strokeCount: strokeCount.value,
      leftPathLength: leftPaths.length,
      rightPathLength: rightPaths.length
    }
  })
}

function resetDrawing() {
  showResult.value = false
  isDrawing.value = false
  gameState.value = 'idle'
  leftCanvasImage.value = null
  rightCanvasImage.value = null
}

function handleRetry() {
  showResult.value = false
  resetDrawing()
  startDrawing()
}

function handleClose() {
  showResult.value = false
  goBack()
}

function getModeText(mode) {
  const modeObj = modes.find(m => m.value === mode)
  return modeObj ? modeObj.name : mode
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${seconds}秒`
}

function goBack() {
  router.back()
}

// 页面加载时检测PC端
onMounted(() => {
  if (detectPC()) {
    showPCWarning.value = true
  }
})

onUnmounted(() => {
  // 清理倒计时
  countdown.cleanup()
})
</script>

<style lang="scss" scoped>
.mirror-page {
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

  .back-button,
  .clear-button {
    @include button-reset;
    @include click-feedback;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;
    font-size: $font-sm;
  }

  .back-button {
    width: 40px;
    height: 40px;
    padding: 0;
    @include flex-center;
    position: absolute;
    left: $spacing-lg;
  }

  .clear-button {
    padding: $spacing-sm $spacing-md;
    position: absolute;
    right: $spacing-lg;
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
  max-width: 500px;
  width: 100%;

  @include mobile {
    padding: $spacing-lg;
  }

  h2 {
    text-align: center;
    margin-bottom: $spacing-xl;
    font-size: $font-xl;
  }
}

.config-group {
  margin-bottom: $spacing-xl;

  label {
    display: block;
    font-weight: $font-medium;
    margin-bottom: $spacing-md;
    font-size: $font-base;
  }
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }

  .mode-button {
    @include button-reset;
    @include click-feedback;
    @include glass-card;
    padding: $spacing-lg;
    text-align: center;
    border: 2px solid rgba(255, 255, 255, 0.1);
    transition: all $transition-base;

    &.active {
      border-color: $accent-primary;
      background: rgba(0, 212, 255, 0.1);
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
    }

    // 只在桌面端启用 hover
    @media (hover: hover) and (pointer: fine) {
      &:hover:not(.active) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(0, 212, 255, 0.3);
      }
    }

    .mode-icon {
      font-size: 2rem;
      margin-bottom: $spacing-sm;
    }

    .mode-name {
      font-size: $font-base;
      font-weight: $font-medium;
      margin-bottom: $spacing-xs;
    }

    .mode-desc {
      font-size: $font-sm;
      color: $text-secondary;
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

  @include mobile {
    padding: $spacing-md;
    font-size: $font-base;
  }

  // 只在桌面端启用 hover
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 12px 32px rgba(0, 212, 255, 0.5),
        0 0 60px rgba(0, 212, 255, 0.3);
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.drawing-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: calc($spacing-lg + 60px) $spacing-md $spacing-md;
  gap: $spacing-sm;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.instruction-banner {
  @include glass-card;
  padding: $spacing-sm $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: $accent-primary;
  font-size: clamp(10px, 2vw, $font-xs);
  font-weight: $font-medium;
  text-align: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }
}

.canvas-container {
  flex: 1;
  display: flex;
  gap: $spacing-xs;
  min-height: 0;
  position: relative;
  transition: opacity 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @include mobile {
    flex-direction: column;
    gap: $spacing-xs;
  }

  .canvas-panel {
    flex: 1;
    @include glass-card;
    padding: $spacing-xs;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 0;

    h3 {
      font-size: clamp(10px, 2vw, $font-sm);
      margin-bottom: $spacing-xs;
      text-align: center;
      flex-shrink: 0;
    }

    canvas {
      flex: 1;
      border-radius: $radius-sm;
      background: rgba(0, 0, 0, 0.3);
      touch-action: none;
      min-height: 0;
      width: 100%;
    }

    &.left-panel canvas {
      cursor: crosshair;
    }

    &.right-panel canvas {
      cursor: crosshair;
    }
  }

  .divider {
    width: 2px;
    background: linear-gradient(180deg, transparent, $accent-primary, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $accent-primary;
    flex-shrink: 0;

    svg {
      width: 16px;
      height: 16px;
    }

    @include mobile {
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, $accent-primary, transparent);
    }
  }
}

.drawing-controls {
  display: flex;
  gap: $spacing-sm;
  justify-content: center;
  flex-shrink: 0;

  .control-button {
    @include button-reset;
    @include click-feedback;
    padding: clamp($spacing-sm, 2vh, $spacing-md) clamp($spacing-md, 4vw, $spacing-lg);
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-medium;
    font-size: clamp($font-sm, 2.5vw, $font-base);

    &.primary {
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      border: none;
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
    }

    // 只在桌面端启用 hover
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      &.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 212, 255, 0.4);
      }
    }
  }
}

.drawing-hint {
  text-align: center;
  color: $text-secondary;
  font-size: clamp(10px, 2vw, $font-xs);
  flex-shrink: 0;
  line-height: 1.4;
}

// PC端警告弹窗样式
.pc-warning-content {
  text-align: center;
  padding: $spacing-xl;

  .warning-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto $spacing-lg;
    border-radius: $radius-full;
    background: rgba(255, 170, 0, 0.1);
    border: 2px solid rgba(255, 170, 0, 0.3);
    @include flex-center;

    svg {
      color: $accent-warning;
      stroke-width: 2;
    }
  }

  h2 {
    font-size: $font-2xl;
    font-weight: $font-bold;
    margin-bottom: $spacing-lg;
    color: $text-primary;
  }

  .warning-text {
    font-size: $font-base;
    line-height: 1.8;
    color: $text-secondary;
    margin-bottom: $spacing-md;

    strong {
      color: $accent-primary;
      font-weight: $font-semibold;
    }
  }

  .warning-subtext {
    font-size: $font-sm;
    color: $text-tertiary;
    margin-bottom: $spacing-2xl;
  }

  .warning-actions {
    display: flex;
    gap: $spacing-md;
    justify-content: center;

    button {
      @include button-reset;
      @include click-feedback;
      padding: $spacing-md $spacing-xl;
      border-radius: $radius-md;
      font-weight: $font-medium;
      font-size: $font-base;
      transition: all $transition-base;
      min-width: 120px;
    }

    .primary-button {
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      color: $text-primary;
      width: 100%;
      max-width: 200px;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
        }
      }
    }
  }
}
</style>
