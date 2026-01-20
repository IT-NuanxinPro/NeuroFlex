#!/usr/bin/env node

/**
 * APK 构建脚本
 * 自动化构建和优化APK的流程
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// 构建配置
const BUILD_CONFIG = {
  // 应用信息
  appId: 'com.neuroflex.app',
  appName: 'NeuroFlex',
  version: '1.1.0',
  
  // 构建选项
  buildType: process.env.BUILD_TYPE || 'release', // debug | release
  architecture: process.env.ARCH || 'universal', // arm64-v8a | armeabi-v7a | x86_64 | universal
  
  // 优化选项
  minifyEnabled: true,
  proguardEnabled: true,
  shrinkResources: true,
  
  // 签名配置（生产环境）
  keystore: {
    path: process.env.KEYSTORE_PATH || './android/app/neuroflex-release-key.keystore',
    password: process.env.KEYSTORE_PASSWORD || '',
    alias: process.env.KEY_ALIAS || 'neuroflex',
    aliasPassword: process.env.KEY_PASSWORD || ''
  }
}

/**
 * 执行命令并输出结果
 */
function runCommand(command, options = {}) {
  console.log(`🔄 执行: ${command}`)
  try {
    const result = execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    })
    return result
  } catch (error) {
    console.error(`❌ 命令执行失败: ${command}`)
    console.error(error.message)
    process.exit(1)
  }
}

/**
 * 检查必要的工具和环境
 */
function checkEnvironment() {
  console.log('🔍 检查构建环境...')
  
  // 检查 Node.js 版本
  const nodeVersion = process.version
  console.log(`Node.js 版本: ${nodeVersion}`)
  
  // 检查 Capacitor CLI
  try {
    runCommand('npx cap --version', { stdio: 'pipe' })
    console.log('✅ Capacitor CLI 已安装')
  } catch (error) {
    console.error('❌ Capacitor CLI 未安装，请运行: npm install -g @capacitor/cli')
    process.exit(1)
  }
  
  // 检查 Android SDK
  if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
    console.warn('⚠️  未设置 ANDROID_HOME 或 ANDROID_SDK_ROOT 环境变量')
    console.warn('请确保已安装 Android SDK 并设置环境变量')
  }
  
  // 检查 Java
  try {
    runCommand('java -version', { stdio: 'pipe' })
    console.log('✅ Java 环境正常')
  } catch (error) {
    console.error('❌ Java 环境未配置，请安装 JDK 8 或更高版本')
    process.exit(1)
  }
}

/**
 * 构建 Web 应用
 */
function buildWeb() {
  console.log('🏗️  构建 Web 应用...')
  
  // 设置生产环境变量
  process.env.NODE_ENV = 'production'
  process.env.VITE_APP_PLATFORM = 'android'
  
  // 执行构建
  runCommand('npm run build')
  
  console.log('✅ Web 应用构建完成')
}

/**
 * 初始化 Capacitor 项目
 */
function initCapacitor() {
  console.log('⚙️  初始化 Capacitor 项目...')
  
  // 检查是否已初始化
  if (!existsSync(join(rootDir, 'capacitor.config.js'))) {
    console.log('初始化 Capacitor...')
    runCommand(`npx cap init "${BUILD_CONFIG.appName}" "${BUILD_CONFIG.appId}"`)
  }
  
  // 添加 Android 平台
  if (!existsSync(join(rootDir, 'android'))) {
    console.log('添加 Android 平台...')
    runCommand('npx cap add android')
  }
  
  console.log('✅ Capacitor 项目初始化完成')
}

/**
 * 同步 Web 资源到原生项目
 */
function syncCapacitor() {
  console.log('🔄 同步 Capacitor 项目...')
  
  // 复制 Web 资源
  runCommand('npx cap copy android')
  
  // 更新原生依赖
  runCommand('npx cap sync android')
  
  console.log('✅ Capacitor 项目同步完成')
}

/**
 * 配置 Android 项目
 */
function configureAndroid() {
  console.log('🔧 配置 Android 项目...')
  
  const androidDir = join(rootDir, 'android')
  const appDir = join(androidDir, 'app')
  
  // 创建必要的目录
  const resDir = join(appDir, 'src', 'main', 'res')
  if (!existsSync(resDir)) {
    mkdirSync(resDir, { recursive: true })
  }
  
  // 配置应用图标和启动画面
  configureAppIcons()
  configureSplashScreen()
  
  // 配置 build.gradle
  configureBuildGradle()
  
  // 配置 AndroidManifest.xml
  configureAndroidManifest()
  
  console.log('✅ Android 项目配置完成')
}

/**
 * 配置应用图标
 */
