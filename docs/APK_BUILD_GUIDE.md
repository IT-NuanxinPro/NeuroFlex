# NeuroFlex APK 构建指南

## 📋 环境准备

### 1. 系统要求
- **操作系统**: Windows 10+, macOS 10.14+, 或 Ubuntu 18.04+
- **Node.js**: 16.0+ (推荐 18.x LTS)
- **内存**: 至少 8GB RAM
- **存储**: 至少 10GB 可用空间

### 2. 必需软件安装

#### 2.1 Node.js 和 npm
```bash
# 检查是否已安装
node --version
npm --version

# 如果未安装，访问 https://nodejs.org 下载安装
```

#### 2.2 Java Development Kit (JDK)
```bash
# 安装 JDK 8 或 11 (推荐 JDK 11)
# Windows: 下载 Oracle JDK 或 OpenJDK
# macOS: brew install openjdk@11
# Ubuntu: sudo apt install openjdk-11-jdk

# 验证安装
java -version
javac -version
```

#### 2.3 Android Studio 和 Android SDK
1. **下载 Android Studio**: https://developer.android.com/studio
2. **安装 Android Studio** 并启动
3. **SDK 配置**:
   - 打开 Android Studio
   - 进入 `Tools > SDK Manager`
   - 安装以下组件：
     - Android SDK Platform (API 30+)
     - Android SDK Build-Tools (30.0.3+)
     - Android SDK Command-line Tools
     - Android Emulator (可选，用于测试)

#### 2.4 环境变量配置

**Windows:**
```cmd
# 添加到系统环境变量
ANDROID_HOME=C:\Users\[用户名]\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Java\jdk-11.0.x

# 添加到 PATH
%ANDROID_HOME%\tools
%ANDROID_HOME%\platform-tools
%JAVA_HOME%\bin
```

**macOS/Linux:**
```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk        # Linux
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64  # 根据实际路径调整
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin

# 重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc
```

### 3. 验证环境
```bash
# 检查所有工具是否正确安装
node --version          # 应显示 v16.0.0+
npm --version           # 应显示版本号
java -version           # 应显示 JDK 版本
adb version             # 应显示 Android Debug Bridge 版本
```

## 🚀 项目构建步骤

### 步骤 1: 安装项目依赖
```bash
# 进入项目目录
cd neuroflex

# 安装 Node.js 依赖
npm install

# 安装 Capacitor CLI (如果未全局安装)
npm install -g @capacitor/cli
```

### 步骤 2: 构建 Web 应用
```bash
# 构建生产版本
npm run build

# 验证构建结果
ls dist/  # 应该看到构建后的文件
```

### 步骤 3: 初始化 Capacitor (首次构建)
```bash
# 初始化 Capacitor 项目
npx cap init

# 添加 Android 平台
npx cap add android

# 同步 Web 资源到原生项目
npx cap sync android
```

### 步骤 4: 构建 APK

#### 方法一: 自动化构建 (推荐)
```bash
# 使用自动化脚本构建
npm run build:apk
```

#### 方法二: 手动构建
```bash
# 1. 构建 Web 应用
npm run build

# 2. 同步到 Android 项目
npx cap copy android
npx cap sync android

# 3. 构建 APK
cd android
./gradlew assembleDebug  # 调试版本
# 或
./gradlew assembleRelease  # 发布版本 (需要签名)
```

### 步骤 5: 查找生成的 APK
```bash
# APK 文件位置
android/app/build/outputs/apk/debug/app-debug.apk      # 调试版本
android/app/build/outputs/apk/release/app-release.apk  # 发布版本
```

## 📱 测试和安装

### 在 Android 设备上测试
```bash
# 启用开发者选项和 USB 调试
# 连接设备到电脑

# 安装 APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 或者直接运行
npx cap run android
```

### 在 Android 模拟器上测试
```bash
# 启动模拟器 (在 Android Studio 中创建)
# 然后运行
npx cap run android
```

## 🔧 常见问题解决

### 问题 1: `ANDROID_HOME` 未设置
**错误信息**: `ANDROID_HOME is not set`

**解决方案**:
```bash
# 查找 Android SDK 路径
# Windows: C:\Users\[用户名]\AppData\Local\Android\Sdk
# macOS: ~/Library/Android/sdk
# Linux: ~/Android/Sdk

# 设置环境变量 (参考上面的环境变量配置)
```

