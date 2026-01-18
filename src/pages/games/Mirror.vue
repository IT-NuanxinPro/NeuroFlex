<template>
  <div class="mirror-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">双侧肢体镜像协调</h1>
      <button v-if="isDrawing" class="clear-button" @click="clearCanvas">清除</button>
    </header>

    <!-- 配置界面 -->
    <div v-if="!isDrawing && !showResult" class="config-screen">
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
    <div v-if="isDrawing" class="drawing-screen">
      <div class="instruction-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>在左侧画板绘制，右侧会自动镜像显示</span>
      </div>

      <div class="canvas-container">
        <div class="canvas-panel left-panel">
          <h3>✍️ 左侧画板（可绘制）</h3>
          <canvas
            ref="leftCanvas"
            @mousedown="startDraw('left', $event)"
            @mousemove="draw('left', $event)"
            @mouseup="endDraw"
            @mouseleave="endDraw"
            @touchstart="startDraw('left', $event)"
            @touchmove="draw('left', $event)"
            @touchend="endDraw"
          ></canvas>
        </div>

        <div class="divider">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="17 8 21 12 17 16" />
            <polyline points="7 8 3 12 7 16" />
          </svg>
        </div>

        <div class="canvas-panel right-panel">
          <h3>🪞 右侧镜像（自动）</h3>
          <canvas
            ref="rightCanvas"
            @mousedown="startDraw('right', $event)"
            @mousemove="draw('right', $event)"
            @mouseup="endDraw"
            @mouseleave="endDraw"
            @touchstart="startDraw('right', $event)"
            @touchmove="draw('right', $event)"
            @touchend="endDraw"
          >
          </canvas>
          <div class="mirror-overlay">镜像区域</div>
        </div>
      </div>

      <div class="drawing-controls">
        <button class="control-button" @click="clearCanvas">清除画布</button>
        <button class="control-button primary" @click="finishDrawing">完成训练</button>
      </div>

      <div class="drawing-hint">
        <p v-if="templateType !== 'free'">💡 提示：尝试绘制{{ templateHint }}</p>
        <p v-else>💡 自由绘制，观察镜像效果</p>
      </div>
    </div>

    <!-- 结果界面 -->
    <div v-if="showResult" class="result-screen">
      <div class="result-card">
        <div class="result-icon success">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2>训练完成！</h2>

        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">绘制时长</span>
            <span class="stat-value">{{ formatTime(drawingDuration) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">笔画数</span>
            <span class="stat-value">{{ strokeCount }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">训练模式</span>
            <span class="stat-value">{{ getModeText(selectedMode) }}</span>
          </div>
        </div>

        <div class="result-preview">
          <h3>你的作品</h3>
          <div class="preview-canvases">
            <div class="preview-item">
              <p>左侧</p>
              <canvas ref="previewLeft"></canvas>
            </div>
            <div class="preview-item">
              <p>右侧镜像</p>
              <canvas ref="previewRight"></canvas>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <button class="secondary-button" @click="resetDrawing">再来一次</button>
          <button class="primary-button" @click="goBack">返回首页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'
import { modes, templateOptions } from '@/config/mirror.js'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 配置
const selectedMode = ref('different')
const templateType = ref('free')


// 绘图状态
const isDrawing = ref(false)
const showResult = ref(false)
const leftCanvas = ref(null)
const rightCanvas = ref(null)
const previewLeft = ref(null)
const previewRight = ref(null)
const drawingDuration = ref(0)
const strokeCount = ref(0)

// 保存画布图像数据
const leftCanvasImage = ref(null)
const rightCanvasImage = ref(null)

let leftCtx = null
let rightCtx = null
let drawing = false
let startTime = 0
let leftPaths = []
let rightPaths = []

const templateHint = ref('')

const templateHints = {
  circle: '一个圆形',
  square: '一个方形',
  wave: '波浪线'
}

function startDrawing() {
  isDrawing.value = true
  showResult.value = false
  startTime = Date.now()
  strokeCount.value = 0
  leftPaths = []
  rightPaths = []
  templateHint.value = templateHints[templateType.value] || ''

  trainingStore.startTraining('mirror')

  nextTick(() => {
    initCanvas()
  })
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
  event.preventDefault()
  drawing = true
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
  if (!drawing) return
  event.preventDefault()

  const canvas = side === 'left' ? leftCanvas.value : rightCanvas.value
  const ctx = side === 'left' ? leftCtx : rightCtx

  const coords = getCanvasCoords(canvas, event)

  ctx.lineTo(coords.x, coords.y)
  ctx.stroke()

  const pathArray = side === 'left' ? leftPaths : rightPaths
  pathArray.push({ x: coords.x, y: coords.y, t: Date.now() })
}

function endDraw() {
  drawing = false
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

function endTraining() {
  // 这个函数现在不需要了，逻辑已经合并到 finishDrawing
}

function resetDrawing() {
  showResult.value = false
  isDrawing.value = false
  leftCanvasImage.value = null
  rightCanvasImage.value = null
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
  max-width: 700px;
  width: 100%;

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

.mode-grid {
  @include button-grid;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
  }

  .mode-button {
    @include button-reset;
    @include click-feedback;
    @include glass-card;
    padding: $spacing-lg;
    text-align: center;
    border: 2px solid transparent;
    transition: all $transition-base;

    &.active {
      border-color: $accent-primary;
      background: rgba(0, 212, 255, 0.1);
    }

    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.1);
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

.drawing-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: calc($spacing-lg + 60px) $spacing-lg $spacing-lg;
  gap: $spacing-lg;
  overflow-y: auto;
  @include custom-scrollbar;
}

.instruction-banner {
  @include glass-card;
  padding: $spacing-md $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: $accent-primary;
  font-size: $font-sm;
  font-weight: $font-medium;
  text-align: center;
  justify-content: center;

  svg {
    flex-shrink: 0;
  }

  @media (max-width: $breakpoint-sm) {
    font-size: $font-xs;
    padding: $spacing-sm $spacing-md;
  }
}

.canvas-container {
  flex: 1;
  display: flex;
  gap: $spacing-md;
  min-height: 400px;

  @media (max-width: $breakpoint-sm) {
    flex-direction: column;
  }

  .canvas-panel {
    flex: 1;
    @include glass-card;
    padding: $spacing-md;
    display: flex;
    flex-direction: column;
    position: relative;

    h3 {
      font-size: $font-base;
      margin-bottom: $spacing-sm;
      text-align: center;
    }

    canvas {
      flex: 1;
      border-radius: $radius-md;
      background: rgba(0, 0, 0, 0.3);
      touch-action: none;
    }

    &.left-panel canvas {
      cursor: crosshair;
    }

    &.right-panel {
      canvas {
        cursor: not-allowed;
        opacity: 0.9;
      }

      .mirror-overlay {
        position: absolute;
        bottom: $spacing-md;
        right: $spacing-md;
        padding: $spacing-xs $spacing-sm;
        background: rgba(255, 51, 102, 0.2);
        border: 1px solid rgba(255, 51, 102, 0.5);
        border-radius: $radius-sm;
        font-size: $font-xs;
        color: $accent-error;
        pointer-events: none;
      }
    }
  }

  .divider {
    width: 2px;
    background: linear-gradient(180deg, transparent, $accent-primary, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $accent-primary;

    @media (max-width: $breakpoint-sm) {
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, $accent-primary, transparent);
    }
  }
}

.drawing-controls {
  display: flex;
  gap: $spacing-md;
  justify-content: center;

  .control-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-md $spacing-xl;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-medium;

    &.primary {
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      border: none;
    }
  }
}

.drawing-hint {
  text-align: center;
  color: $text-secondary;
  font-size: $font-base;
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
      font-size: $font-lg;
      font-weight: $font-bold;
      color: $accent-primary;
    }
  }
}

.result-preview {
  margin: $spacing-xl 0;

  h3 {
    text-align: center;
    margin-bottom: $spacing-lg;
  }

  .preview-canvases {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-lg;

    @media (max-width: $breakpoint-sm) {
      grid-template-columns: 1fr;
    }

    .preview-item {
      text-align: center;

      p {
        font-size: $font-sm;
        color: $text-secondary;
        margin-bottom: $spacing-sm;
      }

      canvas {
        width: 100%;
        height: auto;
        border-radius: $radius-md;
        background: rgba(0, 0, 0, 0.3);
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
