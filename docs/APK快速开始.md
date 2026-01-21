# 🚀 NeuroFlex APK 快速构建指南

## ⚡ 5分钟快速开始

### 前提条件检查
```bash
# 检查必需工具 (全部显示版本号才能继续)
node --version    # 需要 16.0+
java -version     # 需要 JDK 8 或 11
adb version       # 需要 Android SDK
```

### 一键构建 APK
```bash
# 1. 安装依赖
npm install

# 2. 自动构建 APK
npm run build:apk

# 3. 安装到设备 (连接 Android 设备)
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 📋 环境快速安装

### Windows 用户
1. **安装 Node.js**: https://nodejs.org (选择 LTS 版本)
2. **安装 Android Studio**: https://developer.android.com/studio
3. **设置环境变量**:
   ```cmd
   # 添加到系统环境变量
   ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   
   # 添加到 PATH
   %ANDROID_HOME%\platform-tools
   ```

### macOS 用户
```bash
# 使用 Homebrew 安装
brew install node
brew install openjdk@11
brew install --cask android-studio

# 设置环境变量 (添加到 ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Linux 用户
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm openjdk-11-jdk

# 下载 Android Studio
wget https://developer.android.com/studio/index.html

# 设置环境变量 (添加到 ~/.bashrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🔧 常见问题快速解决

### 问题 1: 找不到 adb 命令
```bash
# 确保 Android SDK 已安装并添加到 PATH
echo $ANDROID_HOME  # 应该显示 SDK 路径
ls $ANDROID_HOME/platform-tools/adb  # 应该存在
```

### 问题 2: Gradle 构建失败
```bash
# 清理并重新构建
cd android
./gradlew clean
./gradlew assembleDebug
```

### 问题 3: 设备未识别
```bash
# 检查设备连接
adb devices
# 如果为空，检查 USB 调试是否开启
```

## 📱 测试 APK

### 在真实设备上测试
1. 开启开发者选项
2. 启用 USB 调试
3. 连接设备到电脑
4. 运行 `adb install` 命令

### 在模拟器上测试
1. 在 Android Studio 中创建 AVD
2. 启动模拟器
3. 运行 `npx cap run android`

## 🎯 下一步

构建成功后，你可以：
- 📱 在多种设备上测试
- 🔧 根据需要调整配置
- 📦 准备发布版本
- 📚 查看详细文档

**需要更详细的指南？** 查看 `APK构建指南.md`