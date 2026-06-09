<script setup lang="ts">
import type { DropdownInstance } from 'element-plus'
import type { NavSection } from '@/config/nav'
import { useSettingsStore } from '@/stores/settings'
import { ArrowRight } from '@element-plus/icons-vue'

defineProps<{ sections: NavSection[] }>()
const store = useSettingsStore()

const dropdownRefs = new Map<string, DropdownInstance>()

function dropdownRef(label: string) {
  return (el: DropdownInstance | null) => {
    if (el) {
      dropdownRefs.set(label, el)
    } else {
      dropdownRefs.delete(label)
    }
  }
}

function openDropdown(label: string) {
  dropdownRefs.get(label)?.handleOpen()
}

function open(url: string | string[]) {
  const urls = Array.isArray(url) ? url : [url]
  window.open(urls[0], '_blank', 'noopener')
}

function selectUrl(url: string) {
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
            <div v-for="link in section.links" :key="link.label" class="link-item">
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
              <el-dropdown
                v-if="Array.isArray(link.url) && link.url.length > 1"
                :ref="dropdownRef(link.label)"
                trigger="hover"
                @command="selectUrl"
              >
                <el-button-group size="large" @click="openDropdown(link.label)">
                  <el-button plain :dark="store.darkMode" :color="link.color">
                    <img :src="link.iconUrl" :alt="link.label" class="link-icon-img" />
                  </el-button>
                  <el-button :dark="store.darkMode" :color="link.color">
                    {{ link.label }}
                    <el-icon class="el-icon--right">
                      <ArrowRight />
                    </el-icon>
                  </el-button>
                </el-button-group>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="(u, idx) in link.url"
                      :key="idx"
                      :command="u"
                    >
                      {{ u }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button-group v-else @click="open(link.url)" size="large">
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
