<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { Download, Search } from '@element-plus/icons-vue'
import type { ScrollbarInstance } from 'element-plus'
import { getFaviconUrl } from '@/utils/favicon'
import { ElMessage } from 'element-plus'
import { NAV_SECTIONS, getPrimaryUrl, type NavLink } from '@/config/nav'
import ColorThief from 'colorthief'
import { getProxyImg } from '@/api/proxy'

const colorThief = new ColorThief()
const scrollbarRef = ref<ScrollbarInstance>()

// 预定义颜色
const predefinedColors = ref([
  'rgb(196, 30, 58)', // Pantone 19-1664 Classic Red（经典红）
  'rgb(15, 72, 127)', // Pantone 19-4053 Classic Blue（经典蓝）
  'rgb(240, 101, 72)', // Pantone 16-1546 Peach Fuzz（2024 年度色，桃粉色）
  'rgb(132, 177, 191)', // Pantone 14-4316 Serenity（宁静蓝）
  'rgb(245, 210, 190)', // Pantone 13-1520 Rose Quartz（石英粉）
  'rgb(29, 138, 113)', // Pantone 17-5641 Greenery（2017 年度色，清新绿）
  'rgb(214, 25, 36)', // Pantone 18-1664 True Red（正红）
  'rgb(96, 113, 165)', // Pantone 17-3938 Ultra Violet（2018 年度色，紫外光）
  'rgb(250, 214, 21)', // Pantone 13-0647 Illuminating（2021 年度色，明亮黄）
  'rgb(24, 24, 24)', // Pantone Black 6 C（经典黑）
  'rgb(245, 245, 245)', // Pantone White（纯白，用于对比）
  'rgb(102, 85, 70)', // Pantone 18-1246 Warm Taupe（暖灰褐）
  'rgb(173, 203, 197)', // Pantone 14-5710 Mint（薄荷绿）
  'rgb(205, 92, 92)', // Pantone 18-1564 Chili Pepper（辣椒红）
  'rgb(70, 130, 180)', // Pantone 19-4052 Navy Blue（海军蓝）
  'rgb(188, 143, 143)', // Pantone 16-1336 Rose Dust（玫瑰尘）
  'rgb(128, 128, 105)', // Pantone 17-0620 Olive Green（橄榄绿）
  'rgb(222, 184, 135)', // Pantone 13-0927 Desert Sand（沙漠沙）
  'rgb(83, 104, 125)', // Pantone 19-4023 Blue Indigo（靛蓝）
  'rgb(199, 181, 163)', // Pantone 13-0810 Pale Dogwood（淡山茱萸粉）
  'rgb(144, 147, 153)', // 灰蓝
  'rgb(170, 160, 150)', // 灰棕
  'rgb(180, 165, 160)', // 灰粉
  'rgb(130, 150, 140)', // 灰绿
  'rgb(160, 150, 170)', // 灰紫
  'rgb(190, 180, 160)', // 燕麦色
  'rgb(150, 170, 180)', // 雾霾蓝
  'rgb(175, 160, 155)', // 豆沙红
  'rgb(140, 155, 145)', // 鼠尾草绿
  'rgb(185, 175, 165)', // 浅卡其
  'rgb(165, 155, 175)', // 灰薰衣草
  'rgb(155, 145, 135)', // 水泥灰
  'rgb(170, 185, 180)', // 灰青
  'rgb(195, 185, 180)', // 奶油灰粉
  'rgb(145, 160, 170)', // 高级灰蓝
  'rgb(160, 140, 130)', // 陶土灰
  'rgb(180, 190, 185)', // 冷灰白
  'rgb(150, 140, 150)', // 灰玫瑰
  'rgb(175, 185, 170)', // 灰橄榄
  'rgb(165, 160, 150)', // 中性灰褐
])
const btnLoading = ref(false)

function addUrlItem(sectionIndex: number, linkIndex: number) {
  const link = store.sections[sectionIndex].links[linkIndex]
  if (!Array.isArray(link.url)) {
    link.url = [link.url as string]
  }
  link.url = [...link.url, '']
}

