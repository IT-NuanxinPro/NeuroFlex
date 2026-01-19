/**
 * 配置中心 - 统一管理所有游戏模块配置
 *
 * 职责：
 * 1. 集中导出所有游戏配置
 * 2. 提供统一的配置访问接口
 * 3. 配置验证和默认值管理
 */

import * as schulteConfig from './schulte.js'
import * as stroopConfig from './stroop.js'
import * as sequenceConfig from './sequence.js'
import * as audioConfig from './audio.js'
import * as mirrorConfig from './mirror.js'
import * as categorizeConfig from './categorize.js'
import * as memoryStoryConfig from './memoryStory.js'

// 游戏模块配置映射
export const gameConfigs = {
  schulte: schulteConfig,
  stroop: stroopConfig,
  sequence: sequenceConfig,
  audio: audioConfig,
  mirror: mirrorConfig,
  categorize: categorizeConfig,
  memoryStory: memoryStoryConfig
}

// 游戏模块元信息
export const gameMetadata = {
  schulte: {
    name: '舒尔特方格',
    description: '提升视觉搜索和注意力集中能力',
    icon: '🔢',
    route: '/schulte'
  },
  stroop: {
    name: 'Stroop 训练',
    description: '增强认知控制和抑制干扰能力',
    icon: '🎨',
    route: '/stroop'
  },
  sequence: {
    name: '序列工作记忆',
    description: '训练短期记忆和序列处理能力',
    icon: '🧠',
    route: '/sequence'
  },
  audio: {
    name: '听觉选择性注意',
    description: '提升听觉注意力和抗干扰能力',
    icon: '🎧',
    route: '/audio'
  },
  mirror: {
    name: '双侧肢体镜像协调',
    description: '训练双侧协调和空间感知能力',
    icon: '🪞',
    route: '/mirror'
  },
  categorize: {
    name: '规则导向分类',
    description: '增强分类思维和规则切换能力',
    icon: '📊',
    route: '/categorize'
  },
  memoryStory: {
    name: '情景联想记忆',
    description: '提升情景记忆和联想能力',
    icon: '📖',
    route: '/memory-story'
  }
}

/**
 * 获取指定游戏的配置
 * @param {string} moduleName - 游戏模块名称
 * @returns {object} 游戏配置对象
 */
export function getGameConfig(moduleName) {
  const config = gameConfigs[moduleName]
  if (!config) {
    console.warn(`未找到游戏配置: ${moduleName}`)
    return {}
  }
  return config
}

/**
 * 获取指定游戏的元信息
 * @param {string} moduleName - 游戏模块名称
 * @returns {object} 游戏元信息
 */
export function getGameMetadata(moduleName) {
  const metadata = gameMetadata[moduleName]
  if (!metadata) {
    console.warn(`未找到游戏元信息: ${moduleName}`)
    return {
      name: moduleName,
      description: '',
      icon: '🎮',
      route: `/${moduleName}`
    }
  }
  return metadata
}

/**
 * 获取所有游戏模块列表
 * @returns {Array} 游戏模块名称数组
 */
export function getAllGameModules() {
  return Object.keys(gameConfigs)
}

/**
 * 验证游戏配置是否有效
 * @param {string} moduleName - 游戏模块名称
 * @returns {boolean} 配置是否有效
 */
export function isValidGameModule(moduleName) {
  return moduleName in gameConfigs
}

// 导出所有配置供直接使用
export {
  schulteConfig,
  stroopConfig,
  sequenceConfig,
  audioConfig,
  mirrorConfig,
  categorizeConfig,
  memoryStoryConfig
}