function configureAppIcons() {
  console.log('🎨 配置应用图标...')
  
  const publicDir = join(rootDir, 'public')
  const androidResDir = join(rootDir, 'android', 'app', 'src', 'main', 'res')
  
  // 图标尺寸映射
  const iconSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
  }
  
  // 复制图标文件（这里假设已有对应尺寸的图标）
  Object.entries(iconSizes).forEach(([folder, size]) => {
    const targetDir = join(androidResDir, folder)
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }
    
    // 如果有对应尺寸的图标文件，复制它
    const iconFile = join(publicDir, `icon-${size === 192 ? '192' : size}.png`)
    if (existsSync(iconFile)) {
      copyFileSync(iconFile, join(targetDir, 'ic_launcher.png'))
      copyFileSync(iconFile, join(targetDir, 'ic_launcher_round.png'))
    }
  })
}

/**
 * 配置启动画面
 */
function configureSplashScreen() {
  console.log('🌅 配置启动画面...')
  
  const androidResDir = join(rootDir, 'android', 'app', 'src', 'main', 'res')
  
  // 创建启动画面资源目录
  const drawableDir = join(androidResDir, 'drawable')
  if (!existsSync(drawableDir)) {
    mkdirSync(drawableDir, { recursive: true })
  }
  
  // 创建启动画面 XML
  const splashXml = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_logo"/>
    </item>
</layer-list>`
  
  writeFileSync(join(drawableDir, 'splash.xml'), splashXml)
  
  // 创建颜色资源
  const valuesDir = join(androidResDir, 'values')
  if (!existsSync(valuesDir)) {
    mkdirSync(valuesDir, { recursive: true })
  }
  
  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#0f0f1e</color>
</resources>`
  
  writeFileSync(join(valuesDir, 'colors.xml'), colorsXml)
}

/**
 * 配置 build.gradle
 */
function configureBuildGradle() {
  console.log('📝 配置 build.gradle...')
  
  // 这里可以添加自定义的 Gradle 配置
  // 例如：签名配置、构建优化等
}

/**
 * 配置 AndroidManifest.xml
 */
function configureAndroidManifest() {
  console.log('📄 配置 AndroidManifest.xml...')
  
  // 这里可以添加自定义的 Manifest 配置
  // 例如：权限、主题、屏幕方向等
}

/**
 * 构建 APK
 */
function buildAPK() {
  console.log('🔨 构建 APK...')
  
  const androidDir = join(rootDir, 'android')
  
  // 构建命令
  let buildCommand = './gradlew'
  
  if (BUILD_CONFIG.buildType === 'release') {
    buildCommand += ' assembleRelease'
  } else {
    buildCommand += ' assembleDebug'
  }
  
  // 执行构建
  runCommand(buildCommand, { cwd: androidDir })
  
  // 查找生成的APK文件
  const apkDir = join(androidDir, 'app', 'build', 'outputs', 'apk', BUILD_CONFIG.buildType)
  const apkFiles = require('fs').readdirSync(apkDir).filter(file => file.endsWith('.apk'))
  
  if (apkFiles.length > 0) {
    console.log('✅ APK 构建成功!')
    console.log(`📦 APK 文件位置: ${join(apkDir, apkFiles[0])}`)
    
    // 显示APK信息
    showAPKInfo(join(apkDir, apkFiles[0]))
  } else {
    console.error('❌ 未找到生成的APK文件')
    process.exit(1)
  }
}

/**
 * 显示APK信息
 */
function showAPKInfo(apkPath) {
  console.log('\n📊 APK 信息:')
  
  try {
    // 获取文件大小
    const stats = require('fs').statSync(apkPath)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`文件大小: ${fileSizeInMB} MB`)
    
    // 使用 aapt 获取更多信息（如果可用）
    try {
      const aaptOutput = execSync(`aapt dump badging "${apkPath}"`, { encoding: 'utf8' })
      const versionMatch = aaptOutput.match(/versionName='([^']+)'/)
      const packageMatch = aaptOutput.match(/package: name='([^']+)'/)
      
      if (packageMatch) console.log(`包名: ${packageMatch[1]}`)
      if (versionMatch) console.log(`版本: ${versionMatch[1]}`)
    } catch (error) {
      console.log('无法获取详细APK信息 (aapt 不可用)')
    }
  } catch (error) {
    console.warn('无法获取APK信息:', error.message)
  }
}

/**
 * 主构建流程
 */
async function main() {
  console.log('🚀 开始构建 NeuroFlex APK...')
  console.log(`构建类型: ${BUILD_CONFIG.buildType}`)
  console.log(`架构: ${BUILD_CONFIG.architecture}`)
  
  try {
    // 1. 检查环境
    checkEnvironment()
    
    // 2. 构建 Web 应用
    buildWeb()
    
    // 3. 初始化 Capacitor
    initCapacitor()
    
    // 4. 同步项目
    syncCapacitor()
    
    // 5. 配置 Android 项目
    configureAndroid()
    
    // 6. 构建 APK
    buildAPK()
    
    console.log('\n🎉 APK 构建完成!')
    console.log('📱 现在可以安装到 Android 设备上进行测试')
    
  } catch (error) {
    console.error('\n❌ 构建失败:', error.message)
    process.exit(1)
  }
}

// 运行主流程
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}