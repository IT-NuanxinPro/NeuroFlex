import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 全局样式
import './styles/global.scss'

// 移动端视口修复
import { initViewportFix } from './utils/viewport'

// APK环境适配
import { initAPKAdapter } from './utils/apk-adapter'

// 开发环境调试工具
if (process.env.NODE_ENV === 'development') {
  import('./utils/debug-viewport.js')
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化视口修复
initViewportFix()

// 初始化APK适配
initAPKAdapter()

app.mount('#app')
