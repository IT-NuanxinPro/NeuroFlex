/**
 * Capacitor 配置文件
 * @type {import('@capacitor/cli').CapacitorConfig}
 */
const config = {
  appId: 'com.neuroflex.app',
  appName: 'NeuroFlex',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f0f1e',
      overlaysWebView: false
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f0f1e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    },
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    captureInput: true
  },
  ios: {
    scheme: 'NeuroFlex',
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#0f0f1e'
  }
}

export default config