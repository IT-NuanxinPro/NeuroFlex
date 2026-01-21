# NeuroFlex PWA 和版本管理指南

## 概述

NeuroFlex 项目现已支持完整的 PWA 打包和版本管理系统，包括：

- 自动版本同步
- Android APK 构建和发布
- 版本检测和更新提醒
- 下载页面
- Cloudflare Worker 加速下载

## 版本管理

### 版本同步脚本

使用 `scripts/sync-version.js` 来管理版本号：

```bash
# 仅同步版本到 Android（不改变版本号）
npm run version:sync

# 自动升级补丁版本 (1.0.0 -> 1.0.1)
npm run version:patch

# 自动升级次版本 (1.0.0 -> 1.1.0)
npm run version:minor

# 自动升级主版本 (1.0.0 -> 2.0.0)
npm run version:major

# 手动设置版本号
node scripts/sync-version.js 1.2.3
```

### 版本号规则

- **versionName**: 语义化版本号 (如 1.2.3)
- **versionCode**: 数字版本号，计算规则：`major * 10000 + minor * 100 + patch`
  - 例如：1.2.3 → 10203

## Android 构建

### 本地构建

```bash
# 开发版本（调试）
npm run android:debug

# 发布版本
npm run android:release

# 清理构建
npm run android:release:clean
```

### GitHub Actions 自动构建

#### 方式一：Tag 触发（推荐）

```bash
# 创建并推送 tag
git tag android-v1.2.3
git push origin android-v1.2.3
```

#### 方式二：手动触发

1. 进入 GitHub 仓库的 Actions 页面
2. 选择 "Android Release" workflow
3. 点击 "Run workflow"
4. 可选择指定版本号或使用 package.json 中的版本

### 构建产物

- **APK 文件**: `NeuroFlex-v{version}.apk`
- **GitHub Release**: 自动创建 release 并上传 APK
- **版本信息**: 自动更新 `public/app-version.json`

## 版本检测系统

### 自动检测

应用启动时会自动检查版本更新：

1. 读取本地版本号（从构建时注入）
2. 请求 `/app-version.json` 获取最新版本
3. 比较版本号，如有更新则显示弹窗

### 版本信息格式

`public/app-version.json` 包含：

```json
{
  "version": "1.2.3",
  "versionCode": 10203,
  "downloadUrl": "https://github.com/IT-NuanxinPro/NeuroFlex/releases/download/android-v1.2.3/NeuroFlex-v1.2.3.apk",
  "changelog": "版本更新内容",
  "releaseDate": "2025-01-21T00:00:00Z"
}
```

### 更新提醒策略

- 发现新版本时延迟 2 秒显示弹窗
- 用户选择"稍后更新"后 24 小时内不再提醒
- 提供"立即下载"和"稍后更新"选项

## 下载页面

访问 `/download` 可查看：

- 应用信息和图标
- 最新版本号和发布日期
- 一键下载 APK
- 功能特性介绍
- 安装说明

### 下载逻辑

- **移动端**: 直接跳转下载链接
- **桌面端**: 使用 blob 下载，支持自定义文件名

## Cloudflare Worker 加速

### 部署 Worker

#### 方式一：Dashboard 部署（推荐）
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Create Worker**
3. 命名：`neuroflex-download`
4. 复制 `cloudflare-worker/neuroflex-download.js` 内容并部署
5. 配置自定义域名：`download.neuroflex.com`

#### 方式二：Wrangler CLI 部署
```bash
npm install -g wrangler
wrangler login
cd cloudflare-worker
wrangler deploy
```

详细部署指南请参考：`cloudflare-worker/deploy.md`

### 推荐域名配置

建议使用专门的下载域名：
- `download.neuroflex.com` - 主下载域名
- `cdn.neuroflex.com` - 备用域名

### URL 格式

支持多种 URL 格式：

```
# 简化版（推荐）
https://download.neuroflex.com/android-v1.2.3/NeuroFlex-v1.2.3.apk

# 完整版
https://download.neuroflex.com/IT-NuanxinPro/NeuroFlex/releases/download/android-v1.2.3/NeuroFlex-v1.2.3.apk
```

### 功能特性

- 24 小时缓存
- 支持断点续传
- CORS 支持
- 自动添加下载头
- 降级到 GitHub 直链

## 环境配置

### GitHub Secrets

需要在 GitHub 仓库设置以下 Secrets：

```
ANDROID_KEYSTORE_BASE64    # Keystore 文件的 base64 编码
ANDROID_KEYSTORE_PASSWORD  # Keystore 密码
ANDROID_KEY_PASSWORD       # Key 密码
```

### Keystore 生成

```bash
# 生成 keystore
keytool -genkey -v -keystore neuroflex.keystore -alias neuroflex -keyalg RSA -keysize 2048 -validity 10000

# 转换为 base64
base64 -i neuroflex.keystore -o keystore.base64
```

## 使用流程

### 发布新版本

1. **更新代码**并提交
2. **升级版本号**：
   ```bash
   npm run version:patch  # 或 minor/major
   ```
3. **推送代码**：
   ```bash
   git add .
   git commit -m "chore: bump version to v1.2.3"
   git push
   ```
4. **创建 tag 触发构建**：
   ```bash
   git tag android-v1.2.3
   git push origin android-v1.2.3
   ```
5. **等待 GitHub Actions 完成构建**
6. **检查 Release 页面**确认 APK 已上传
7. **测试版本检测**功能是否正常

### 用户更新流程

1. 用户打开应用
2. 应用自动检测版本更新
3. 如有更新，显示更新弹窗
4. 用户点击"立即下载"
5. 跳转到下载页面或直接下载 APK
6. 用户安装新版本

## 注意事项

1. **版本号格式**必须遵循语义化版本规范 (x.y.z)
2. **Tag 名称**必须以 `android-v` 开头
3. **Keystore 文件**需要妥善保管，丢失后无法更新应用
4. **首次发布**需要手动创建 `public/app-version.json`
5. **Worker 域名**建议使用自定义域名以提高下载速度

## 故障排除

### 构建失败

- 检查 GitHub Secrets 是否正确设置
- 确认 Keystore 文件格式正确
- 查看 Actions 日志定位具体错误

### 版本检测不工作

- 确认 `app-version.json` 文件存在且格式正确
- 检查网络连接
- 查看浏览器控制台错误信息

### 下载失败

- 确认 GitHub Release 中 APK 文件存在
- 检查 Worker 配置是否正确
- 尝试直接访问 GitHub Release 页面下载