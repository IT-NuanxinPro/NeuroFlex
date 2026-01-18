// 安全的本地存储工具

const USER_DATA_KEY = 'neuroflex_user_data'

/**
 * 保存用户数据，确保一定能保存住
 * @param {object} data - 用户数据
 * @returns {object} - {success: boolean, warning?: string}
 */
export function saveUserData(data) {
  try {
    // 首先验证数据格式
    if (!data || typeof data !== 'object') {
      throw new Error('数据格式错误')
    }

    // 序列化数据
    const json = JSON.stringify(data)

    // 尝试保存
    localStorage.setItem(USER_DATA_KEY, json)

    // 验证保存是否成功
    const saved = localStorage.getItem(USER_DATA_KEY)
    if (!saved || saved !== json) {
      throw new Error('保存验证失败')
    }

    return { success: true }
  } catch (error) {
    console.error('保存用户数据失败:', error)

    // 存储空间不足的处理
    if (
      error.name === 'QuotaExceededError' ||
      error.code === 22 ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ) {
      console.warn('存储空间不足，尝试优化数据')

      // 第一次尝试：只保留最近50条记录
      try {
        const optimized = { ...data }
        if (optimized.trainingHistory && optimized.trainingHistory.length > 50) {
          optimized.trainingHistory = optimized.trainingHistory.slice(0, 50)
        }

        const optimizedJson = JSON.stringify(optimized)
        localStorage.setItem(USER_DATA_KEY, optimizedJson)

        const savedOptimized = localStorage.getItem(USER_DATA_KEY)
        if (savedOptimized === optimizedJson) {
          // 更新传入的数据，保持同步
          if (data.trainingHistory) {
            data.trainingHistory = optimized.trainingHistory
          }

          return {
            success: true,
            warning: '存储空间不足，已自动优化，只保留最近50条记录'
          }
        }
      } catch (retryError) {
        console.error('优化数据后仍然保存失败:', retryError)
      }

      // 第二次尝试：清空其他数据，只保留用户数据
      try {
        const allKeys = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key !== USER_DATA_KEY) {
            allKeys.push(key)
          }
        }

        allKeys.forEach(key => localStorage.removeItem(key))

        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data))

        return {
          success: true,
          warning: '已清空其他数据以保存用户数据'
        }
      } catch (clearError) {
        console.error('清空数据后仍然保存失败:', clearError)
      }
    }

    return { success: false, error: error.message }
  }
}

/**
 * 加载用户数据
 * @returns {object|null} - 用户数据或null
 */
export function loadUserData() {
  try {
    const json = localStorage.getItem(USER_DATA_KEY)
    if (!json) {
      return null
    }

    const data = JSON.parse(json)

    // 恢复Date对象
    if (data.profile) {
      if (data.profile.createdAt && typeof data.profile.createdAt === 'string') {
        data.profile.createdAt = new Date(data.profile.createdAt)
      }
      if (data.profile.lastLoginAt && typeof data.profile.lastLoginAt === 'string') {
        data.profile.lastLoginAt = new Date(data.profile.lastLoginAt)
      }
    }

    if (data.trainingHistory) {
      data.trainingHistory.forEach(record => {
        if (record.completedAt && typeof record.completedAt === 'string') {
          record.completedAt = new Date(record.completedAt)
        }
      })
    }

    return data
  } catch (error) {
    console.error('加载用户数据失败:', error)
    // 数据损坏时清空
    localStorage.removeItem(USER_DATA_KEY)
    return null
  }
}

/**
 * 保存数据到 localStorage
 * @param {string} key - 存储键
 * @param {any} data - 要存储的数据
 * @returns {boolean} - 是否成功
 */
export function saveToStorage(key, data) {
  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error(`存储失败 [${key}]:`, error)

    // 检查是否是存储空间不足
    if (error.name === 'QuotaExceededError') {
      console.warn('存储空间不足，请清理数据')
    }

    return false
  }
}

/**
 * 从 localStorage 读取数据
 * @param {string} key - 存储键
 * @param {any} defaultValue - 默认值
 * @returns {any} - 读取的数据或默认值
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue
    }
    return JSON.parse(item)
  } catch (error) {
    console.error(`读取失败 [${key}]:`, error)
    return defaultValue
  }
}

/**
 * 删除 localStorage 中的数据
 * @param {string} key - 存储键
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`删除失败 [${key}]:`, error)
    return false
  }
}

/**
 * 清空所有 localStorage 数据
 */
export function clearStorage() {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('清空存储失败:', error)
    return false
  }
}

/**
 * 获取存储空间使用情况
 * @returns {object} - 使用情况信息
 */
export function getStorageInfo() {
  try {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }

    // 估算的最大存储空间（通常是 5-10MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    const usedSize = total * 2 // UTF-16 编码，每个字符 2 字节
    const percentage = ((usedSize / maxSize) * 100).toFixed(2)

    return {
      used: usedSize,
      usedMB: (usedSize / 1024 / 1024).toFixed(2),
      max: maxSize,
      percentage: parseFloat(percentage),
      available: maxSize - usedSize
    }
  } catch (error) {
    console.error('获取存储信息失败:', error)
    return null
  }
}

/**
 * 检查存储空间是否充足
 * @param {number} requiredSize - 需要的空间大小（字节）
 * @returns {boolean} - 是否充足
 */
export function hasEnoughSpace(requiredSize) {
  const info = getStorageInfo()
  if (!info) return false
  return info.available >= requiredSize
}

/**
 * 导出数据为JSON文件
 * @param {string} filename - 文件名
 */
export function downloadData(filename = 'neuroflex-backup.json') {
  try {
    const json = localStorage.getItem(USER_DATA_KEY)
    if (!json) {
      console.warn('没有数据可导出')
      return false
    }

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('导出数据失败:', error)
    return false
  }
}
