<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { ref, onMounted, onUnmounted } from 'vue'
import SettingsDrawer from '@/components/SettingsDrawer.vue'
import { Sunny, Moon } from '@element-plus/icons-vue'

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
    <div class="brand">{{ store.siteTitle }}</div>
    <div class="spacer"></div>
    <div class="datetime">{{ currentTime }}</div>
    <div class="actions">
      <el-switch v-model="store.darkMode" size="large" :active-icon="Moon" :inactive-icon="Sunny" />
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
  /* position: fixed;
  top: 0;
  left: 0;
  right: 0; */
  z-index: 1000;
}
.brand {
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.spacer {
  flex: 1;
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
