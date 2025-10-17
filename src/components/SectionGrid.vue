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
  <div>
    <el-row :gutter="16" style="padding-left: 8px; margin-top: 8px; margin-right: 8px">
      <el-col v-for="(section, index) in sections" :key="index">
        <el-card class="section">
          <template #header>
            <div class="section-title" :id="section.title">{{ section.title }}</div>
          </template>
          <div class="section-container">
            <div v-for="link in section.links" :key="link.url" class="link-item">
              <!-- <el-button
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
                <img :src="link.iconUrl" :alt="link.label" class="link-icon-img" />
                {{ link.label }}
              </el-button> -->
              <el-button-group @click="open(link.url)" size="large">
                <el-button plain :dark="store.darkMode" :color="link.color">
                  <img :src="link.iconUrl" :alt="link.label" class="link-icon-img" />
                </el-button>
                <el-button :dark="store.darkMode" :color="link.color">
                  {{ link.label }}
                </el-button>
              </el-button-group>
              <el-tooltip v-if="link.updateTime" placement="right" :content="link.fullUpdateTime">
                <template #default>
                  <div class="update-time-container">
                    <el-text type="info" size="small">{{ link.updateTime }}</el-text>
                  </div>
                </template>
              </el-tooltip>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
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
.section-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}
.link-item {
  width: 100%;
  margin-right: 8px;
  margin-bottom: 8px;
  flex: 0 0 auto;
  max-width: max-content;
}
.link-button {
  width: 100%;
  justify-content: flex-start;
  position: relative;
  display: flex;
  align-items: center;
}
.link-icon-img {
  width: 18px;
  border-radius: 2px;
}
.update-time-container {
  align-self: flex-end;
  width: fit-content;
}
</style>
