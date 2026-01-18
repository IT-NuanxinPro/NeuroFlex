<template>
  <div class="audio-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">听觉选择性注意</h1>
    </header>

    <!-- 配置界面 -->
    <div v-if="!isTraining && !showResult" class="config-screen">
      <div class="config-card">
        <h2>选择难度</h2>

        <div class="config-group">
          <label>难度等级（背景噪音强度）</label>
          <div class="button-group">
            <button
              v-for="snr in [30, 20, 12]"
              :key="snr"
              :class="['snr-button', { active: signalNoiseRatio === snr }]"
              @click="signalNoiseRatio = snr"
            >
              {{ snr === 30 ? '简单' : snr === 20 ? '中等' : '困难' }}
            </button>
          </div>
          <p class="config-hint">
            {{
              signalNoiseRatio === 30
                ? '背景噪音较小'
                : signalNoiseRatio === 20
                  ? '背景噪音中等'
                  : '背景噪音较大'
            }}
          </p>
        </div>

        <div class="config-group">
          <label>背景音类型</label>
          <ButtonGroupSelect v-model="backgroundType" :options="backgroundOptions" />
        </div>

        <div class="config-group">
          <label>数字数量</label>
          <ButtonGroupSelect v-model="digitCount" :options="digitCountOptions" />
        </div>

        <button class="start-button" @click="startTraining">开始训练</button>
      </div>
    </div>

    <!-- 训练界面 - 播放阶段 -->
    <div v-if="isTraining && phase === 'playing'" class="training-screen">
      <div class="audio-visual">
        <div class="sound-wave">
          <div
            class="wave-bar"
            v-for="i in 20"
            :key="i"
            :style="{ animationDelay: `${i * 0.05}s` }"
          ></div>
        </div>
        <p class="audio-hint">请仔细聆听数字...</p>
        <p class="progress-text">{{ currentDigitIndex }} / {{ digitSequence.length }}</p>
      </div>
    </div>

    <!-- 训练界面 - 输入阶段 -->
    <div v-if="isTraining && phase === 'input'" class="training-screen">
      <div class="input-section">
        <h3>请输入你听到的数字序列</h3>
        <p class="input-hint">按顺序输入，用空格分隔（最多{{ digitSequence.length }}个数字）</p>

        <div class="input-wrapper">
          <input
            v-model="userInput"
            type="text"
            class="digit-input"
            placeholder="例如: 1 5 3 7 2"
            @keyup.enter="submitAnswer"
            readonly
          />
          <span
            class="input-counter"
            :class="{ 'limit-reached': currentInputCount >= digitSequence.length }"
          >
            {{ currentInputCount }} / {{ digitSequence.length }}
          </span>
        </div>

        <div class="number-pad">
          <button
            v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]"
            :key="num"
            class="num-button"
            @click="addDigit(num)"
          >
            {{ num }}
          </button>
          <button class="num-button space-button" @click="addSpace">空格</button>
          <button class="num-button delete-button" @click="deleteDigit">删除</button>
        </div>

        <div class="input-actions">
          <button class="secondary-button" @click="playAgain">重新播放</button>
          <button class="primary-button" @click="submitAnswer" :disabled="!userInput.trim()">
            提交答案
          </button>
        </div>
      </div>
    </div>

    <!-- 结果界面 -->
    <div v-if="showResult" class="result-screen">
      <div class="result-card">
        <div class="result-icon" :class="accuracy >= 0.8 ? 'success' : 'partial'">
          <svg
            v-if="accuracy >= 0.8"
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h2>{{ accuracy >= 0.8 ? '完成！' : '继续努力' }}</h2>

        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">正确数字</span>
            <span class="stat-value">{{ correctDigits }} / {{ digitSequence.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">顺序正确</span>
            <span class="stat-value">{{ correctOrder }} / {{ digitSequence.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">准确率</span>
            <span class="stat-value">{{ Math.round(accuracy * 100) }}%</span>
          </div>
        </div>

        <div class="answer-comparison">
          <div class="answer-row">
            <span class="answer-label">正确答案:</span>
            <span class="answer-value">{{ digitSequence.join(' ') }}</span>
          </div>
          <div class="answer-row">
            <span class="answer-label">你的答案:</span>
            <span class="answer-value">{{ userDigits.join(' ') }}</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="secondary-button" @click="resetTraining">再来一次</button>
          <button class="primary-button" @click="goBack">返回首页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 配置
const signalNoiseRatio = ref(30)
const backgroundType = ref('white')
const digitCount = ref('6')

const backgroundOptions = [
  { label: '白噪音', value: 'white' },
  { label: '流行', value: 'music' },
  { label: '摇滚', value: 'rock' }
]

const digitCountOptions = [
  { label: '6个', value: '6' },
  { label: '8个', value: '8' },
  { label: '9个', value: '9' }
]

// 训练状态
const isTraining = ref(false)
const showResult = ref(false)
const phase = ref('playing') // 'playing' | 'input'
const digitSequence = ref([])
const currentDigitIndex = ref(0)
const userInput = ref('')
const userDigits = ref([])
const correctDigits = ref(0)
const correctOrder = ref(0)
const accuracy = ref(0)

// 计算当前输入的数字数量
const currentInputCount = computed(() => {
  return userInput.value
    .trim()
    .split(/\s+/)
    .filter(d => d !== '').length
})

let audioContext = null
let playTimer = null
let currentAudio = null

function generateDigitSequence() {
  const digits = []
  for (let i = 0; i < parseInt(digitCount.value); i++) {
    digits.push(Math.floor(Math.random() * 10))
  }
  return digits
}

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

function playDigitSound(digit) {
  const ctx = initAudioContext()

  // 使用Web Speech API播放数字
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(digit.toString())
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9 // 稍微慢一点，更清晰
    utterance.pitch = 1.0
    utterance.volume = 1.0 // 数字音量始终最大

    window.speechSynthesis.speak(utterance)
  }
}

function playBackgroundNoise() {
  const ctx = initAudioContext()

  // 创建白噪音或音乐背景
  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const gainNode = ctx.createGain()
  // 根据信噪比计算背景音量
  // SNR 30% = 背景音 0.15 (很小)
  // SNR 20% = 背景音 0.25 (中等)
  // SNR 12% = 背景音 0.35 (较大)
  gainNode.gain.value = (100 - signalNoiseRatio.value) / 300

  source.connect(gainNode)
  gainNode.connect(ctx.destination)
  source.start()

  return source
}

function startTraining() {
  isTraining.value = true
  showResult.value = false
  phase.value = 'playing'
  digitSequence.value = generateDigitSequence()
  currentDigitIndex.value = 0
  userInput.value = ''

  trainingStore.startTraining('audio')

  // 播放音频序列
  playAudioSequence()
}

function playAudioSequence() {
  currentDigitIndex.value = 0

  // 启动背景噪音
  const backgroundSource = playBackgroundNoise()

  const interval = 1500 // 每个数字间隔1.5秒

  // 播放第一个数字
  playDigitSound(digitSequence.value[0])
  currentDigitIndex.value = 1

  playTimer = setInterval(() => {
    if (currentDigitIndex.value < digitSequence.value.length) {
      playDigitSound(digitSequence.value[currentDigitIndex.value])
      currentDigitIndex.value++
    } else {
      clearInterval(playTimer)
      playTimer = null

      // 停止背景噪音
      backgroundSource.stop()

      // 播放完成，进入输入阶段
      setTimeout(() => {
        phase.value = 'input'
      }, 1000)
    }
  }, interval)
}

function playAgain() {
  phase.value = 'playing'
  currentDigitIndex.value = 0
  playAudioSequence()
}

function addDigit(num) {
  // 计算当前已输入的数字数量
  const currentDigits = userInput.value
    .trim()
    .split(/\s+/)
    .filter(d => d !== '')

  // 如果已达到限制，不允许继续输入
  if (currentDigits.length >= digitSequence.value.length) {
    return
  }

  if (userInput.value && !userInput.value.endsWith(' ')) {
    userInput.value += ' '
  }
  userInput.value += num
}

function addSpace() {
  // 计算当前已输入的数字数量
  const currentDigits = userInput.value
    .trim()
    .split(/\s+/)
    .filter(d => d !== '')

  // 如果已达到限制，不允许继续输入空格
  if (currentDigits.length >= digitSequence.value.length) {
    return
  }

  if (userInput.value && !userInput.value.endsWith(' ')) {
    userInput.value += ' '
  }
}

function deleteDigit() {
  userInput.value = userInput.value.slice(0, -1)
}

function submitAnswer() {
  if (!userInput.value.trim()) return

  // 解析用户输入
  userDigits.value = userInput.value
    .trim()
    .split(/\s+/)
    .map(d => parseInt(d))
    .filter(d => !isNaN(d))

  // 计算正确数字数量（不考虑顺序）
  let correctCount = 0
  const digitsCopy = [...digitSequence.value]

  for (const digit of userDigits.value) {
    const index = digitsCopy.indexOf(digit)
    if (index !== -1) {
      correctCount++
      digitsCopy.splice(index, 1)
    }
  }

  correctDigits.value = correctCount

  // 计算顺序正确的数量
  let orderCount = 0
  const minLength = Math.min(userDigits.value.length, digitSequence.value.length)

  for (let i = 0; i < minLength; i++) {
    if (userDigits.value[i] === digitSequence.value[i]) {
      orderCount++
    }
  }

  correctOrder.value = orderCount
  accuracy.value = orderCount / digitSequence.value.length

  endTraining()
}

function endTraining() {
  isTraining.value = false
  showResult.value = true

  trainingStore.endTraining()

  // 保存训练记录
  const score = Math.round(accuracy.value * 100)
  userStore.addTrainingRecord({
    moduleName: 'audio',
    difficulty: `SNR ${signalNoiseRatio.value}%`,
    score,
    duration: digitSequence.value.length * 1500,
    accuracy: accuracy.value,
    details: {
      snr: signalNoiseRatio.value,
      backgroundType: backgroundType.value,
      digitCount: digitSequence.value.length,
      correctDigits: correctDigits.value,
      correctOrder: correctOrder.value
    }
  })
}

function resetTraining() {
  showResult.value = false
  isTraining.value = false
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}

function goBack() {
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  router.back()
}

onUnmounted(() => {
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
})
</script>

<style lang="scss" scoped>
.audio-page {
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

  .back-button {
    @include button-reset;
    @include click-feedback;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;
    @include flex-center;
    position: absolute;
    left: $spacing-lg;
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

  .config-hint {
    margin-top: $spacing-sm;
    font-size: $font-sm;
    color: $text-secondary;
    text-align: center;
  }
}

.button-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;

  .snr-button {
    @include button-reset;
    @include click-feedback;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-medium;
    transition: all $transition-base;

    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: $accent-primary;
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
    }

    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(0, 212, 255, 0.3);
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

.training-screen {
  flex: 1;
  @include flex-center;
  padding: calc($spacing-lg + 60px) $spacing-lg $spacing-lg;
  overflow-y: auto;
  @include custom-scrollbar;
}

.audio-visual {
  text-align: center;

  .sound-wave {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    height: 150px;
    margin-bottom: $spacing-xl;

    .wave-bar {
      width: 8px;
      background: linear-gradient(180deg, $accent-primary, $accent-secondary);
      border-radius: $radius-full;
      animation: wave 1s ease-in-out infinite;
    }
  }

  .audio-hint {
    font-size: $font-xl;
    margin-bottom: $spacing-md;
  }

  .progress-text {
    font-size: $font-2xl;
    font-weight: $font-bold;
    color: $accent-primary;
  }
}

@keyframes wave {
  0%,
  100% {
    height: 20px;
  }
  50% {
    height: 100px;
  }
}

.input-section {
  @include glass-card;
  padding: $spacing-2xl;
  max-width: 600px;
  width: 100%;

  h3 {
    text-align: center;
    margin-bottom: $spacing-sm;
  }

  .input-hint {
    text-align: center;
    color: $text-secondary;
    margin-bottom: $spacing-xl;
  }

  .input-wrapper {
    position: relative;
    margin-bottom: $spacing-lg;
  }

  .digit-input {
    width: 100%;
    padding: $spacing-lg;
    padding-right: 80px;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-size: $font-xl;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $accent-primary;
    }
  }

  .input-counter {
    position: absolute;
    right: $spacing-md;
    top: 50%;
    transform: translateY(-50%);
    font-size: $font-sm;
    font-weight: $font-bold;
    color: $accent-primary;
    background: rgba(0, 212, 255, 0.1);
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    transition: all $transition-base;

    &.limit-reached {
      color: $accent-warning;
      background: rgba(255, 170, 0, 0.2);
    }
  }

  .number-pad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-sm;
    margin-bottom: $spacing-xl;

    .num-button {
      @include button-reset;
      @include click-feedback;
      padding: $spacing-lg;
      border-radius: $radius-md;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: $text-primary;
      font-size: $font-lg;
      font-weight: $font-medium;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      &.space-button,
      &.delete-button {
        font-size: $font-sm;
      }
    }
  }

  .input-actions {
    display: flex;
    gap: $spacing-md;

    button {
      @include button-reset;
      @include click-feedback;
      flex: 1;
      padding: $spacing-lg;
      border-radius: $radius-md;
      font-weight: $font-medium;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .secondary-button {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: $text-primary;
    }

    .primary-button {
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      color: $text-primary;
    }
  }
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

  &.partial {
    background: rgba(255, 170, 0, 0.2);
    color: $accent-warning;
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
      font-size: $font-xl;
      font-weight: $font-bold;
      color: $accent-primary;
    }
  }
}

.answer-comparison {
  @include glass-card;
  padding: $spacing-lg;
  margin: $spacing-xl 0;

  @media (max-width: $breakpoint-sm) {
    padding: $spacing-lg $spacing-md;
  }

  .answer-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    font-size: $font-base;

    @media (max-width: $breakpoint-sm) {
      gap: $spacing-xs;
      margin-bottom: $spacing-sm;
      font-size: $font-sm;
    }

    &:last-child {
      margin-bottom: 0;
    }

    .answer-label {
      color: $text-secondary;
      flex-shrink: 0;
      white-space: nowrap;
      min-width: 100px;

      @media (max-width: $breakpoint-sm) {
        min-width: auto;
      }
    }

    .answer-value {
      color: $accent-primary;
      font-weight: $font-bold;
      font-family: 'Courier New', Consolas, monospace;
      letter-spacing: 0.15em;
      white-space: nowrap;
      overflow-x: auto;
      flex: 1;

      @media (max-width: $breakpoint-sm) {
        font-size: $font-sm;
      }
    }
  }
}

.result-actions {
  display: flex;
  gap: $spacing-md;

  @media (max-width: $breakpoint-sm) {
    gap: $spacing-sm;
  }

  button {
    @include button-reset;
    @include click-feedback;
    flex: 1;
    padding: $spacing-lg;
    border-radius: $radius-md;
    font-weight: $font-medium;
    transition: all $transition-base;

    @media (max-width: $breakpoint-sm) {
      padding: $spacing-md $spacing-lg;
      font-size: $font-sm;
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
