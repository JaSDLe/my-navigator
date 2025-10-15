<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
// import type { NavSection, NavLink } from '@/config/nav' // 暂时未使用
// import * as ElementPlusIconsVue from '@element-plus/icons-vue' // 暂时未使用
import { Download, Search } from '@element-plus/icons-vue'
import type { ScrollbarInstance } from 'element-plus'
import { getFaviconUrl } from '@/utils/favicon'
import { ElMessage } from 'element-plus'
import type { NavLink } from '@/config/nav'

const scrollbarRef = ref<ScrollbarInstance>()

// 预定义颜色
const predefinedColors = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#feca57',
  '#ff9ff3',
  '#54a0ff',
  '#5f27cd',
  '#00d2d3',
  '#ff9f43',
]

// 图标列表（暂时未使用）
// const iconList = Object.keys(ElementPlusIconsVue).slice(0, 50) // 限制显示前50个图标

// 格式化时间
function formatTime(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return {
    short: `${year}-${month}-${day}`,
    full: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
  }
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
const activeNames = ref([])

const store = useSettingsStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

function addSection() {
  store.sections.push({ title: '新分组', links: [] })
}

function removeSection(index: number) {
  store.sections.splice(index, 1)
}

function addLink(index: number) {
  const section = store.sections[index]
  const now = new Date()
  const timeFormatted = formatTime(now)
  section.links.push({
    label: '新链接',
    url: 'https://example.com',
    updateTime: timeFormatted.short,
    fullUpdateTime: timeFormatted.full,
  })
}

function removeLink(sectionIndex: number, linkIndex: number) {
  store.sections[sectionIndex].links.splice(linkIndex, 1)
}

function updateLinkTime(sectionIndex: number, linkIndex: number) {
  const link = store.sections[sectionIndex].links[linkIndex]
  const now = new Date()
  const timeFormatted = formatTime(now)
  link.updateTime = timeFormatted.short
  link.fullUpdateTime = timeFormatted.full
}

// 获取网站图标
async function fetchFavicon(sectionIndex: number, linkIndex: number) {
  const link = store.sections[sectionIndex].links[linkIndex]

  if (!link.url || !link.url.startsWith('http')) {
    ElMessage.warning('请输入有效的网站链接')
    return
  }

  try {
    ElMessage.info('正在获取网站图标...')
    const faviconUrl = await getFaviconUrl(link.url)

    if (faviconUrl) {
      link.iconUrl = faviconUrl
      link.icon = '' // 清除Element Plus图标，使用网络图标
      updateLinkTime(sectionIndex, linkIndex)
      ElMessage.success('图标获取成功！')
    } else {
      ElMessage.error('未能获取到网站图标')
    }
  } catch (error) {
    console.error('获取图标失败:', error)
    ElMessage.error('获取图标失败，请检查网络连接')
  }
}

function onClose() {
  visible.value = false
}

const clearIcon = (link: NavLink) => {
  link.iconUrl = ''
  link.icon = ''
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :with-header="true"
    title="设置"
    :size="store.settingsDrawerWidth"
    :resizable="true"
    @close="onClose"
  >
    <template #default>
      <el-scrollbar ref="scrollbarRef">
        <el-form label-width="80px" label-position="left" ref="formRef" style="padding-top: 10px">
          <el-form-item label="设置宽度">
            <el-input-number
              v-model="store.settingsDrawerWidth"
              :step="5"
              step-strictly
              placeholder="请输入"
            />
          </el-form-item>
          <el-form-item label="站点标题">
            <el-input v-model="store.siteTitle" placeholder="输入站点标题" />
          </el-form-item>
          <el-divider content-position="left">分组与链接</el-divider>
          <el-collapse v-model="activeNames" expand-icon-position="left">
            <el-collapse-item
              v-for="(section, sIdx) in store.sections"
              :key="sIdx"
              :name="sIdx"
              style="margin: 10px 0"
            >
              <template #title>
                <div>
                  <el-form-item label="分组名称">
                    <el-input v-model="section.title" placeholder="分组标题" />
                  </el-form-item>
                  <el-button type="danger" link @click="removeSection(sIdx)">删除分组</el-button>
                </div>
              </template>
              <template #default>
                <div v-for="(link, lIdx) in section.links" :key="lIdx" style="margin: 10px 10px">
                  <el-card shadow="never">
                    <div>
                      <div>
                        <el-form-item label="名称">
                          <el-input
                            v-model="link.label"
                            placeholder="名称"
                            @input="updateLinkTime(sIdx, lIdx)"
                          />
                        </el-form-item>
                        <el-form-item label="链接">
                          <el-input
                            v-model="link.url"
                            placeholder="链接"
                            @input="updateLinkTime(sIdx, lIdx)"
                          />
                        </el-form-item>
                      </div>
                      <el-button type="danger" link @click="removeLink(sIdx, lIdx)">删除</el-button>
                    </div>

                    <div>
                      <el-form-item label="网络图标">
                        <el-input
                          v-model="link.iconUrl"
                          placeholder="输入图标URL或点击自动获取"
                          @input="updateLinkTime(sIdx, lIdx)"
                        >
                          <template #prepend>
                            <el-button
                              :icon="Search"
                              @click="fetchFavicon(sIdx, lIdx)"
                              :loading="false"
                              title="自动获取网站图标"
                            >
                              获取图标
                            </el-button>
                          </template>
                          <template #append>
                            <el-button
                              @click="clearIcon(link)"
                              v-if="link.iconUrl || link.icon"
                              title="清除图标"
                            >
                              清除
                            </el-button>
                          </template>
                        </el-input>
                        <div v-if="link.iconUrl" style="margin-top: 8px">
                          <img
                            :src="link.iconUrl"
                            :alt="link.label + ' 图标'"
                            style="width: 16px; height: 16px; border-radius: 2px; margin-right: 8px"
                            @error="link.iconUrl = ''"
                          />
                          <span style="font-size: 12px; color: var(--el-text-color-regular)"
                            >图标预览</span
                          >
                        </div>
                      </el-form-item>
                    </div>

                    <div>
                      <el-form-item label="颜色">
                        <el-color-picker
                          v-model="link.color"
                          show-alpha
                          :predefine="predefinedColors"
                          @change="updateLinkTime(sIdx, lIdx)"
                        />
                      </el-form-item>
                    </div>

                    <div v-if="link.updateTime" class="time-display">
                      <small>更新时间: {{ link.updateTime }}</small>
                    </div>
                  </el-card>
                </div>
                <el-button type="primary" plain @click="addLink(sIdx)">新增链接</el-button>
              </template>
            </el-collapse-item>
          </el-collapse>
        </el-form>
      </el-scrollbar>
    </template>
    <template #footer>
      <div class="footer-actions">
        <el-button type="warning" @click="store.resetToDefaults()">重置为默认</el-button>
        <el-button type="primary" @click="addSection">新增分组</el-button>
        <el-button type="success" @click="onClose">完成</el-button>
        <el-button
          :icon="Download"
          style="transform: rotate(180deg)"
          @click="scrollbarRef?.setScrollTop(0)"
        ></el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
/* 使抽屉内容区与表单在调整宽度时即时拉伸 */
:deep(.el-drawer__body) {
  display: block;
}
.drawer-form {
  width: 100%;
}
.section-card {
  width: 100%;
}
.card-header {
  display: flex;
  gap: 8px;
  align-items: center;
}
.card-header :deep(.el-input) {
  flex: 1;
  width: 100%;
}
/* 强制表单项内容区域占满行宽 */
:deep(.el-form-item) {
  width: 100%;
}
:deep(.el-form-item__content) {
  width: 100%;
}
.link-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: start;
}
.name-url {
  display: grid;
  grid-template-rows: auto auto;
  gap: 8px;
}
/* 让内部控件在抽屉变宽时自适应拉伸 */
.name-url :deep(.el-input),
.icon-config :deep(.el-input),
.color-config :deep(.el-input) {
  width: 100%;
}
.icon-config :deep(.el-select),
.color-config :deep(.el-color-picker) {
  width: 100%;
}
.sections {
  width: 100%;
}
.link-config {
  margin-bottom: 8px;
}
.icon-config,
.color-config {
  margin-top: 12px;
}
.time-display {
  margin-top: 8px;
  text-align: right;
  color: var(--el-text-color-placeholder);
}
.sections :deep(.el-card) {
  border-color: var(--el-border-color-light);
  width: 100%;
}
.footer-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style>
