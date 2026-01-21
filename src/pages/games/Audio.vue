<template>
  <div class="audio-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="page-title">听觉选择性注意</h1>
      <button v-if="!isTraining" class="help-button" @click="showGuide = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="2" />
          <path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span>规则</span>
      </button>
    </header>

    <!-- 游戏说明弹窗 -->
    <GameGuide
      :visible="showGuide"
      title="听觉选择性注意"
      :how-to-play="guideContent.howToPlay"
      :benefits="guideContent.benefits"
      :tips="guideContent.tips"
      @close="showGuide = false"
    />

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
      <!-- 倒计时遮罩层 -->
      <GameCountdown
        :current-count="countdown.currentCount.value"
        :progress="countdown.progress.value"
        :is-visible="countdown.isCountingDown.value"
      />

      <div class="audio-visual" :class="{ disabled: isGameDisabled }">
        <div class="sound-wave">
          <div
            v-for="i in 20"
            :key="i"
            class="wave-bar"
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
        <h3>请输入听到的数字序列</h3>
        <p class="input-hint">按顺序输入，用空格分隔</p>

        <div class="input-wrapper">
          <input
            v-model="userInput"
            type="text"
            class="digit-input"
            placeholder="例如: 1 5 3 7 2"
            readonly
            @keyup.enter="submitAnswer"
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
          <button class="num-button action-button" @click="addSpace">空格</button>
          <button class="num-button action-button" @click="deleteDigit">删除</button>
        </div>

        <div class="input-actions">
          <button class="secondary-button" @click="playAgain">重新播放</button>
          <button class="primary-button" :disabled="!userInput.trim()" @click="submitAnswer">
            提交答案
          </button>
        </div>
      </div>
    </div>

    <!-- 结果弹窗 -->
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
import { ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTrainingStore } from '@/stores/training'
import { useGameCountdown } from '@/composables/useGameCountdown'
import { isNativeApp } from '@/utils/device'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import ButtonGroupSelect from '@/components/ButtonGroupSelect.vue'
import GameCountdown from '@/components/GameCountdown.vue'
import GameGuide from '@/components/GameGuide.vue'
import GameResult from '@/components/GameResult.vue'
import { backgroundOptions, digitCountOptions, snrOptions } from '@/config/audio.js'

const router = useRouter()
const userStore = useUserStore()
const trainingStore = useTrainingStore()

// 配置
const signalNoiseRatio = ref(snrOptions[0])
const backgroundType = ref('white')
const digitCount = ref('6')

// 游戏说明
const showGuide = ref(false)
const guideContent = {
  howToPlay: `
    <p>在<strong>背景噪音</strong>中仔细聆听数字序列，然后按顺序输入。</p>
    <ul>
      <li>选择难度等级（背景噪音强度）</li>
      <li>选择数字数量（4-8个）</li>
      <li>倒计时后开始播放数字</li>
      <li>播放完成后，按顺序输入听到的数字</li>
      <li>可以重新播放一次</li>
    </ul>
  `,
  benefits: `
    <p>听觉选择性注意训练可以有效提升：</p>
    <ul>
      <li><strong>听觉注意力</strong> - 在干扰环境中聚焦关键信息</li>
      <li><strong>听觉记忆</strong> - 短期记忆和序列记忆能力</li>
      <li><strong>抗干扰能力</strong> - 过滤背景噪音的能力</li>
      <li><strong>信息处理速度</strong> - 快速识别和记忆听觉信息</li>
    </ul>
  `,
  tips: `
    <p>训练技巧：</p>
    <ul>
      <li>从<em>简单难度</em>开始，逐步增加噪音强度</li>
      <li>专注于数字的声音，忽略背景噪音</li>
      <li>可以在脑海中重复数字来加强记忆</li>
      <li>建议在安静环境中训练，戴耳机效果更佳</li>
    </ul>
  `
}

// 游戏状态
const gameState = ref('idle') // 'idle' | 'countdown' | 'active' | 'completed'
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

// 计算游戏是否被禁用（倒计时期间）
const isGameDisabled = computed(() => {
  return gameState.value === 'countdown'
})

// 结果弹窗相关
const resultType = computed(() => (accuracy.value >= 0.8 ? 'success' : 'warning'))

const resultTitle = computed(() => (accuracy.value >= 0.8 ? '完成！' : '继续努力'))

