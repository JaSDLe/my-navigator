import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { NAV_SECTIONS, SITE_TITLE, type NavSection } from '@/config/nav'

const STORAGE_KEY = 'my-navigator-settings-v1'

type PersistedState = {
  darkMode: boolean
  siteTitle: string
  settingsDrawerWidth: number
  sections: NavSection[]
  version: string
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function savePersisted(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const persisted = loadPersisted()

  const darkMode = ref<boolean>(persisted?.darkMode ?? false)
  const siteTitle = ref<string>(persisted?.siteTitle ?? SITE_TITLE)
  const settingsDrawerWidth = ref<number>(persisted?.settingsDrawerWidth ?? 420)
  const sections = ref<NavSection[]>(persisted?.sections ?? NAV_SECTIONS)
  const version = ref<string>(persisted?.version ?? (import.meta.env.VITE_APP_VERSION || '1.0.0'))
  const getDarkMode = computed(() => darkMode.value)

  function setDarkMode(val: boolean) {
    darkMode.value = val
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  function setSiteTitle(val: string) {
    siteTitle.value = val
  }

  function setSettingsDrawerWidth(val: number) {
    settingsDrawerWidth.value = val
  }

  function setSections(val: NavSection[]) {
    sections.value = val
  }

  function applyDocumentTheme() {
    document.documentElement.classList.toggle('dark', darkMode.value)
  }

  function resetToDefaults() {
    // 以当前代码中的默认配置为准
    darkMode.value = false
    siteTitle.value = SITE_TITLE
    version.value = (import.meta.env.VITE_APP_VERSION || '1.0.0')
    // 深拷贝，避免共享引用
    sections.value = JSON.parse(JSON.stringify(NAV_SECTIONS))
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    // 立即保存一次，使后续会话保持一致
    savePersisted({
      darkMode: darkMode.value,
      siteTitle: siteTitle.value,
      settingsDrawerWidth: settingsDrawerWidth.value,
      sections: sections.value,
      version: version.value,
    })
    applyDocumentTheme()
  }

  // persist + apply theme side effects
  watch(
    [darkMode, siteTitle, settingsDrawerWidth, sections, version],
    () => {
      savePersisted({
        darkMode: darkMode.value,
        siteTitle: siteTitle.value,
        settingsDrawerWidth: settingsDrawerWidth.value,
        sections: sections.value,
        version: version.value,
      })
      applyDocumentTheme()
    },
    { deep: true },
  )

  // initial apply
  applyDocumentTheme()

  return {
    darkMode,
    siteTitle,
    settingsDrawerWidth,
    sections,
    version,
    getDarkMode,
    setDarkMode,
    toggleDarkMode,
    setSiteTitle,
    setSettingsDrawerWidth,
    setSections,
    applyDocumentTheme,
    resetToDefaults,
  }
})
