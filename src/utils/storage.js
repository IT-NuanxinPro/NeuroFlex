/**
 * 本地存储管理器
 * 使用 localStorage 进行数据持久化，支持移动端
 */

class LocalStorageManager {
  constructor() {
    this.prefix = 'neuroflex_';
    this.version = '1.0';
    this.maxRecords = 1000; // 本地最多存储1000条记录
  }

  /**
   * 保存训练记录到本地
   */
  saveTrainingRecord(record) {
    try {
      // 生成记录ID（如果没有）
      if (!record.id) {
        record.id = this.generateId();
      }

      // 添加本地标记
      record.isLocal = true;
      record.synced = false;
      record.savedAt = new Date().toISOString();

      // 获取现有记录
      const records = this.getTrainingRecords();
      
      // 检查是否已存在
      const existingIndex = records.findIndex(r => r.id === record.id);
      
      if (existingIndex >= 0) {
        // 更新现有记录
        records[existingIndex] = record;
      } else {
        // 添加新记录
        records.push(record);
      }

      // 限制记录数量
      if (records.length > this.maxRecords) {
        // 保留最新的记录，删除最旧的
        records.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        records.splice(this.maxRecords);
      }

      // 保存到 localStorage
      this.setItem('training_records', records);
      
      return record.id;
    } catch (error) {
      console.error('Failed to save training record:', error);
      throw new Error('保存训练记录失败');
    }
  }

  /**
   * 获取所有训练记录
   */
  getTrainingRecords(filter = {}) {
    try {
      const records = this.getItem('training_records', []);
      
      // 应用过滤器
      let filteredRecords = records;
      
      if (filter.moduleName) {
        filteredRecords = filteredRecords.filter(r => r.moduleName === filter.moduleName);
      }
      
      if (filter.synced !== undefined) {
        filteredRecords = filteredRecords.filter(r => r.synced === filter.synced);
      }
      
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        filteredRecords = filteredRecords.filter(r => new Date(r.completedAt) >= startDate);
      }
      
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        filteredRecords = filteredRecords.filter(r => new Date(r.completedAt) <= endDate);
      }