function removeUrlItem(sectionIndex: number, linkIndex: number, idx: number) {
  const link = store.sections[sectionIndex].links[linkIndex]
  if (!Array.isArray(link.url)) return
  link.url.splice(idx, 1)
  if (link.url.length <= 1) {
    link.url = link.url[0]
  }
}

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

async function getThemeColor(sectionIndex: number, linkIndex: number) {
  const link = store.sections[sectionIndex].links[linkIndex]
  if (link?.iconUrl) {
    try {
      btnLoading.value = true

      let imageUrl: string

      // 本地路径直接使用，远程URL走代理避免CORS
      if (link.iconUrl.startsWith('/')) {
        imageUrl = link.iconUrl
      } else {
        const response = await getProxyImg(link.iconUrl)
        const blob = response.data
        imageUrl = URL.createObjectURL(blob)
      }

      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = imageUrl
      
      img.addEventListener('load', function () {
        try {
          const paletteRes = colorThief.getPalette(img)
          console.log('getPalette', paletteRes)
          console.log('predefinedColors', predefinedColors.value)
          if (paletteRes) {
            // 去重
            const uniqueColors = Array.from(
              new Set(paletteRes.map((arr: number[]) => JSON.stringify(arr))),
            ).map((str) => JSON.parse(str))
            predefinedColors.value = uniqueColors.map((v: number[]) => `rgb(${v[0]}, ${v[1]}, ${v[2]})`)
            console.log('new predefinedColors', predefinedColors.value)
          }
        } catch (error) {
          console.error('提取颜色失败:', error)
          ElMessage.error('提取颜色失败')
        } finally {
          // 只有 blob URL 需要释放
          if (imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl)
          }
          btnLoading.value = false
        }
      })
      
      img.addEventListener('error', function () {
        console.error('图片加载失败')
        ElMessage.error('图片加载失败')
        if (imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl)
        }
        btnLoading.value = false
      })
    } catch (error) {
      console.error('获取图片失败:', error)
      ElMessage.error('获取图片失败，请检查网络连接或图片URL')
      btnLoading.value = false
    }
  }
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

  const primaryUrl = getPrimaryUrl(link.url)
  if (!primaryUrl || !primaryUrl.startsWith('http')) {
    ElMessage.warning('请输入有效的网站链接')
    return
  }

  try {
    ElMessage.info('正在获取网站图标...')
    const faviconUrl = await getFaviconUrl(primaryUrl)

    if (faviconUrl) {
      link.iconUrl = faviconUrl
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

// 窗口宽度，用于动态计算 drawer 最大宽度
const windowWidth = ref(window.innerWidth)
function onWindowResize() {
  windowWidth.value = window.innerWidth
}
onMounted(() => window.addEventListener('resize', onWindowResize))
onUnmounted(() => window.removeEventListener('resize', onWindowResize))

// 最小 260px，最大为屏幕宽度的 90%
const drawerMaxWidth = computed(() => Math.floor(windowWidth.value * 0.9))

// 拖拽调整宽度结束后同步到 store，并限制范围
function onDrawerResize(_evt: MouseEvent, size: number) {
  store.settingsDrawerWidth = Math.max(260, Math.min(size, drawerMaxWidth.value))
}

const clearIcon = (link: NavLink) => {
  link.iconUrl = ''
}

const resetIcon = (sectionIndex: number, linkIndex: number) => {
  const link = store.sections[sectionIndex].links[linkIndex]
  const sections = JSON.parse(JSON.stringify(NAV_SECTIONS))
  link.iconUrl = sections[sectionIndex].links[linkIndex].iconUrl
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
    @resize-end="onDrawerResize"
  >
    <template #default>
      <el-scrollbar ref="scrollbarRef">
        <el-form label-width="80px" label-position="left" ref="formRef" style="padding-top: 10px">
          <el-form-item label="设置宽度">
            <el-input-number
              v-model="store.settingsDrawerWidth"
              :step="5"
              :min="260"
              :max="drawerMaxWidth"
              step-strictly
              placeholder="请输入"
            />
          </el-form-item>
          <el-form-item label="站点标题">
            <el-input v-model="store.siteTitle" placeholder="输入站点标题" />
          </el-form-item>
          <el-divider content-position="left">后端配置</el-divider>
          <el-form-item label="请求URL">
            <el-input v-model="store.requestUrl" placeholder="输入请求URL" />
          </el-form-item>
          <el-form-item label="Token">
            <el-input
              v-model="store.token"
              placeholder="输入认证Token"
              type="password"
              show-password
            />
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
                           <div style="display: flex; flex-direction: column; gap: 6px">
                             <template v-if="Array.isArray(link.url)">
                               <div v-for="(u, idx) in link.url" :key="idx" style="display: flex; gap: 6px; align-items: center">
                                 <el-input
                                   v-model="link.url[idx]"
                                   placeholder="链接"
                                   @input="updateLinkTime(sIdx, lIdx)"
                                 />
                                 <el-button
                                   v-if="link.url.length > 1"
                                   type="danger"
                                   link
                                   @click="removeUrlItem(sIdx, lIdx, idx)"
                                 >
                                   删除
                                 </el-button>
                               </div>
                             </template>
                             <template v-else>
                               <el-input
                                 v-model="link.url"
                                 placeholder="链接"
                                 @input="updateLinkTime(sIdx, lIdx)"
                               />
                             </template>
                             <el-button type="primary" link @click="addUrlItem(sIdx, lIdx)">
                               新增链接
                             </el-button>
                           </div>
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
                              v-if="link.iconUrl"
                              title="清除图标"
                            >
                              清除
                            </el-button>
                            <el-button @click="resetIcon(sIdx, lIdx)" v-else title="恢复默认">
                              重置
                            </el-button>
                          </template>
                        </el-input>
                        <div
                          v-if="link.iconUrl"
                          style="margin-top: 4px; font-size: 12px; color: var(--el-text-color-placeholder)"
                        >
                          <template v-if="link.iconUrl.startsWith('/')">
                            当前为本地路径图标
                          </template>
                          <template v-else>
                            当前为远程URL图标
                          </template>
                        </div>
                        <div
                          v-if="link.iconUrl"
                          style="margin-top: 8px; display: flex; align-items: center"
                        >
                          <div
                            style="
                              font-size: 12px;
                              margin-right: 8px;
                              color: var(--el-text-color-regular);
                            "
                          >
                            图标预览
                          </div>
                          <img
                            :src="link.iconUrl"
                            :alt="link.label + ' 图标'"
                            style="height: 16px; margin-right: 8px"
                            @error="link.iconUrl = ''"
                          />
                          <img
                            :src="link.iconUrl"
                            :alt="link.label + ' 图标'"
                            style="height: 32px; margin-right: 8px"
                            @error="link.iconUrl = ''"
                          />
                          <img
                            :src="link.iconUrl"
                            :alt="link.label + ' 图标'"
                            style="height: 64px; margin-right: 8px"
                            @error="link.iconUrl = ''"
                          />
                          <img
                            :src="link.iconUrl"
                            :alt="link.label + ' 图标'"
                            style="height: 128px; margin-right: 8px"
                            :id="`imgId${sIdx}${lIdx}`"
                            @error="link.iconUrl = ''"
                          />
                        </div>
                      </el-form-item>
                    </div>

                    <div style="display: flex; align-items: baseline">
                      <el-form-item label="颜色">
                        <el-color-picker
                          v-model="link.color"
                          size="large"
                          show-alpha
                          :predefine="predefinedColors"
                          @change="updateLinkTime(sIdx, lIdx)"
                        />
                      </el-form-item>
                      <el-button
                        size="small"
                        :loading="btnLoading"
                        :disabled="!link.iconUrl"
                        @click="getThemeColor(sIdx, lIdx)"
                        >获取主题色</el-button
                      >
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
