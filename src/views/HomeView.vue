<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue'
import SectionGrid from '@/components/SectionGrid.vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

const store = useSettingsStore()
const { sections } = storeToRefs(store)
</script>

<template>
  <el-container class="layout">
    <AppNavbar :sections="sections" />
    <el-main class="main">
      <SectionGrid :sections="sections" />
    </el-main>
    <el-footer class="footer">
      <template #default>
        <div class="footer-content">Copyright © 2025-2026</div>
      </template>
    </el-footer>
  </el-container>
</template>

<style scoped>
.main {
  padding-top: 72px; /* 56px navbar + 16px spacing */
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
    padding-top: 56px; /* 48px navbar + 8px spacing */
  }
}
</style>
