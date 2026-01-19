import gsap from 'gsap'

// 检查动画是否启用
function isAnimationEnabled() {
  try {
    const config = localStorage.getItem('neuroflex_app_config')
    if (config) {
      const parsed = JSON.parse(config)
      return parsed.animationEnabled !== false
    }
  } catch (error) {
    console.error('读取动画配置失败:', error)
  }
  return true // 默认启用
}

// 条件执行动画
function conditionalAnimate(animationFn) {
  if (!isAnimationEnabled()) {
    return null // 不执行动画
  }
  return animationFn()
}

// 页面切换动画
export function pageTransition(element, direction = 'in') {
  return conditionalAnimate(() => {
    if (direction === 'in') {
      return gsap.fromTo(
        element,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
      )
    } else {
      return gsap.to(element, {
        opacity: 0,
        x: -20,
        duration: 0.3,
        ease: 'power2.in'
      })
    }
  })
}

// 按钮点击反馈动画
export function buttonClickFeedback(element) {
  return conditionalAnimate(() => {
    return gsap.to(element, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    })
  })
}

// 正确答案反馈 - 绿色光晕扩散
export function correctFeedback(element) {
  return conditionalAnimate(() => {
    const tl = gsap.timeline()

    tl.to(element, {
      boxShadow: '0 0 0 0 rgba(0, 255, 136, 0.7)',
      duration: 0
    })
      .to(element, {
        boxShadow: '0 0 30px 15px rgba(0, 255, 136, 0)',
        duration: 0.6,
        ease: 'power2.out'
      })
      .to(
        element,
        {
          scale: 1.05,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        },
        0
      )

    return tl
  })
}

// 错误答案反馈 - 红色震动
export function errorFeedback(element) {
  return conditionalAnimate(() => {
    return gsap.to(element, {
      x: [-10, 10, -5, 5, 0],
      duration: 0.4,
      ease: 'power2.inOut',
      onStart: () => {
        gsap.to(element, {
          boxShadow: '0 0 20px 5px rgba(255, 51, 102, 0.5)',
          duration: 0.2,
          yoyo: true,
          repeat: 1
        })
      }
    })
  })
}

// 交错淡入动画（用于卡片列表）
export function staggerFadeIn(elements, options = {}) {
  return conditionalAnimate(() => {
    const defaults = {
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      from: { opacity: 0, y: 20 }
    }

    const config = { ...defaults, ...options }

    return gsap.fromTo(elements, config.from, {
      opacity: 1,
      y: 0,
      duration: config.duration,
      stagger: config.stagger,
      ease: config.ease
    })
  })
}

// 数字点亮动画（舒尔特方格）
export function numberHighlight(element) {
  return conditionalAnimate(() => {
    const tl = gsap.timeline()

    tl.to(element, {
      scale: 1.2,
      backgroundColor: 'rgba(0, 212, 255, 0.3)',
      duration: 0.2,
      ease: 'power2.out'
    }).to(element, {
      scale: 1,
      backgroundColor: 'transparent',
      duration: 0.2,
      ease: 'power2.in'
    })

    return tl
  })
}

// 倒计时脉冲动画
export function countdownPulse(element) {
  return conditionalAnimate(() => {
    return gsap.to(element, {
      scale: 1.1,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: 'power2.inOut'
    })
  })
}

// 加载动画
export function loadingSpinner(element) {
  return conditionalAnimate(() => {
    return gsap.to(element, {
      rotation: 360,
      duration: 1,
      repeat: -1,
      ease: 'linear'
    })
  })
}

// 模态框弹出动画
export function modalPopup(element) {
  return conditionalAnimate(() => {
    const tl = gsap.timeline()

    tl.fromTo(
      element,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
    )

    return tl
  })
}

// 模态框关闭动画
export function modalClose(element) {
  return conditionalAnimate(() => {
    return gsap.to(element, {
      scale: 0.8,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    })
  })
}

// 进度条动画
export function progressBar(element, progress) {
  return conditionalAnimate(() => {
    return gsap.to(element, {
      width: `${progress}%`,
      duration: 0.5,
      ease: 'power2.out'
    })
  })
}

// 悬停提升效果
export function hoverLift(element, isHovering) {
  return conditionalAnimate(() => {
    if (isHovering) {
      return gsap.to(element, {
        y: -4,
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
        duration: 0.3,
        ease: 'power2.out'
      })
    } else {
      return gsap.to(element, {
        y: 0,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        duration: 0.3,
        ease: 'power2.out'
      })
    }
  })
}

// 清除所有动画
export function killAllAnimations() {
  gsap.killTweensOf('*')
}

// 导出配置检查函数供外部使用
export { isAnimationEnabled }
