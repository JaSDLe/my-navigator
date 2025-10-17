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
        <div class="footer-content">Copyright © 2025</div>
      </template>
    </el-footer>
  </el-container>
</template>

<style scoped>
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
</style>
