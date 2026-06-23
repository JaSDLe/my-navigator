<script setup lang="ts">
import { useSettingsStore, type ThemeMode } from '@/stores/settings'
import type { NavSection } from '@/config/nav'
import { ref, onMounted, onUnmounted } from 'vue'
import SettingsDrawer from '@/components/SettingsDrawer.vue'
import { Sunny, Moon, Monitor, Memo } from '@element-plus/icons-vue'

defineProps<{ sections: NavSection[] }>()

// 移除scrollToTop和refreshPage函数，使用Backtop组件

const store = useSettingsStore()
const showSettings = ref(false)

// 当前时间显示
const currentTime = ref('')
let timeInterval: NodeJS.Timeout | null = null

function updateTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 滚动到对应区域的函数
function scrollToSection(title: string) {
  const element = document.getElementById(title)
  if (element) {
    // 获取目标元素所在卡片的顶部位置
    const card = element.closest('.el-card') as HTMLElement | null
    const target = card || element
    const rect = target.getBoundingClientRect()
    const scrollTop = window.scrollY + rect.top - 72
    window.scrollTo({ top: scrollTop, behavior: 'smooth' })
  }
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<template>
  <el-header class="navbar">
    <div class="brand" @click="$router.push('/')">
      <img src="/favicon.png" alt="Favicon" class="favicon-icon" />
      <span class="brand-text">{{ store.siteTitle }}</span>
    </div>
    <div class="menu">
      <el-dropdown>
        <Memo class="menu-icon" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="(section, index) in sections"
              :key="index"
              @click="scrollToSection(section.title)"
            >
              {{ section.title }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="spacer"></div>
    <div class="version">v{{ store.version }}</div>
    <div class="datetime">{{ currentTime }}</div>
    <div class="actions">
      <el-dropdown @command="store.setThemeMode">
        <el-button size="large" circle>
          <el-icon size="18">
            <Sunny v-if="store.themeMode === 'light'" />
            <Moon v-else-if="store.themeMode === 'dark'" />
            <Monitor v-else />
          </el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="light" :class="{ 'is-active': store.themeMode === 'light' }">
              <el-icon><Sunny /></el-icon>
              <span>浅色模式</span>
            </el-dropdown-item>
            <el-dropdown-item command="dark" :class="{ 'is-active': store.themeMode === 'dark' }">
              <el-icon><Moon /></el-icon>
              <span>暗黑模式</span>
            </el-dropdown-item>
            <el-dropdown-item command="auto" :class="{ 'is-active': store.themeMode === 'auto' }">
              <el-icon><Monitor /></el-icon>
              <span>跟随系统</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="actions">
      <el-button type="primary" @click="showSettings = true">设置</el-button>
    </div>
  </el-header>
  <SettingsDrawer v-model="showSettings" />
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color);
  backdrop-filter: saturate(1.2) blur(6px);
  background-color: var(--el-bg-color);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
.brand {
  display: flex;
  align-items: center;
  font-weight: 700;
  color: var(--el-text-color-primary);
  cursor: pointer;
}
.favicon-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}
.brand-text {
  vertical-align: middle;
}
.menu {
  display: flex;
  align-items: center;
  margin-left: 10px;
}
.menu-icon {
  width: 20px;
}
.spacer {
  flex: 1;
}
.version {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-right: 16px;
}
.datetime {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-regular);
  margin-right: 16px;
  font-family: 'Courier New', monospace;
}
.actions {
  margin-right: 16px;
  /* margin-left: 8px; */
}
</style>
