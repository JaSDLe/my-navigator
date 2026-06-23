import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { NAV_SECTIONS, SITE_TITLE, type NavSection } from '@/config/nav'

const STORAGE_KEY = 'my-navigator-settings-v1'

export type ThemeMode = 'light' | 'dark' | 'auto'

type PersistedState = {
  themeMode: ThemeMode
  siteTitle: string
  settingsDrawerWidth: number
  sections: NavSection[]
  version: string
  requestUrl: string
  token: string
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

  // 兼容旧版 darkMode: boolean → themeMode: 'light' | 'dark' | 'auto'
  const themeMode = ref<ThemeMode>(
    persisted?.themeMode ??
    (persisted?.darkMode ? 'dark' : 'auto')
  )
  const siteTitle = ref<string>(persisted?.siteTitle ?? SITE_TITLE)
  const settingsDrawerWidth = ref<number>(persisted?.settingsDrawerWidth ?? 420)
  const sections = ref<NavSection[]>(persisted?.sections ?? NAV_SECTIONS)
  const version = ref<string>(persisted?.version ?? (import.meta.env.VITE_APP_VERSION || '1.0.0'))
  const requestUrl = ref<string>(persisted?.requestUrl ?? '')
  const token = ref<string>(persisted?.token ?? '')

  // 是否实际处于暗黑模式（auto 时跟随系统）
  const isDark = computed(() => {
    if (themeMode.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return themeMode.value === 'dark'
  })

  function setThemeMode(val: ThemeMode) {
    themeMode.value = val
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
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  // 监听系统主题变化（仅在 auto 模式下需要响应）
  const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  function onSystemThemeChange() {
    if (themeMode.value === 'auto') {
      applyDocumentTheme()
    }
  }
  systemDarkQuery.addEventListener('change', onSystemThemeChange)

  function resetToDefaults() {
    themeMode.value = 'auto'
    siteTitle.value = SITE_TITLE
    version.value = (import.meta.env.VITE_APP_VERSION || '1.0.0')
    requestUrl.value = ''
    token.value = ''
    sections.value = JSON.parse(JSON.stringify(NAV_SECTIONS))
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    savePersisted({
      themeMode: themeMode.value,
      siteTitle: siteTitle.value,
      settingsDrawerWidth: settingsDrawerWidth.value,
      sections: sections.value,
      version: version.value,
      requestUrl: requestUrl.value,
      token: token.value,
    })
    applyDocumentTheme()
  }

  function setRequestUrl(val: string) {
    requestUrl.value = val
  }

  function setToken(val: string) {
    token.value = val
  }

  // persist + apply theme side effects
  watch(
    [themeMode, siteTitle, settingsDrawerWidth, sections, version, requestUrl, token],
    () => {
      savePersisted({
        themeMode: themeMode.value,
        siteTitle: siteTitle.value,
        settingsDrawerWidth: settingsDrawerWidth.value,
        sections: sections.value,
        version: version.value,
        requestUrl: requestUrl.value,
        token: token.value,
      })
      applyDocumentTheme()
    },
    { deep: true },
  )

  // initial apply
  applyDocumentTheme()

  return {
    themeMode,
    isDark,
    siteTitle,
    settingsDrawerWidth,
    sections,
    version,
    requestUrl,
    token,
    setThemeMode,
    setSiteTitle,
    setSettingsDrawerWidth,
    setSections,
    setRequestUrl,
    setToken,
    applyDocumentTheme,
    resetToDefaults,
  }
})
