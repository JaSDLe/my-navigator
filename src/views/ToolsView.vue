<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NetworkChecker from '@/components/NetworkChecker.vue'
import TimestampConverter from '@/components/TimestampConverter.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'

const store = useSettingsStore()
const { sections } = storeToRefs(store)

const activeTab = ref('ip')

onMounted(() => {
  const tab = new URLSearchParams(window.location.search).get('tab')
  if (tab === 'timestamp') activeTab.value = 'timestamp'
  else if (tab === 'ip' || tab === 'network') activeTab.value = 'ip'
})
</script>

<template>
  <el-container class="layout">
    <AppNavbar :sections="sections" />
    <el-main class="main">
      <div class="tools-header">
        <h2 class="tools-title">在线工具</h2>
      </div>

      <el-tabs v-model="activeTab" class="tools-tabs">
        <el-tab-pane label="网络环境" name="ip">
          <NetworkChecker />
        </el-tab-pane>
        <el-tab-pane label="时间戳转换" name="timestamp">
          <TimestampConverter />
        </el-tab-pane>
      </el-tabs>
    </el-main>
    <el-footer class="footer">
      <div class="footer-content">Copyright © 2025-2026</div>
    </el-footer>
  </el-container>
</template>

<style scoped>
.main {
  padding-top: 72px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.tools-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.tools-title {
  margin: 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.tools-tabs {
  margin-top: 8px;
}

.footer {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-content {
  text-align: center;
  color: var(--el-text-color-regular);
}

@media (max-width: 640px) {
  .main {
    padding-top: 56px;
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
