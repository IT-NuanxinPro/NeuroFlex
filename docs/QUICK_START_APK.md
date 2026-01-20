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

### Ubuntu 用户
```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 JDK
sudo apt install openjdk-11-jdk

# 下载 Android Studio
# https://developer.android.com/studio

# 设置环境变量 (添加到 ~/.bashrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🔧 常见问题一键解决

### 问题: ANDROID_HOME 未设置
```bash
# 快速设置 (根据你的系统选择)
# Windows
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk

# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
```

### 问题: Gradle 构建失败
```bash
# 清理并重新构建
cd android
./gradlew clean
./gradlew assembleDebug
```

### 问题: 设备未识别
```bash
# 重启 ADB 服务
adb kill-server
adb start-server
adb devices  # 应该显示你的设备
```

## 📱 测试 APK

### 在真实设备上测试
1. **启用开发者选项**:
   - 设置 → 关于手机 → 连续点击"版本号" 7次
   
2. **启用 USB 调试**:
   - 设置 → 开发者选项 → USB 调试 (开启)
   
3. **连接设备并安装**:
   ```bash
   adb devices  # 确认设备已连接
   npm run android:dev  # 自动安装并运行
   ```

### 在模拟器上测试
1. **创建模拟器** (Android Studio):
   - Tools → AVD Manager → Create Virtual Device
   
2. **启动模拟器并运行**:
   ```bash
   npm run android:dev
   ```

## 🎯 验证安全区域适配

### 测试不同设备
- **普通屏幕**: 小米、华为等
- **刘海屏**: iPhone X 样式的 Android 设备
- **挖孔屏**: 三星 Galaxy S 系列
- **瀑布屏**: 华为 Mate 系列

### 检查要点
- ✅ 顶部内容不被状态栏遮挡
- ✅ 底部按钮不被导航栏遮挡
- ✅ 左右内容不被刘海/挖孔遮挡
- ✅ 横屏模式正常显示
- ✅ 游戏界面安全区域正确

## 📦 发布版本构建

### 生成发布密钥
```bash
keytool -genkey -v -keystore neuroflex-release-key.keystore -alias neuroflex -keyalg RSA -keysize 2048 -validity 10000
```

### 构建发布版本
```bash
# 设置环境变量
export BUILD_TYPE=release
export KEYSTORE_PATH=./android/app/neuroflex-release-key.keystore
export KEYSTORE_PASSWORD=your_password
export KEY_ALIAS=neuroflex
export KEY_PASSWORD=your_key_password

# 构建
npm run build:apk
```

## 🆘 紧急救援

### 完全重置构建环境
```bash
# 清理所有缓存和构建文件
rm -rf node_modules
rm -rf android
npm install
npx cap add android
npm run build:apk
```

### 检查构建状态
```bash
# 验证环境
node --version && echo "✅ Node.js OK"
java -version && echo "✅ Java OK"
adb version && echo "✅ Android SDK OK"
ls android/ && echo "✅ Android 项目存在"
ls dist/ && echo "✅ Web 构建存在"
```

## 📞 获取帮助

### 自动诊断
```bash
# 运行诊断脚本
npm run android:dev --verbose
```

### 查看详细日志
```bash
# Android 设备日志
adb logcat | grep -i neuroflex

# Capacitor 日志
npx cap run android --verbose
```

### 社区支持
- [Capacitor Discord](https://discord.gg/UPYYRhtyzp)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor)
- [GitHub Issues](https://github.com/ionic-team/capacitor/issues)

---

## 🎉 成功标志

如果看到以下信息，说明构建成功：
```
✅ APK 构建成功!
📦 APK 文件位置: android/app/build/outputs/apk/debug/app-debug.apk
📱 现在可以安装到 Android 设备上进行测试
```

**恭喜！你的 NeuroFlex 应用现在可以作为原生 Android 应用运行了！** 🎊