### 问题 2: Gradle 构建失败
**错误信息**: `Gradle build failed`

**解决方案**:
```bash
# 清理项目
cd android
./gradlew clean

# 重新构建
./gradlew assembleDebug

# 如果仍然失败，检查 JDK 版本
java -version  # 确保是 JDK 8 或 11
```

### 问题 3: 权限被拒绝
**错误信息**: `Permission denied`

**解决方案**:
```bash
# Linux/macOS: 给 gradlew 执行权限
chmod +x android/gradlew

# Windows: 以管理员身份运行命令提示符
```

### 问题 4: 设备未识别
**错误信息**: `No devices found`

**解决方案**:
```bash
# 检查设备连接
adb devices

# 如果设备未显示:
# 1. 确保启用了 USB 调试
# 2. 安装设备驱动程序
# 3. 尝试不同的 USB 线缆
# 4. 重启 adb 服务
adb kill-server
adb start-server
```

### 问题 5: 内存不足
**错误信息**: `OutOfMemoryError`

**解决方案**:
```bash
# 增加 Gradle 内存限制
# 编辑 android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

## 📦 发布准备

### 1. 创建签名密钥
```bash
# 生成发布密钥库
keytool -genkey -v -keystore neuroflex-release-key.keystore -alias neuroflex -keyalg RSA -keysize 2048 -validity 10000

# 将密钥库文件放在 android/app/ 目录下
```

### 2. 配置签名
编辑 `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('neuroflex-release-key.keystore')
            storePassword 'your_store_password'
            keyAlias 'neuroflex'
            keyPassword 'your_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. 构建发布版本
```bash
cd android
./gradlew assembleRelease
```

### 4. 优化 APK 大小
```bash
# 生成 AAB (Android App Bundle) 格式
./gradlew bundleRelease

# AAB 文件位置
# android/app/build/outputs/bundle/release/app-release.aab
```

## 📊 构建脚本说明

### 可用的 npm 脚本
```bash
npm run build:apk          # 自动化 APK 构建
npm run android:dev        # 开发模式 (构建并运行)
npm run android:build      # 构建并同步到 Android
npm run cap:sync           # 同步 Capacitor 项目
npm run cap:run:android    # 运行 Android 应用
```

### 环境变量配置
```bash
# 构建类型
export BUILD_TYPE=release  # 或 debug

# 架构类型
export ARCH=universal      # 或 arm64-v8a, armeabi-v7a, x86_64

# 签名配置 (发布版本)
export KEYSTORE_PATH=./android/app/neuroflex-release-key.keystore
export KEYSTORE_PASSWORD=your_password
export KEY_ALIAS=neuroflex
export KEY_PASSWORD=your_key_password
```

## 🎯 性能优化建议

### 1. APK 大小优化
- 启用代码混淆 (ProGuard)
- 移除未使用的资源
- 使用 WebP 格式图片
- 启用资源压缩

### 2. 启动性能优化
- 优化启动画面
- 减少初始化代码
- 使用懒加载

### 3. 运行时性能优化
- 启用硬件加速
- 优化 WebView 设置
- 减少内存使用

## 📞 技术支持

### 有用的命令
```bash
# 查看构建日志
npx cap run android --verbose

# 清理所有缓存
npx cap clean android
npm run build
npx cap sync android

# 查看设备日志
adb logcat | grep -i neuroflex
```

### 调试工具
- **Chrome DevTools**: chrome://inspect (调试 WebView)
- **Android Studio**: 查看原生代码和日志
- **Capacitor DevTools**: 监控插件调用

### 文档资源
- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 开发者文档](https://developer.android.com/docs)
- [Gradle 构建工具文档](https://gradle.org/guides/)

---

## 🎉 构建成功！

如果一切顺利，你现在应该有一个可以安装在 Android 设备上的 APK 文件。

**下一步**:
1. 在多种 Android 设备上测试
2. 检查安全区域适配效果
3. 验证所有功能正常工作
4. 准备发布到 Google Play Store

**记住**: 
- 调试版本仅用于测试
- 发布版本需要签名
- 定期更新 Android SDK 和构建工具
- 在真实设备上测试安全区域适配