      // 按完成时间倒序排列
      return filteredRecords.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    } catch (error) {
      console.error('Failed to get training records:', error);
      return [];
    }
  }

  /**
   * 获取未同步的记录
   */
  getUnsyncedRecords() {
    return this.getTrainingRecords({ synced: false });
  }

  /**
   * 标记记录为已同步
   */
  markRecordSynced(recordId, cloudId = null) {
    try {
      const records = this.getTrainingRecords();
      const recordIndex = records.findIndex(r => r.id === recordId);
      
      if (recordIndex >= 0) {
        records[recordIndex].synced = true;
        records[recordIndex].syncedAt = new Date().toISOString();
        
        if (cloudId) {
          records[recordIndex].cloudId = cloudId;
        }
        
        this.setItem('training_records', records);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to mark record as synced:', error);
      return false;
    }
  }

  /**
   * 批量标记记录为已同步
   */
  markRecordsSynced(recordIds) {
    try {
      const records = this.getTrainingRecords();
      let updated = 0;
      
      recordIds.forEach(recordId => {
        const recordIndex = records.findIndex(r => r.id === recordId);
        if (recordIndex >= 0) {
          records[recordIndex].synced = true;
          records[recordIndex].syncedAt = new Date().toISOString();
          updated++;
        }
      });
      
      if (updated > 0) {
        this.setItem('training_records', records);
      }
      
      return updated;
    } catch (error) {
      console.error('Failed to mark records as synced:', error);
      return 0;
    }
  }

  /**
   * 删除本地记录
   */
  deleteRecord(recordId) {
    try {
      const records = this.getTrainingRecords();
      const filteredRecords = records.filter(r => r.id !== recordId);
      
      this.setItem('training_records', filteredRecords);
      return true;
    } catch (error) {
      console.error('Failed to delete record:', error);
      return false;
    }
  }

  /**
   * 清理旧记录
   */
  cleanOldRecords(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const records = this.getTrainingRecords();
      const filteredRecords = records.filter(r => {
        const recordDate = new Date(r.completedAt);
        return recordDate >= cutoffDate;
      });
      
      const deletedCount = records.length - filteredRecords.length;
      
      if (deletedCount > 0) {
        this.setItem('training_records', filteredRecords);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to clean old records:', error);
      return 0;
    }
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats() {
    try {
      const records = this.getTrainingRecords();
      const unsyncedRecords = this.getUnsyncedRecords();
      
      // 计算存储大小（估算）
      const dataSize = JSON.stringify(records).length;
      
      // 按模块统计
      const moduleStats = {};
      records.forEach(record => {
        if (!moduleStats[record.moduleName]) {
          moduleStats[record.moduleName] = {
            total: 0,
            synced: 0,
            unsynced: 0
          };
        }
        
        moduleStats[record.moduleName].total++;
        if (record.synced) {
          moduleStats[record.moduleName].synced++;
        } else {
          moduleStats[record.moduleName].unsynced++;
        }
      });

      return {
        totalRecords: records.length,
        syncedRecords: records.length - unsyncedRecords.length,
        unsyncedRecords: unsyncedRecords.length,
        estimatedSize: dataSize,
        moduleStats: moduleStats,
        lastRecord: records.length > 0 ? records[0].completedAt : null
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalRecords: 0,
        syncedRecords: 0,
        unsyncedRecords: 0,
        estimatedSize: 0,
        moduleStats: {},
        lastRecord: null
      };
    }
  }

  /**
   * 导出所有数据
   */
  exportData() {
    try {
      const data = {
        version: this.version,
        exportedAt: new Date().toISOString(),
        trainingRecords: this.getTrainingRecords(),
        userSettings: this.getUserSettings(),
        stats: this.getStorageStats()
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('数据导出失败');
    }
  }

  /**
   * 导入数据
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.trainingRecords && Array.isArray(data.trainingRecords)) {
        // 合并训练记录，避免重复
        const existingRecords = this.getTrainingRecords();
        const existingIds = new Set(existingRecords.map(r => r.id));
        
        const newRecords = data.trainingRecords.filter(r => !existingIds.has(r.id));
        const allRecords = [...existingRecords, ...newRecords];
        
        // 限制记录数量
        if (allRecords.length > this.maxRecords) {
          allRecords.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
          allRecords.splice(this.maxRecords);
        }
        
        this.setItem('training_records', allRecords);
        
        return {
          success: true,
          imported: newRecords.length,
          total: allRecords.length
        };
      }
      
      throw new Error('Invalid data format');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('数据导入失败：' + error.message);
    }
  }

  /**
   * 清空所有数据
   */
  clearAllData() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  /**
   * 获取用户设置
   */
  getUserSettings() {
    return this.getItem('user_settings', {
      theme: 'light',
      language: 'zh-CN',
      notifications: true,
      autoSync: true
    });
  }

  /**
   * 保存用户设置
   */
  saveUserSettings(settings) {
    try {
      const currentSettings = this.getUserSettings();
      const newSettings = { ...currentSettings, ...settings };
      this.setItem('user_settings', newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save user settings:', error);
      return false;
    }
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  /**
   * 设置项目到 localStorage
   */
  setItem(key, value) {
    try {
      const fullKey = this.prefix + key;
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(fullKey, serializedValue);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // 存储空间不足，清理旧数据
        this.cleanOldRecords(30); // 清理30天前的数据
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch (retryError) {
          throw new Error('存储空间不足，请清理数据后重试');
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * 从 localStorage 获取项目
   */
  getItem(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);
      
      if (item === null) {
        return defaultValue;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.error('Failed to get item from localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * 删除项目
   */
  removeItem(key) {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Failed to remove item from localStorage:', error);
      return false;
    }
  }

  /**
   * 检查 localStorage 可用性
   */
  isAvailable() {
    try {
      const testKey = this.prefix + 'test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取存储使用情况
   */
  getStorageUsage() {
    try {
      let totalSize = 0;
      let itemCount = 0;
      
      for (let key in localStorage) {
        if (key.startsWith(this.prefix)) {
          totalSize += localStorage[key].length;
          itemCount++;
        }
      }
      
      return {
        totalSize: totalSize,
        itemCount: itemCount,
        formattedSize: this.formatBytes(totalSize)
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        totalSize: 0,
        itemCount: 0,
        formattedSize: '0 B'
      };
    }
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 创建单例实例
const storageManager = new LocalStorageManager();

export default storageManager;

// 导出类用于测试
export { LocalStorageManager };

// 兼容性函数 - 为了保持向后兼容
export function saveUserData(data) {
  try {
    storageManager.setItem('user_data', data);
    return { success: true };
  } catch (error) {
    console.error('Failed to save user data:', error);
    return { success: false, error: error.message };
  }
}

export function loadUserData() {
  try {
    return storageManager.getItem('user_data', null);
  } catch (error) {
    console.error('Failed to load user data:', error);
    return null;
  }
}

export function downloadData() {
  try {
    return storageManager.exportData();
  } catch (error) {
    console.error('Failed to download data:', error);
    throw error;
  }
}