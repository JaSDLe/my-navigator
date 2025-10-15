<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import type { NavSection } from '@/config/nav'
import { useSettingsStore } from '@/stores/settings'

defineProps<{ sections: NavSection[] }>()
const store = useSettingsStore()

onMounted(() => {})

function open(url: string) {
  window.open(url, '_blank', 'noopener')
}
</script>

<template>
  <el-row :gutter="16">
    <el-col
      v-for="section in sections"
      :key="section.title"
      :xs="24"
      :sm="12"
      :md="8"
      :lg="6"
      :xl="6"
    >
      <el-card class="section">
        <template #header>
          <div class="section-title">{{ section.title }}</div>
        </template>
        <el-space direction="vertical" alignment="stretch" :size="8" fill>
          <div v-for="link in section.links" :key="link.url" class="link-item">
            <el-button
              :href="link.url"
              :title="link.url"
              :type="link.color ? 'primary' : 'primary'"
              :plain="!link.color"
              :style="
                link.color
                  ? { backgroundColor: link.color, borderColor: link.color, color: '#fff' }
                  : {}
              "
              @click="open(link.url)"
              class="link-button"
            >
              <el-icon v-if="link.icon" class="link-icon">
                <component :is="link.icon" />
              </el-icon>
              <img
                v-else-if="link.iconUrl"
                :src="link.iconUrl"
                :alt="link.label"
                class="link-icon-img"
              />
              {{ link.label }}
            </el-button>
            <el-tooltip
              v-if="link.updateTime"
              ref="popperRef"
              placement="right"
              :content="link.fullUpdateTime"
            >
              <template #default>
                <el-text type="info">{{ link.updateTime }}</el-text>
              </template>
            </el-tooltip>
          </div>
        </el-space>
      </el-card>
    </el-col>
  </el-row>
  <!-- Backtop 回到顶部组件 -->
  <el-backtop :right="100" :bottom="100" />
</template>

<style scoped>
.section {
  margin-bottom: 16px;
}
.section-title {
  font-weight: 600;
}
.link-item {
  position: relative;
}
.link-button {
  width: 100%;
  justify-content: flex-start;
  position: relative;
  display: flex;
  align-items: center;
}
.link-icon {
  margin-right: 8px;
  font-size: 16px;
}
.link-icon-img {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-radius: 2px;
}
.update-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
  text-align: right;
  margin-top: 4px;
  padding-right: 8px;
}
</style>
