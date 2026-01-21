# Cloudflare Worker 部署指南

## 方式一：通过 Dashboard 部署（推荐新手）

### 1. 创建 Worker
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击 **Create application** → **Create Worker**
4. 命名：`neuroflex-download`

### 2. 部署代码
1. 复制 `neuroflex-download.js` 的全部内容
2. 粘贴到 Worker 编辑器中
3. 点击 **Deploy**

### 3. 配置域名
#### 使用默认域名（免费）
部署后自动获得：`https://neuroflex-download.your-username.workers.dev`

#### 绑定自定义域名（推荐）
1. 在 Worker 页面，点击 **Settings** → **Triggers**
2. 点击 **Add Custom Domain**
3. 输入：`download-neuroflex.061129.xyz`（需要域名在 Cloudflare 托管）
4. 等待 DNS 生效

## 方式二：通过 Wrangler CLI 部署（推荐开发者）

### 1. 安装 Wrangler
```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
wrangler login
```

### 3. 部署 Worker
```bash
cd cloudflare-worker
wrangler deploy
```

### 4. 配置自定义域名
编辑 `wrangler.toml`，取消注释 routes 配置：
```toml
routes = [
  { pattern = "download-neuroflex.061129.xyz/*", zone_name = "061129.xyz" }
]
```

然后重新部署：
```bash
wrangler deploy
```

## 测试 Worker

部署完成后，测试以下 URL：

```bash
# 测试简化版 URL
curl -I https://download-neuroflex.061129.xyz/android-v1.1.0/NeuroFlex-v1.1.0.apk

# 测试完整版 URL
curl -I https://download-neuroflex.061129.xyz/IT-NuanxinPro/NeuroFlex/releases/download/android-v1.1.0/NeuroFlex-v1.1.0.apk
```

正常情况下应该返回 302 重定向或直接返回文件。

## 更新项目配置

### 1. 设置环境变量
在项目根目录创建 `.env.local`：
```bash
VITE_DOWNLOAD_BASE_URL=https://download-neuroflex.061129.xyz
```

### 2. 配置 GitHub Actions
在 GitHub 仓库设置中添加 Variables：
- Name: `DOWNLOAD_BASE_URL`
- Value: `https://download-neuroflex.061129.xyz`

## 域名建议

推荐使用以下子域名格式：
- `download-neuroflex.061129.xyz` - 主下载域名
- `cdn-neuroflex.061129.xyz` - 备用 CDN 域名
- `files-neuroflex.061129.xyz` - 文件服务域名

## 监控和维护

### 查看 Worker 日志
```bash
wrangler tail
```

### 查看 Worker 指标
在 Cloudflare Dashboard 的 Worker 页面可以查看：
- 请求数量
- 错误率
- 响应时间
- 带宽使用

### 更新 Worker
修改代码后重新部署：
```bash
wrangler deploy
```

## 故障排除

### 1. 域名无法访问
- 确认域名已在 Cloudflare 托管
- 检查 DNS 记录是否正确
- 等待 DNS 传播（最多 24 小时）

### 2. 下载失败
- 检查 GitHub Release 是否存在
- 确认 APK 文件名格式正确
- 查看 Worker 日志排查错误

### 3. CORS 错误
- 确认 Worker 代码中包含 CORS 头设置
- 检查浏览器控制台的具体错误信息

## 成本说明

Cloudflare Workers 免费套餐包括：
- 每天 100,000 次请求
- 每次请求最多 10ms CPU 时间
- 对于文件下载代理完全够用

如需更高配额，可升级到付费套餐。