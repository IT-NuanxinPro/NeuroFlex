/**
 * Supabase 内置认证服务
 * 使用 Supabase 原生认证，安全且简单
 * 
 * 功能特性：
 * - 邮箱密码登录/注册
 * - 自动 JWT token 管理
 * - 本地数据同步
 * - 排行榜数据获取
 * - 离线训练记录存储
 */

import { createClient } from '@supabase/supabase-js';
import storageManager from '../utils/storage.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

class SupabaseAuthService {
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.currentUser = null;
    this.isInitialized = false;
    
    // 监听认证状态变化
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session);
    });
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      // 检查本地存储可用性
      if (!storageManager.isAvailable()) {
        throw new Error('本地存储不可用');
      }

      // 获取当前会话
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session) {
        this.currentUser = session.user;
        await this.syncUserProfile();
        await this.checkLocalDataSync();
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Auth service initialization failed:', error);
      throw error;
    }
  }

  /**
   * 用户注册
   */
  async register(email, password, nickname) {
    try {
      // 验证输入
      this.validateEmail(email);
      this.validatePassword(password);
      this.validateNickname(nickname);

      // 使用 Supabase 注册
      const { data, error } = await this.supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            nickname: nickname
          }
        }
      });

      if (error) {
        throw new Error(this.translateError(error.message));
      }

      // 注册成功，触发器会自动创建用户资料
      return {
        success: true,
        userId: data.user?.id,
        message: '注册成功，请检查邮箱进行验证'
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(error.message || '注册失败，请重试');
    }
  }

  /**
   * 用户登录
   */
  async login(email, password, rememberMe = false) {
    try {
      // 验证输入
      this.validateEmail(email);
      if (!password) {
        throw new Error('密码不能为空');
      }

      // 使用 Supabase 登录
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        throw new Error(this.translateError(error.message));
      }

      this.currentUser = data.user;
      
      // 同步用户资料
      await this.syncUserProfile();
      
      // 更新最后登录时间
      await this.updateLastLogin();

      // 检查本地数据同步
      await this.checkLocalDataSync();

      return {
        success: true,
        user: this.currentUser,
        session: data.session
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(error.message || '登录失败，请重试');
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }

      this.currentUser = null;
      this.clearUserInfo();

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      this.currentUser = null;
      this.clearUserInfo();
      throw new Error('登出失败');
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * 检查用户是否已登录
   */
  isLoggedIn() {
    return !!this.currentUser;
  }

  /**
   * 获取当前会话
   */
  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * 刷新会话
   */
  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();
    if (error) {
      throw new Error('会话刷新失败');
    }
    return data.session;
  }

  /**
   * 重置密码
   */
  async resetPassword(email) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw new Error(this.translateError(error.message));
      }

      return {
        success: true,
        message: '密码重置邮件已发送，请检查邮箱'
      };
    } catch (error) {
      throw new Error(error.message || '密码重置失败');
    }
  }

  /**
   * 更新密码
   */
  async updatePassword(newPassword) {
    try {
      this.validatePassword(newPassword);

      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(this.translateError(error.message));
      }

      return { success: true, message: '密码更新成功' };
    } catch (error) {
      throw new Error(error.message || '密码更新失败');
    }
  }

  /**
   * 上传训练记录
   */
  async uploadTrainingRecord(record) {
    try {
      if (!this.isLoggedIn()) {
        throw new Error('用户未登录');
      }

      const recordData = {
        user_id: this.currentUser.id,
        module_name: record.moduleName,
        difficulty: record.difficulty,
        score: record.score,
        accuracy: record.accuracy,
        duration: record.duration,
        completed_at: record.completedAt,
        details: record.details || {}
      };

      const { data, error } = await this.supabase
        .from('training_records')
        .insert(recordData)
        .select()
        .single();

      if (error) {
        throw new Error('记录上传失败');
      }

      return {
        success: true,
        recordId: data.id
      };
    } catch (error) {
      console.error('Upload training record failed:', error);
      throw error;
    }
  }

  /**
   * 批量上传训练记录
   */
  async batchUploadRecords(records) {
    try {
      if (!this.isLoggedIn()) {
        throw new Error('用户未登录');
      }

      const recordsData = records.map(record => ({
        user_id: this.currentUser.id,
        module_name: record.moduleName,
        difficulty: record.difficulty,
        score: record.score,
        accuracy: record.accuracy,
        duration: record.duration,
        completed_at: record.completedAt,
        details: record.details || {}
      }));

      const { data, error } = await this.supabase
        .from('training_records')
        .insert(recordsData)
        .select();

      if (error) {
        throw new Error('批量上传失败');
      }

      return {
        success: true,
        uploaded: data.length,
        records: data
      };
    } catch (error) {
      console.error('Batch upload failed:', error);
      throw error;
    }
  }

  /**
   * 获取排行榜数据
   */
  async getLeaderboard(moduleName, difficulty = 'all', timeRange = 'all', limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('leaderboards')
        .select(`
          rank,
          score,
          accuracy,
          duration,
          achieved_at,
          users!inner(nickname, avatar_url)
        `)
        .eq('module_name', moduleName)
        .eq('difficulty', difficulty)
        .eq('time_range', timeRange)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error('获取排行榜失败');
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Get leaderboard failed:', error);
      throw error;
    }
  }

  /**
   * 同步本地数据到云端
   */
  async syncLocalData() {
    try {
      const unsyncedRecords = storageManager.getUnsyncedRecords();
      
      if (unsyncedRecords.length === 0) {
        return { success: true, synced: 0 };
      }

      const result = await this.batchUploadRecords(unsyncedRecords);
      
      // 标记已同步
      const syncedIds = unsyncedRecords.map(record => record.id);
      storageManager.markRecordsSynced(syncedIds);

      return {
        success: true,
        synced: result.uploaded,
        total: unsyncedRecords.length
      };
    } catch (error) {
      console.error('Sync local data failed:', error);
      throw error;
    }
  }

  /**
   * 处理认证状态变化
   */
  handleAuthStateChange(event, session) {
    console.log('Auth state changed:', event, session);
    
    switch (event) {
      case 'SIGNED_IN':
        this.currentUser = session.user;
        this.syncUserProfile();
        break;
      case 'SIGNED_OUT':
        this.currentUser = null;
        this.clearUserInfo();
        break;
      case 'TOKEN_REFRESHED':
        this.currentUser = session.user;
        break;
    }

    // 触发自定义事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { event, session, user: this.currentUser }
      }));
    }
  }

  /**
   * 同步用户资料
   */
  async syncUserProfile() {
    try {
      if (!this.currentUser) return;

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (!error && data) {
        this.saveUserInfo(data);
      }
    } catch (error) {
      console.error('Sync user profile failed:', error);
    }
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin() {
    try {
      if (!this.currentUser) return;

      await this.supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', this.currentUser.id);
    } catch (error) {
      console.error('Update last login failed:', error);
    }
  }

  /**
   * 检查本地数据同步
   */
  async checkLocalDataSync() {
    try {
      const unsyncedRecords = storageManager.getUnsyncedRecords();
      
      if (unsyncedRecords.length > 0) {
        // 触发同步提示事件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('localDataFound', {
            detail: { 
              count: unsyncedRecords.length,
              records: unsyncedRecords
            }
          }));
        }
      }
      
      return unsyncedRecords;
    } catch (error) {
      console.error('Failed to check local data sync:', error);
      return [];
    }
  }

  /**
   * 保存用户信息到本地
   */
  saveUserInfo(user) {
    try {
      storageManager.setItem('user_info', user);
    } catch (error) {
      console.error('Failed to save user info:', error);
    }
  }

  /**
   * 清除用户信息
   */
  clearUserInfo() {
    try {
      storageManager.removeItem('user_info');
    } catch (error) {
      console.error('Failed to clear user info:', error);
    }
  }

  /**
   * 验证邮箱格式
   */
  validateEmail(email) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('邮箱格式不正确');
    }
  }

  /**
   * 验证密码强度
   */
  validatePassword(password) {
    if (!password || password.length < 8) {
      throw new Error('密码至少需要8位字符');
    }
    
    if (!/[A-Za-z]/.test(password)) {
      throw new Error('密码必须包含字母');
    }
    
    if (!/\d/.test(password)) {
      throw new Error('密码必须包含数字');
    }
  }

  /**
   * 验证昵称
   */
  validateNickname(nickname) {
    if (!nickname || nickname.length < 3 || nickname.length > 20) {
      throw new Error('昵称长度应在3-20个字符之间');
    }
  }

  /**
   * 翻译错误消息
   */
  translateError(errorMessage) {
    const errorMap = {
      'Invalid login credentials': '邮箱或密码错误',
      'Email not confirmed': '邮箱未验证，请检查邮箱',
      'User already registered': '邮箱已被注册',
      'Password should be at least 6 characters': '密码至少需要6位字符',
      'Invalid email': '邮箱格式不正确',
      'Signup requires a valid password': '请输入有效密码',
      'Email rate limit exceeded': '邮件发送过于频繁，请稍后重试'
    };

    return errorMap[errorMessage] || errorMessage;
  }

  /**
   * 获取认证状态
   */
  getAuthStatus() {
    return {
      isLoggedIn: this.isLoggedIn(),
      user: this.getCurrentUser(),
      storageStats: storageManager.getStorageStats()
    };
  }
}

// 创建单例实例
const supabaseAuthService = new SupabaseAuthService();

export default supabaseAuthService;