const resultSubtitle = computed(() => {
  if (accuracy.value >= 0.9) {
    return '出色的听觉注意力！'
  } else if (accuracy.value >= 0.7) {
    return '继续练习！'
  }
  return '多加练习，你会做得更好！'
})

const resultStats = computed(() => {
  // 构建带颜色标记的用户答案
  let userAnswerDisplay = ''
  if (userDigits.value.length > 0) {
    userAnswerDisplay = userDigits.value.map((digit, index) => {
      const isCorrect = digit === digitSequence.value[index]
      const color = isCorrect ? '#00ff88' : '#ff3366'
      return `<span style="color: ${color}">${digit}</span>`
    }).join(' ')
  } else {
    userAnswerDisplay = '未输入'
  }
  
  return [
    { label: '正确数字', value: `${correctDigits.value}/${digitSequence.value.length}`, highlight: true },
    { label: '顺序正确', value: `${correctOrder.value}/${digitSequence.value.length}`, highlight: true },
    { label: '准确率', value: `${Math.round(accuracy.value * 100)}%`, highlight: false },
    { label: '难度', value: `SNR ${signalNoiseRatio.value}%`, highlight: false },
    { label: '正确答案', value: digitSequence.value.join(' '), highlight: false },
    { label: '你的答案', value: userAnswerDisplay, highlight: false, isHtml: true }
  ]
})

let audioContext = null
let playTimer = null
let backgroundGainNode = null
let backgroundSource = null

// 倒计时设置
const countdown = useGameCountdown({
  duration: 3,
  onComplete: startGame
})

// 初始化语音引擎
function initSpeechSynthesis() {
  return new Promise((resolve) => {
    if ('speechSynthesis' in window) {
      // 等待语音引擎加载
      let voices = window.speechSynthesis.getVoices()
      
      if (voices.length > 0) {
        resolve(voices)
      } else {
        // 监听语音引擎加载完成
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices()
          resolve(voices)
        }
        
        // 超时保护（2秒后无论如何都继续）
        setTimeout(() => {
          resolve(window.speechSynthesis.getVoices())
        }, 2000)
      }
    } else {
      console.warn('浏览器不支持 Web Speech API')
      resolve([])
    }
  })
}

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
    // 确保音频上下文在用户交互后恢复
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
  }
  return audioContext
}

function playDigitSound(digit) {
  const ctx = initAudioContext()

  // 临时降低背景噪音
  if (backgroundGainNode) {
    const originalGain = backgroundGainNode.gain.value
    backgroundGainNode.gain.setValueAtTime(originalGain * 0.2, ctx.currentTime)
    setTimeout(() => {
      if (backgroundGainNode) {
        backgroundGainNode.gain.setValueAtTime(originalGain, ctx.currentTime)
      }
    }, 800)
  }

  // 判断是否为原生 APP
  if (isNativeApp()) {
    // 使用 Capacitor Text-to-Speech
    TextToSpeech.speak({
      text: digit.toString(),
      lang: 'zh-CN',
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0,
      category: 'ambient'
    }).catch(error => {
      console.error('Capacitor TTS 播放错误:', error)
    })
  } else {
    // 使用 Web Speech API（浏览器环境）
    if ('speechSynthesis' in window) {
      // 先取消之前的语音（避免堆积）
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(digit.toString())
      utterance.lang = 'zh-CN'
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // 添加错误处理
      utterance.onerror = (event) => {
        console.error('语音播放错误:', event)
      }
      
      utterance.onstart = () => {
        console.log('开始播放数字:', digit)
      }

      // 确保语音引擎已加载
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        // 优先使用中文语音
        const zhVoice = voices.find(voice => voice.lang.includes('zh'))
        if (zhVoice) {
          utterance.voice = zhVoice
        }
      }

      window.speechSynthesis.speak(utterance)
    } else {
      console.warn('浏览器不支持 Web Speech API')
    }
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
  backgroundGainNode = gainNode
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
  // 用户交互后初始化音频上下文
  initAudioContext()
  
  // 初始化语音引擎
  initSpeechSynthesis().then(() => {
    console.log('语音引擎已准备就绪')
  })

  // 立即进入训练界面并生成数字序列
  isTraining.value = true
  showResult.value = false
  phase.value = 'playing'
  digitSequence.value = generateDigitSequence()
  currentDigitIndex.value = 0
  userInput.value = ''

  // 设置为倒计时状态
  gameState.value = 'countdown'

  // 启动倒计时
  countdown.start()
}

