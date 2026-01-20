-- NeuroFlex 数据库完整初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- ========================================
-- 1. 启用必要的扩展
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 2. 创建表结构
-- ========================================

-- users 表 - 用户基本信息
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  show_in_leaderboard BOOLEAN DEFAULT TRUE,
  enable_email_reminders BOOLEAN DEFAULT TRUE,
  nickname_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_nickname CHECK (LENGTH(nickname) BETWEEN 3 AND 20)
);

-- training_records 表 - 训练记录
CREATE TABLE IF NOT EXISTS training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  accuracy DECIMAL(5,4) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 1),
  duration INTEGER NOT NULL CHECK (duration > 0),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_module CHECK (module_name IN ('schulte', 'stroop', 'sequence', 'audio', 'mirror', 'categorize', 'memory-story'))
);

-- leaderboards 表 - 排行榜缓存
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_name VARCHAR(50) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  time_range VARCHAR(20) NOT NULL,
  rank INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  accuracy DECIMAL(5,4) NOT NULL,
  duration INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (time_range IN ('day', 'week', 'month', 'all')),
  UNIQUE(module_name, difficulty, time_range, rank)
);

-- login_sessions 表 - 设备管理和会话
CREATE TABLE IF NOT EXISTS login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- audit_logs 表 - 审计日志
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. 创建索引
-- ========================================

-- users 表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);

