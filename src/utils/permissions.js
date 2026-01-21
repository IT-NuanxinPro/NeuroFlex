/**
 * 权限管理工具
 * 处理 APP 环境下的各种权限请求
 */

import { Capacitor } from '@capacitor/core'
import storageManager from './storage'

class PermissionManager {
  constructor() {
    this.isNativeApp = Capacitor.isNativePlatform()
  }

  /**
   * 检查存储权限状态
   */
  async checkStoragePermission() {
    if (!this.isNativeApp) {
      // Web 环境下检查 localStorage 可用性
      return await storageManager.isAvailable()
    }

    // APP 环境下 Capacitor Preferences 不需要额外权限
    // 但我们可以测试是否可以正常读写
    try {
      const testKey = 'permission_test'
      const testValue = 'test'
      
      await storageManager.setItem(testKey, testValue)
      const retrieved = await storageManager.getItem(testKey)
      await storageManager.removeItem(testKey)
      
      return retrieved === testValue
    } catch (error) {
      console.error('存储权限检查失败:', error)
      return false
    }
  }

  /**
   * 请求存储权限
   */
  async requestStoragePermission() {
    if (!this.isNativeApp) {
      // Web 环境下不需要请求权限
      return await this.checkStoragePermission()
    }

    // APP 环境下 Capacitor Preferences 使用应用内部存储，不需要权限
    // 但我们仍然检查是否可用
    return await this.checkStoragePermission()
  }

  /**
   * 检查网络权限状态
   */
  async checkNetworkPermission() {
    if (!this.isNativeApp) {
      return navigator.onLine
    }

    // APP 环境下网络权限在 AndroidManifest.xml 中已声明
    // 检查网络连接状态
    try {
      return navigator.onLine
    } catch (error) {
      console.error('网络权限检查失败:', error)
      return false
    }
  }

  /**
   * 获取权限状态摘要
   */
  async getPermissionsSummary() {
    const storage = await this.checkStoragePermission()
    const network = await this.checkNetworkPermission()

    return {
      storage: {
        granted: storage,
        required: true,
        description: '用于保存训练记录和应用设置'
      },
      network: {
        granted: network,
        required: false,
        description: '用于检查应用更新和同步数据'
      }
    }
  }

  /**
   * 请求所有必要权限
   */
  async requestAllPermissions() {
    const results = {}

    try {
      results.storage = await this.requestStoragePermission()
      results.network = await this.checkNetworkPermission()

      return {
        success: results.storage, // 存储权限是必需的
        results
      }
    } catch (error) {
      console.error('权限请求失败:', error)
      return {
        success: false,
        error: error.message,
        results
      }
    }
  }

  /**
   * 显示权限说明对话框
   */
  showPermissionExplanation(permission) {
    const explanations = {
      storage: {
        title: '存储权限',
        message: 'NeuroFlex 需要存储权限来保存您的训练记录和个人设置。这些数据仅存储在您的设备本地，不会上传到服务器。',
        required: true
      },
      network: {
        title: '网络权限',
        message: 'NeuroFlex 使用网络权限来检查应用更新。您可以选择拒绝此权限，应用仍可正常使用。',
        required: false
      }
    }

    const explanation = explanations[permission]
    if (!explanation) return

    return new Promise((resolve) => {
      const message = `${explanation.message}\n\n${explanation.required ? '此权限为必需权限。' : '此权限为可选权限。'}`
      
      if (confirm(`${explanation.title}\n\n${message}\n\n是否授予权限？`)) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  /**
   * 检查是否首次启动
   */
  async isFirstLaunch() {
    try {
      const launched = await storageManager.getItem('app_launched', false)
      return !launched
    } catch (error) {
      console.error('检查首次启动状态失败:', error)
      return true
    }
  }

  /**
   * 标记应用已启动
   */
  async markAppLaunched() {
    try {
      await storageManager.setItem('app_launched', true)
      await storageManager.setItem('first_launch_at', new Date().toISOString())
    } catch (error) {
      console.error('标记应用启动状态失败:', error)
    }
  }

  /**
   * 初始化权限检查
   */
  async initializePermissions() {
    const isFirst = await this.isFirstLaunch()
    
    if (isFirst) {
      console.log('🚀 首次启动应用')
      await this.markAppLaunched()
    }

    const permissions = await this.requestAllPermissions()
    
    if (!permissions.success) {
      console.warn('⚠️ 权限请求失败:', permissions)
      
      // 如果存储权限失败，显示警告
      if (!permissions.results.storage) {
        alert('存储权限被拒绝，应用可能无法正常保存数据。请在设置中手动授予权限。')
      }
    } else {
      console.log('✅ 权限初始化成功')
    }

    return permissions
  }
}

// 创建单例实例
const permissionManager = new PermissionManager()

export default permissionManager
export { PermissionManager }