function startGame() {
  // 倒计时结束后，开始游戏
  gameState.value = 'active'

  trainingStore.startTraining('audio')

  // 播放音频序列
  playAudioSequence()
}

function playAudioSequence() {
  currentDigitIndex.value = 0

  // 启动背景噪音
  backgroundSource = playBackgroundNoise()

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
      if (backgroundSource) {
        backgroundSource.stop()
        backgroundSource = null
      }

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
  gameState.value = 'completed'

  trainingStore.endTraining()

  // 计算新的评分系统分数
  const score = calculateAudioScore()

  userStore.addTrainingRecord({
    moduleName: 'audio',
    difficulty: `SNR ${signalNoiseRatio.value}%`,
    score: Math.round(score),
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

function calculateAudioScore() {
  // 准确率分数 (70%) - 结合数字准确率和顺序准确率
  const digitAccuracy = correctDigits.value / digitSequence.value.length
  const orderAccuracy = correctOrder.value / digitSequence.value.length
  const accuracyScore = (digitAccuracy * 0.7 + orderAccuracy * 0.3) * 100

  // 抗噪能力分数 (20%) - 基于信噪比
  const noiseResistance = Math.min(100, (signalNoiseRatio.value / 40) * 100)

  // 反应速度分数 (10%) - 基于输入完成时间
  const standardInputTime = digitSequence.value.length * 2000 // 每个数字2秒
  const actualInputTime = digitSequence.value.length * 1500 // 实际播放间隔
  const speedRatio = standardInputTime / actualInputTime
  const speedScore = Math.min(100, speedRatio * 100)

  // 最终分数
  const finalScore = accuracyScore * 0.7 + noiseResistance * 0.2 + speedScore * 0.1
  return Math.max(0, Math.min(100, finalScore))
}

function resetTraining() {
  showResult.value = false
  isTraining.value = false
  gameState.value = 'idle'
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}

function handleRetry() {
  showResult.value = false
  resetTraining()
  startTraining()
}

function handleClose() {
  showResult.value = false
  goBack()
}

function goBack() {
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
  if (backgroundSource) {
    backgroundSource.stop()
    backgroundSource = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  
  // 停止语音播放
  if (isNativeApp()) {
    TextToSpeech.stop().catch(error => {
      console.error('停止 TTS 错误:', error)
    })
  } else if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  
  // 清理倒计时
  countdown.cleanup()
  router.back()
}

onUnmounted(() => {
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
  if (backgroundSource) {
    backgroundSource.stop()
    backgroundSource = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  
  // 停止语音播放
  if (isNativeApp()) {
    TextToSpeech.stop().catch(error => {
      console.error('停止 TTS 错误:', error)
    })
  } else if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  
  // 清理倒计时
  countdown.cleanup()
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md $spacing-lg;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: fixed;
  top: env(safe-area-inset-top, 0px);
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

  .help-button {
    @include button-reset;
    @include click-feedback;
    height: 40px;
    padding: 0 $spacing-md;
    border-radius: $radius-full;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: $accent-primary;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    position: absolute;
    right: $spacing-lg;
    transition: all $transition-base;
    font-size: $font-sm;
    font-weight: $font-medium;

    &:hover {
      background: rgba(0, 212, 255, 0.2);
      border-color: $accent-primary;
      transform: scale(1.05);
    }

    svg {
      flex-shrink: 0;
    }

    span {
      white-space: nowrap;
    }
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
  @include button-grid(80px);

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
    @include mobile {
      padding: $spacing-sm;
    }

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

  @include mobile {
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: calc($spacing-md + 60px) $spacing-lg $spacing-lg;
  overflow: hidden;
  position: relative;
  min-height: 0;
  gap: $spacing-md;

  @include mobile {
    padding: calc($spacing-md + 60px) $spacing-md $spacing-md;
  }
}

.audio-visual {
  text-align: center;
  transition: opacity 0.3s ease;
  flex-shrink: 0;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .sound-wave {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    height: clamp(80px, 15vh, 120px);
    margin-bottom: $spacing-lg;

    .wave-bar {
      width: 6px;
      background: linear-gradient(180deg, $accent-primary, $accent-secondary);
      border-radius: $radius-full;
      animation: wave 1s ease-in-out infinite;
    }
  }

  .audio-hint {
    font-size: clamp($font-base, 3vw, $font-xl);
    margin-bottom: $spacing-sm;
  }

  .progress-text {
    font-size: clamp($font-xl, 4vw, $font-2xl);
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
  flex-shrink: 0;
  padding: $spacing-xl $spacing-lg;
  max-width: 500px;
  width: 100%;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  @include custom-scrollbar;

  @include mobile {
    padding: $spacing-lg $spacing-md;
    max-width: 95vw;
  }

  h3 {
    text-align: center;
    margin: 0 0 $spacing-xs;
    font-size: $font-lg;
    font-weight: $font-semibold;

    @include mobile {
      font-size: $font-base;
    }
  }

  .input-hint {
    text-align: center;
    color: $text-secondary;
    margin: 0 0 $spacing-lg;
    font-size: $font-sm;

    @include mobile {
      font-size: $font-xs;
      margin-bottom: $spacing-md;
    }
  }

  .input-wrapper {
    position: relative;
    margin-bottom: $spacing-lg;

    @include mobile {
      margin-bottom: $spacing-md;
    }
  }

  .digit-input {
    width: 100%;
    padding: $spacing-md $spacing-lg;
    padding-right: 70px;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-size: $font-lg;
    text-align: center;
    font-family: 'Courier New', Consolas, monospace;
    letter-spacing: 0.1em;
    transition: all $transition-base;

    @include mobile {
      padding: $spacing-sm $spacing-md;
      padding-right: 60px;
      font-size: $font-base;
    }

    &:focus {
      outline: none;
      border-color: $accent-primary;
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: normal;
    }
  }

  .input-counter {
    position: absolute;
    right: $spacing-md;
    top: 50%;
    transform: translateY(-50%);
    font-size: $font-xs;
    font-weight: $font-bold;
    color: $accent-primary;
    background: rgba(0, 212, 255, 0.1);
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    transition: all $transition-base;
    white-space: nowrap;

    @include mobile {
      right: $spacing-sm;
      font-size: 10px;
      padding: 2px $spacing-xs;
    }

    &.limit-reached {
      color: $accent-warning;
      background: rgba(255, 170, 0, 0.2);
    }
  }

  .number-pad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-sm;
    margin-bottom: $spacing-lg;

    @include mobile {
      gap: $spacing-xs;
      margin-bottom: $spacing-md;
    }

    .num-button {
      @include button-reset;
      @include click-feedback;
      aspect-ratio: 1;
      border-radius: $radius-md;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: $text-primary;
      font-size: $font-xl;
      font-weight: $font-semibold;
      transition: all $transition-base;
      @include flex-center;

      @include mobile {
        font-size: $font-lg;
        border-radius: $radius-sm;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(0, 212, 255, 0.3);
      }

      &:active {
        background: rgba(0, 212, 255, 0.2);
        transform: scale(0.95);
      }

      &.action-button {
        font-size: $font-sm;
        font-weight: $font-medium;

        @include mobile {
          font-size: $font-xs;
        }
      }
    }
  }

  .input-actions {
    display: flex;
    gap: $spacing-sm;

    @include mobile {
      gap: $spacing-xs;
    }

    button {
      @include button-reset;
      @include click-feedback;
      flex: 1;
      padding: $spacing-md;
      border-radius: $radius-md;
      font-weight: $font-semibold;
      font-size: $font-base;
      transition: all $transition-base;

      @include mobile {
        padding: $spacing-sm;
        font-size: $font-sm;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .secondary-button {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: $text-primary;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .primary-button {
      background: linear-gradient(135deg, $accent-primary, $accent-secondary);
      color: $text-primary;
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);

      &:hover:not(:disabled) {
        box-shadow: 0 6px 16px rgba(0, 212, 255, 0.4);
      }
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

  @include mobile {
    padding: $spacing-lg $spacing-md;
  }

  .answer-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    font-size: $font-base;

    @include mobile {
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

      @include mobile {
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

      @include mobile {
        font-size: $font-sm;
      }
    }
  }
}

.result-actions {
  display: flex;
  gap: $spacing-md;

  @include mobile {
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

    @include mobile {
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
