<script setup>
import { onMounted, ref } from 'vue'

const emit = defineEmits(['complete'])

const show = ref(true)
const logoAnimated = ref(false)
const textAnimated = ref(false)
const subtitleAnimated = ref(false)
const fadeOut = ref(false)

onMounted(() => {
  // 动画序列
  setTimeout(() => {
    logoAnimated.value = true
  }, 100)

  setTimeout(() => {
    textAnimated.value = true
  }, 400)

  setTimeout(() => {
    subtitleAnimated.value = true
  }, 700)

  // 开始淡出
  setTimeout(() => {
    fadeOut.value = true
  }, 2000)

  // 完成
  setTimeout(() => {
    show.value = false
    emit('complete')
  }, 2500)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="splash-fade">
      <div v-if="show" class="app-splash" :class="{ 'fade-out': fadeOut }">
        <!-- 背景动画粒子 -->
        <div class="splash-particles">
          <div v-for="i in 15" :key="i" class="particle" :style="{ '--delay': `${i * 0.15}s`, '--x': `${Math.random() * 100}%`, '--duration': `${3 + Math.random() * 2}s` }" />
        </div>

        <!-- 神经网络背景 -->
        <div class="neural-network">
          <div v-for="i in 8" :key="i" class="neural-node" :style="{ '--node-delay': `${i * 0.2}s`, '--x': `${20 + Math.random() * 60}%`, '--y': `${20 + Math.random() * 60}%` }" />
        </div>

        <!-- 光晕效果 -->
        <div class="splash-glow" />

        <!-- 主内容 -->
        <div class="splash-content">
          <!-- Logo -->
          <div class="splash-logo" :class="{ animated: logoAnimated }">
            <div class="logo-ring" />
            <div class="logo-ring ring-2" />
            <div class="logo-ring ring-3" />
            <img src="/icon-512x512.png" alt="NeuroFlex Logo" class="logo-image">
          </div>

          <!-- 标题 -->
          <h1 class="splash-title" :class="{ animated: textAnimated }">
            <span v-for="(char, index) in 'NeuroFlex'" :key="index" class="char" :style="{ '--char-delay': `${index * 0.05}s` }">
              {{ char }}
            </span>
          </h1>

          <!-- 副标题 -->
          <p class="splash-subtitle" :class="{ animated: subtitleAnimated }">
            科学认知训练 · 提升大脑潜能
          </p>

          <!-- 加载指示器 -->
          <div class="splash-loader" :class="{ animated: subtitleAnimated }">
            <div class="loader-dot" />
            <div class="loader-dot" />
            <div class="loader-dot" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.app-splash {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 30%, #16213e 70%, #0f0f1e 100%);
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
  overflow: hidden;

  &.fade-out {
    animation: splashFadeOut 0.5s ease forwards;
  }
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes splashFadeOut {
  to {
    opacity: 0;
    transform: scale(1.05);
  }
}

// 粒子背景
.splash-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(0, 212, 255, 0.6);
  border-radius: 50%;
  left: var(--x);
  bottom: -10px;
  animation: particleFloat var(--duration) ease-in-out infinite;
  animation-delay: var(--delay);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

@keyframes particleFloat {
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(0.3);
    opacity: 0;
  }
}

// 神经网络背景
.neural-network {
  position: absolute;
  inset: 0;
}

.neural-node {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(0, 212, 255, 0.4);
  border-radius: 50%;
  left: var(--x);
  top: var(--y);
  animation: neuralPulse 2s ease-in-out infinite;
  animation-delay: var(--node-delay);
  
  &::before {
    content: '';
    position: absolute;
    inset: -8px;
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: 50%;
    animation: neuralRipple 2s ease-in-out infinite;
    animation-delay: var(--node-delay);
  }
}

@keyframes neuralPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.8;
  }
}

@keyframes neuralRipple {
  0%, 100% {
    transform: scale(1);
    opacity: 0.2;
  }
  50% {
    transform: scale(2);
    opacity: 0;
  }
}

// 光晕
.splash-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.6;
  }
}

// 主内容
.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

// Logo
.splash-logo {
  position: relative;
  width: 140px;
  height: 140px;
  margin-bottom: 40px;
  opacity: 0;
  transform: scale(0.3) rotate(-15deg);
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.animated {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.logo-ring {
  position: absolute;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 50%;
  animation: ringRotate 4s linear infinite;

  &:nth-child(1) {
    inset: -15px;
    border-color: rgba(0, 212, 255, 0.4);
  }

  &.ring-2 {
    inset: -25px;
    border-color: rgba(0, 212, 255, 0.25);
    animation-direction: reverse;
    animation-duration: 6s;
  }

  &.ring-3 {
    inset: -35px;
    border-color: rgba(0, 212, 255, 0.15);
    animation-duration: 8s;
  }
}

@keyframes ringRotate {
  to {
    transform: rotate(360deg);
  }
}

.logo-image {
  width: 100%;
  height: 100%;
  border-radius: 32px;
  box-shadow: 
    0 0 40px rgba(0, 212, 255, 0.3),
    0 20px 60px rgba(0, 0, 0, 0.4);
  filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.2));
}

// 标题
.splash-title {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  display: flex;
  letter-spacing: 2px;

  .char {
    opacity: 0;
    transform: translateY(30px) rotateX(90deg);
    display: inline-block;
  }

  &.animated .char {
    animation: charReveal 0.6s ease forwards;
    animation-delay: var(--char-delay);
  }
}

@keyframes charReveal {
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0deg);
  }
}

// 副标题
.splash-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 50px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease;
  text-align: center;
  letter-spacing: 1px;

  &.animated {
    opacity: 1;
    transform: translateY(0);
  }
}

// 加载指示器
.splash-loader {
  display: flex;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.4s ease;

  &.animated {
    opacity: 1;
  }
}

.loader-dot {
  width: 10px;
  height: 10px;
  background: rgba(0, 212, 255, 0.8);
  border-radius: 50%;
  animation: dotBounce 1.6s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);

  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes dotBounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

// 淡出动画
.splash-fade-leave-active {
  transition: opacity 0.5s ease;
}

.splash-fade-leave-to {
  opacity: 0;
}

// 移动端适配
@media (max-width: 768px) {
  .splash-logo {
    width: 120px;
    height: 120px;
    margin-bottom: 32px;
  }

  .splash-title {
    font-size: 28px;
    margin-bottom: 12px;
  }

  .splash-subtitle {
    font-size: 14px;
    margin-bottom: 40px;
  }
}
</style>