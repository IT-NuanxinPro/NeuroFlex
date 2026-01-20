/**
 * 认证组合式函数
 * 为 Vue 组件提供认证功能的响应式接口
 */

import { ref, computed } from 'vue';
import supabaseAuthService from '@/services/supabaseAuthService.js';

// 全局状态
const user = ref(null);
const isLoading = ref(false);
const isInitialized = ref(false);

export function useAuth() {
  // 计算属性
  const isLoggedIn = computed(() => !!user.value);
  
  /**
   * 初始化认证服务
   */
  const initialize = async () => {
    if (isInitialized.value) return;
    
    try {
      isLoading.value = true;
      await supabaseAuthService.initialize();
      user.value = supabaseAuthService.getCurrentUser();
      isInitialized.value = true;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 用户注册
   */
  const register = async (email, password, nickname) => {
    try {
      isLoading.value = true;
      const result = await supabaseAuthService.register(email, password, nickname);
      return result;
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 用户登录
   */
  const login = async (email, password, rememberMe = false) => {
    try {
      isLoading.value = true;
      const result = await supabaseAuthService.login(email, password, rememberMe);
      user.value = result.user;
      return result;
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 用户登出
   */
  const logout = async () => {
    try {
      isLoading.value = true;
      await supabaseAuthService.logout();
      user.value = null;
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 重置密码
   */
  const resetPassword = async (email) => {
    try {
      isLoading.value = true;
      return await supabaseAuthService.resetPassword(email);
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 更新密码
   */
  const updatePassword = async (newPassword) => {
    try {
      isLoading.value = true;
      return await supabaseAuthService.updatePassword(newPassword);
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 同步本地数据
   */
  const syncLocalData = async () => {
    try {
      isLoading.value = true;
      return await supabaseAuthService.syncLocalData();
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 上传训练记录
   */
  const uploadTrainingRecord = async (record) => {
    try {
      return await supabaseAuthService.uploadTrainingRecord(record);
    } catch (error) {
      throw error;
    }
  };

  /**
   * 获取排行榜
   */
  const getLeaderboard = async (moduleName, difficulty = 'all', timeRange = 'all') => {
    try {
      return await supabaseAuthService.getLeaderboard(moduleName, difficulty, timeRange);
    } catch (error) {
      throw error;
    }
  };

  // 监听认证状态变化
  if (typeof window !== 'undefined') {
    window.addEventListener('authStateChanged', (event) => {
      user.value = event.detail.user;
    });
  }

  return {
    // 状态
    user: computed(() => user.value),
    isLoggedIn,
    isLoading: computed(() => isLoading.value),
    isInitialized: computed(() => isInitialized.value),
    
    // 方法
    initialize,
    register,
    login,
    logout,
    resetPassword,
    updatePassword,
    syncLocalData,
    uploadTrainingRecord,
    getLeaderboard
  };
}

// 自动初始化（可选）
export async function initializeAuth() {
  const { initialize } = useAuth();
  await initialize();
}