-- training_records 表索引
CREATE INDEX IF NOT EXISTS idx_records_user_id ON training_records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_module ON training_records(module_name);
CREATE INDEX IF NOT EXISTS idx_records_completed_at ON training_records(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_score ON training_records(score DESC);
CREATE INDEX IF NOT EXISTS idx_records_user_module ON training_records(user_id, module_name, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_query ON training_records(module_name, difficulty, completed_at DESC, score DESC);

-- leaderboards 表索引
CREATE INDEX IF NOT EXISTS idx_leaderboard_query_cache ON leaderboards(module_name, difficulty, time_range, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_updated ON leaderboards(updated_at);

-- login_sessions 表索引
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON login_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON login_sessions(expires_at);

-- audit_logs 表索引
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- ========================================
-- 4. 启用 Row Level Security (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. 创建 RLS 策略
-- ========================================

-- users 表 RLS 策略
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- training_records 表 RLS 策略
CREATE POLICY "Users can view own records" ON training_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON training_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON training_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON training_records
  FOR DELETE USING (auth.uid() = user_id);

-- login_sessions 表 RLS 策略
CREATE POLICY "Users can view own sessions" ON login_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON login_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON login_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON login_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- audit_logs 表 RLS 策略
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- leaderboards 表策略 (公开读取)
CREATE POLICY "Anyone can view leaderboards" ON leaderboards
  FOR SELECT USING (true);

-- ========================================
-- 6. 创建数据库函数
-- ========================================

-- 压缩训练记录详细数据函数
CREATE OR REPLACE FUNCTION compress_training_details(details JSONB)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'score', details->>'score',
    'accuracy', details->>'accuracy',
    'duration', details->>'duration',
    'key_metrics', COALESCE(details->'key_metrics', '{}'::jsonb),
    'difficulty_settings', COALESCE(details->'difficulty_settings', '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql;

-- 限制每个用户每个模块最多 50 条记录的触发器函数
CREATE OR REPLACE FUNCTION limit_user_records()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM training_records
  WHERE id IN (
    SELECT id FROM training_records
    WHERE user_id = NEW.user_id AND module_name = NEW.module_name
    ORDER BY score DESC, accuracy DESC, completed_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_limit_records ON training_records;
CREATE TRIGGER trigger_limit_records
AFTER INSERT ON training_records
FOR EACH ROW
EXECUTE FUNCTION limit_user_records();

-- 排行榜更新函数
CREATE OR REPLACE FUNCTION update_leaderboard(
  p_module_name VARCHAR,
  p_difficulty VARCHAR,
  p_time_range VARCHAR
)
RETURNS void AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  CASE p_time_range
    WHEN 'day' THEN v_start_date := NOW() - INTERVAL '1 day';
    WHEN 'week' THEN v_start_date := NOW() - INTERVAL '7 days';
    WHEN 'month' THEN v_start_date := NOW() - INTERVAL '30 days';
    ELSE v_start_date := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
  END CASE;

  DELETE FROM leaderboards
  WHERE module_name = p_module_name
    AND difficulty = p_difficulty
    AND time_range = p_time_range;

  INSERT INTO leaderboards (
    module_name, difficulty, time_range, rank,
    user_id, score, accuracy, duration, achieved_at
  )
  SELECT
    p_module_name,
    p_difficulty,
    p_time_range,
    ROW_NUMBER() OVER (ORDER BY score DESC, accuracy DESC, duration ASC) as rank,
    user_id,
    score,
    accuracy,
    duration,
    completed_at as achieved_at
  FROM (
    SELECT DISTINCT ON (user_id)
      user_id, score, accuracy, duration, completed_at
    FROM training_records
    WHERE module_name = p_module_name
      AND difficulty = p_difficulty
      AND completed_at >= v_start_date
      AND user_id IN (
        SELECT id FROM users WHERE show_in_leaderboard = TRUE
      )
    ORDER BY user_id, score DESC, accuracy DESC, duration ASC
  ) best_records
  ORDER BY score DESC, accuracy DESC, duration ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- 每日数据清理函数
CREATE OR REPLACE FUNCTION daily_cleanup()
RETURNS void AS $$
BEGIN
  DELETE FROM training_records WHERE completed_at < NOW() - INTERVAL '90 days';
  DELETE FROM login_sessions WHERE expires_at < NOW();
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days';
  
  UPDATE training_records 
  SET details = compress_training_details(details)
  WHERE created_at < NOW() - INTERVAL '7 days' 
    AND jsonb_typeof(details) = 'object'
    AND pg_column_size(details) > 1024;
END;
$$ LANGUAGE plpgsql;

-- 获取用户排名函数
CREATE OR REPLACE FUNCTION get_user_rank(
  p_user_id UUID,
  p_module_name VARCHAR,
  p_difficulty VARCHAR,
  p_time_range VARCHAR DEFAULT 'all'
)
RETURNS TABLE(rank INTEGER, total INTEGER, percentile DECIMAL) AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_user_rank INTEGER;
  v_total_users INTEGER;
BEGIN
  CASE p_time_range
    WHEN 'day' THEN v_start_date := NOW() - INTERVAL '1 day';
    WHEN 'week' THEN v_start_date := NOW() - INTERVAL '7 days';
    WHEN 'month' THEN v_start_date := NOW() - INTERVAL '30 days';
    ELSE v_start_date := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
  END CASE;

  WITH user_rankings AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY score DESC, accuracy DESC, duration ASC) as user_rank
    FROM (
      SELECT DISTINCT ON (user_id)
        user_id, score, accuracy, duration
      FROM training_records
      WHERE module_name = p_module_name
        AND difficulty = p_difficulty
        AND completed_at >= v_start_date
        AND user_id IN (
          SELECT id FROM users WHERE show_in_leaderboard = TRUE
        )
      ORDER BY user_id, score DESC, accuracy DESC, duration ASC
    ) best_records
  )
  SELECT ur.user_rank, COUNT(*) OVER (), 
         ROUND((COUNT(*) OVER () - ur.user_rank + 1) * 100.0 / COUNT(*) OVER (), 2)
  INTO v_user_rank, v_total_users, percentile
  FROM user_rankings ur
  WHERE ur.user_id = p_user_id;

  rank := v_user_rank;
  total := v_total_users;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. 完成提示
-- ========================================
SELECT 'NeuroFlex 数据库初始化完成！' as status,
       'Tables: users, training_records, leaderboards, login_sessions, audit_logs' as tables_created,
       'RLS policies enabled for data security' as security,
       'Indexes created for performance optimization' as performance;