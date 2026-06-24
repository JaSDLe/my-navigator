import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/main.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')

// PWA 自定义安装提示（兼容 Chrome/Edge 等，iOS 用分享菜单）
let deferredPrompt: Event | null = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  // 延迟显示安装提示，避免页面加载时打扰
  setTimeout(() => {
    if (deferredPrompt) {
      const installBtn = document.createElement('div')
      installBtn.innerHTML = '安装应用'
      installBtn.style.cssText =
        'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;' +
        'background:#409eff;color:#fff;padding:10px 24px;border-radius:20px;' +
        'font-size:14px;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,0.3);'
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          ;(deferredPrompt as any).prompt()
          const { outcome } = await (deferredPrompt as any).userChoice
          console.log(`PWA install: ${outcome}`)
          deferredPrompt = null
          installBtn.remove()
        }
      })
      document.body.appendChild(installBtn)
    }
  }, 3000)
})

