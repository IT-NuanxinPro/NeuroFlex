#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 NeuroFlex Android 本地构建和发布脚本...');

// 解析命令行参数
const args = process.argv.slice(2);
const shouldRelease = args.includes('--release');
const isDryRun = args.includes('--dry-run');

/**
 * 执行命令并显示输出
 */
function runCommand(command, options = {}) {
  console.log(`\n🔨 执行: ${command}`);
  if (isDryRun) {
    console.log('   (dry-run 模式，跳过执行)');
    return '';
  }
  return execSync(command, { stdio: 'inherit', ...options });
}

/**
 * 获取当前 Android 版本
 */
function getAndroidVersion() {
  const buildGradlePath = 'android/app/build.gradle';
  const content = fs.readFileSync(buildGradlePath, 'utf-8');
  const versionMatch = content.match(/versionName\s+"([^"]+)"/);
  return versionMatch ? versionMatch[1] : null;
}

/**
 * 检查 APK 文件是否存在
 */
function checkApkExists(version) {
  const apkPath = `android/app/build/outputs/apk/release/NeuroFlex-v${version}.apk`;
  return fs.existsSync(apkPath);
}

/**
 * 检查 gh CLI 是否已安装和认证
 */
function checkGhCli() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('❌ GitHub CLI 未安装或未认证');
    console.log('   请先安装: brew install gh');
    console.log('   然后认证: gh auth login');
    return false;
  }
}

/**
 * 检查是否有未提交的更改
 */
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      console.log('⚠️ 检测到未提交的更改:');
      console.log(status);
      console.log('建议先提交更改再发布');
      return false;
    }
    return true;
  } catch (error) {
    console.log('❌ Git 状态检查失败');
    return false;
  }
}

try {
  // 1. 获取版本信息
  const version = getAndroidVersion();
  if (!version) {
    throw new Error('无法从 build.gradle 获取版本号');
  }
  console.log(`📱 当前 Android 版本: ${version}`);

  // 2. 构建前检查
  if (shouldRelease) {
    console.log('\n🔍 发布前检查...');
    
    if (!checkGhCli()) {
      process.exit(1);
    }
    
    if (!checkGitStatus()) {
      console.log('继续发布请使用 --force 参数（不推荐）');
      if (!args.includes('--force')) {
        process.exit(1);
      }
    }
  }

  // 3. 构建流程
  console.log('\n📦 开始构建流程...');
  
  // 清理构建缓存
  console.log('🧹 清理构建缓存...');
  runCommand('./gradlew clean', { cwd: 'android' });
  
  // 构建 web 资源
  console.log('🌐 构建 web 资源...');
  runCommand('DISABLE_CDN=true npm run build');

  // 同步 Capacitor
  console.log('📱 同步 Capacitor...');
  runCommand('npx cap sync android');

  // 构建 APK
  console.log('🔨 构建 APK...');
  runCommand('./gradlew assembleRelease', { cwd: 'android' });

  // 4. 检查构建结果
  const apkPath = `android/app/build/outputs/apk/release/NeuroFlex-v${version}.apk`;
  if (!checkApkExists(version)) {
    throw new Error(`APK 文件不存在: ${apkPath}`);
  }

  const stats = fs.statSync(apkPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ APK 构建成功!`);
  console.log(`   文件: ${apkPath}`);
  console.log(`   大小: ${sizeMB} MB`);

  // 5. 发布到 GitHub Release
  if (shouldRelease) {
    console.log('\n🚀 发布到 GitHub Release...');
    
    const tagName = `android-v${version}`;
    const releaseTitle = `Android v${version}`;
    const releaseNotes = `## NeuroFlex Android v${version}

### 📱 下载
点击下方 APK 文件下载安装

### 📋 更新内容
- 版本 ${version} 发布
- 请查看最近的 commit 记录了解详细更新

### 🔧 技术信息
- 构建时间: ${new Date().toLocaleString('zh-CN')}
- APK 大小: ${sizeMB} MB`;

    // 创建 tag（如果不存在）
    try {
      runCommand(`git tag ${tagName}`);
      runCommand(`git push origin ${tagName}`);
      console.log(`✅ Tag ${tagName} 已创建并推送`);
    } catch (error) {
      console.log(`ℹ️ Tag ${tagName} 可能已存在，继续发布...`);
    }

    // 检查 Release 是否已存在
    let releaseExists = false;
    try {
      execSync(`gh release view ${tagName}`, { stdio: 'pipe' });
      releaseExists = true;
      console.log(`ℹ️ Release ${tagName} 已存在，将覆盖 APK`);
    } catch (error) {
      console.log(`ℹ️ Release ${tagName} 不存在，将创建新的 Release`);
    }

    if (releaseExists) {
      // 删除现有的 APK 文件（如果存在）
      const apkName = `NeuroFlex-v${version}.apk`;
      try {
        runCommand(`gh release delete-asset ${tagName} ${apkName} --yes`);
        console.log(`🗑️ 已删除现有的 ${apkName}`);
      } catch (error) {
        console.log(`ℹ️ 现有 APK 不存在，直接上传`);
      }
      
      // 上传新的 APK
      runCommand(`gh release upload ${tagName} "${apkPath}"`);
    } else {
      // 创建新的 Release
      runCommand(`gh release create ${tagName} --title "${releaseTitle}" --notes "${releaseNotes}"`);
      
      // 上传 APK
      runCommand(`gh release upload ${tagName} "${apkPath}"`);
    }
    
    console.log(`\n🎉 发布成功!`);
    console.log(`   Release: https://github.com/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/releases/tag/${tagName}`);
  }

  console.log('\n✨ 所有任务完成!');
  
  if (!shouldRelease) {
    console.log('\n💡 提示:');
    console.log(`   要发布到 GitHub Release，请运行:`);
    console.log(`   node scripts/build-and-release.js --release`);
  }

} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  process.exit(1);
}