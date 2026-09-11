<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Timer, CopyDocument, Refresh } from '@element-plus/icons-vue'

// ---------- 当前时间戳 ----------
const nowSec = ref(Math.floor(Date.now() / 1000))
const nowMs = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | null = null

function refreshNow() {
  const t = Date.now()
  nowMs.value = t
  nowSec.value = Math.floor(t / 1000)
}

onMounted(() => {
  refreshNow()
  tickTimer = setInterval(refreshNow, 1000)
})
onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
})

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

// ---------- 时间戳 → 日期 ----------
const tsInput = ref('')
const tsUnit = ref<'s' | 'ms'>('s')

// 10 位默认秒，13 位默认毫秒
watch(tsInput, (val) => {
  const raw = val.trim()
  if (/^-?\d{13}$/.test(raw)) tsUnit.value = 'ms'
  else if (/^-?\d{10}$/.test(raw)) tsUnit.value = 's'
})

const tsParseResult = computed((): { date: Date | null; error: string } => {
  const raw = tsInput.value.trim()
  if (!raw) return { date: null, error: '' }

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    return { date: null, error: '请输入有效数字' }
  }

  const num = Number(raw)
  const ms = tsUnit.value === 's' ? num * 1000 : num
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) {
    return { date: null, error: '时间戳超出有效范围' }
  }
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) {
    return { date: null, error: '无效时间戳' }
  }
  return { date: d, error: '' }
})

const parsedDate = computed(() => tsParseResult.value.date)
const tsError = computed(() => tsParseResult.value.error)

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0')
}

function formatInTz(d: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  // en-CA 下 hour 可能是 24，统一成 00
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`
}

function tzOffsetLabel(d: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  })
  const tz = dtf.formatToParts(d).find((p) => p.type === 'timeZoneName')?.value
  return tz ?? ''
}

const tsResults = computed(() => {
  const d = parsedDate.value
  if (!d) return []

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return [
    { label: '本地时间', value: formatInTz(d), extra: tzOffsetLabel(d, localTz) },
    { label: 'UTC 时间', value: formatInTz(d, 'UTC'), extra: 'UTC' },
    { label: '北京时间', value: formatInTz(d, 'Asia/Shanghai'), extra: 'UTC+8' },
    { label: 'ISO 8601', value: d.toISOString(), extra: 'UTC' },
    {
      label: '相对时间',
      value: relativeTime(d),
      extra: '',
    },
  ]
})

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime()
  const abs = Math.abs(diff)
  const sec = Math.floor(abs / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)

  let unitText: string
  if (sec < 60) unitText = `${sec} 秒`
  else if (min < 60) unitText = `${min} 分钟`
  else if (hour < 24) unitText = `${hour} 小时`
  else if (day < 365) unitText = `${day} 天`
  else unitText = `${Math.floor(day / 365)} 年`

  return diff >= 0 ? `${unitText}前` : `${unitText}后`
}

function useCurrentTimestamp() {
  tsUnit.value = 's'
  tsInput.value = String(nowSec.value)
}

// ---------- 日期 → 时间戳 ----------
const dateInput = ref('')

function useNowForDate() {
  const d = new Date()
  dateInput.value = toLocalInputValue(d)
}

function toLocalInputValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
  useNowForDate()
})

const dateResults = computed(() => {
  const raw = dateInput.value.trim()
  if (!raw) return null

  // datetime-local 值按本地时区解析
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) {
    return null
  }
  return [
    { label: '秒级时间戳', value: String(Math.floor(d.getTime() / 1000)) },
    { label: '毫秒级时间戳', value: String(d.getTime()) },
    { label: 'ISO 8601', value: d.toISOString() },
    { label: '北京时间', value: formatInTz(d, 'Asia/Shanghai') },
  ]
})

// ---------- 各语言代码示例 ----------
const langCode = ref('javascript')

const CODE_SNIPPETS: Record<string, { label: string; code: string }> = {
  javascript: {
    label: 'JavaScript',
    code: `// 秒
Math.round(new Date() / 1000)
// 毫秒
Date.now()`,
  },
  typescript: {
    label: 'TypeScript',
    code: `const tsSec: number = Math.floor(Date.now() / 1000)
const tsMs: number = Date.now()`,
  },
  python: {
    label: 'Python',
    code: `import time
# 秒（浮点）
time.time()
# 毫秒
int(time.time() * 1000)

from datetime import datetime, timezone
datetime.now(timezone.utc).timestamp()`,
  },
  java: {
    label: 'Java',
    code: `// 毫秒
System.currentTimeMillis()
// Java 8+
Instant.now().getEpochSecond()
Instant.now().toEpochMilli()`,
  },
  go: {
    label: 'Go',
    code: `import "time"

sec := time.Now().Unix()
ms := time.Now().UnixMilli()`,
  },
  rust: {
    label: 'Rust',
    code: `use std::time::{SystemTime, UNIX_EPOCH};

let ts = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs();`,
  },
  c: {
    label: 'C',
    code: `#include <sys/time.h>

struct timeval tv;
gettimeofday(&tv, NULL);
// 秒: tv.tv_sec
// 毫秒: tv.tv_sec * 1000LL + tv.tv_usec / 1000`,
  },
  'c#': {
    label: 'C# / .NET',
    code: `// 秒
DateTimeOffset.UtcNow.ToUnixTimeSeconds();
// 毫秒
DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();`,
  },
  php: {
    label: 'PHP',
    code: `<?php
// 秒
time();
// 毫秒
(int) (microtime(true) * 1000);`,
  },
  ruby: {
    label: 'Ruby',
    code: `Time.now.to_i          # 秒
Time.now.to_f * 1000   # 毫秒`,
  },
  shell: {
    label: 'Shell',
    code: `date +%s              # 秒
date +%s%3N           # 毫秒 (GNU date)
python3 -c 'import time; print(int(time.time()*1000))'`,
  },
  mysql: {
    label: 'MySQL',
    code: `SELECT UNIX_TIMESTAMP(NOW());
SELECT ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000);`,
  },
  sqlite: {
    label: 'SQLite',
    code: `SELECT strftime('%s', 'now');
SELECT strftime('%s', 'now') || '000'; -- 近似毫秒`,
  },
  swift: {
    label: 'Swift',
    code: `Date().timeIntervalSince1970           // 秒
Int(Date().timeIntervalSince1970 * 1000) // 毫秒`,
  },
  kotlin: {
    label: 'Kotlin',
    code: `System.currentTimeMillis() / 1000     // 秒
System.currentTimeMillis()            // 毫秒`,
  },
  dart: {
    label: 'Dart',
    code: `DateTime.now().millisecondsSinceEpoch // 毫秒
(DateTime.now().millisecondsSinceEpoch / 1000).truncate() // 秒`,
  },
}

const langList = computed(() =>
  Object.entries(CODE_SNIPPETS).map(([key, item]) => ({ key, label: item.label })),
)

const currentCode = computed(() => CODE_SNIPPETS[langCode.value]?.code ?? '')
</script>

<template>
  <div class="timestamp-converter">
    <!-- 当前时间戳 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Timer /></el-icon>
            当前时间戳
          </span>
          <el-button size="small" text @click="refreshNow">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <div class="now-grid">
        <div class="now-item">
          <div class="now-label">秒级（10 位）</div>
          <div class="now-value">
            <code>{{ nowSec }}</code>
            <el-button text size="small" @click="copyText(String(nowSec))">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="now-item">
          <div class="now-label">毫秒级（13 位）</div>
          <div class="now-value">
            <code>{{ nowMs }}</code>
            <el-button text size="small" @click="copyText(String(nowMs))">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="now-item">
          <div class="now-label">本地时间</div>
          <div class="now-value">
            <code>{{ formatInTz(new Date(nowMs)) }}</code>
          </div>
        </div>
        <div class="now-item">
          <div class="now-label">北京时间</div>
          <div class="now-value">
            <code>{{ formatInTz(new Date(nowMs), 'Asia/Shanghai') }}</code>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 时间戳 → 日期 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">时间戳 → 日期</span>
        </div>
      </template>
      <div class="convert-row">
        <el-input
          v-model="tsInput"
          placeholder="例如：1700000000"
          clearable
          class="convert-input"
        >
          <template #prepend>
            <el-select v-model="tsUnit" style="width: 96px">
              <el-option label="秒" value="s" />
              <el-option label="毫秒" value="ms" />
            </el-select>
          </template>
        </el-input>
        <el-button @click="useCurrentTimestamp">当前</el-button>
        <el-button @click="tsInput = ''">清空</el-button>
      </div>
      <el-alert
        v-if="tsError"
        :title="tsError"
        type="error"
        :closable="false"
        show-icon
        class="convert-alert"
      />
      <el-descriptions v-else-if="parsedDate" :column="1" border class="result-table">
        <el-descriptions-item v-for="item in tsResults" :key="item.label" :label="item.label">
          <span class="result-value">{{ item.value }}</span>
          <span v-if="item.extra" class="result-extra">{{ item.extra }}</span>
          <el-button text size="small" class="copy-btn" @click="copyText(item.value)">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="输入时间戳后自动转换" :image-size="64" />
    </el-card>

    <!-- 日期 → 时间戳 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">日期 → 时间戳</span>
        </div>
      </template>
      <div class="convert-row">
        <el-date-picker
          v-model="dateInput"
          type="datetime"
          placeholder="选择日期时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DDTHH:mm:ss"
          class="convert-input"
        />
        <el-button @click="useNowForDate">当前</el-button>
        <el-button @click="dateInput = ''">清空</el-button>
      </div>
      <el-descriptions v-if="dateResults" :column="1" border class="result-table">
        <el-descriptions-item v-for="item in dateResults" :key="item.label" :label="item.label">
          <span class="result-value">{{ item.value }}</span>
          <el-button text size="small" class="copy-btn" @click="copyText(item.value)">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="选择日期时间后自动转换" :image-size="64" />
    </el-card>

    <!-- 获取当前时间戳的代码 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">获取当前时间戳（多语言）</span>
        </div>
      </template>
      <el-select v-model="langCode" class="lang-select" filterable>
        <el-option v-for="item in langList" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <div class="code-block">
        <pre><code>{{ currentCode }}</code></pre>
        <el-button text size="small" class="code-copy" @click="copyText(currentCode)">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.timestamp-converter {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.section-card {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
}

.now-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.now-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.now-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.now-value {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.now-value code {
  font-family: 'Courier New', ui-monospace, monospace;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
  flex: 1;
}

.convert-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.convert-input {
  flex: 1;
  min-width: 200px;
}

.convert-alert {
  margin-top: 4px;
}

.result-table {
  margin-top: 4px;
}

.result-value {
  font-family: 'Courier New', ui-monospace, monospace;
  word-break: break-all;
}

.result-extra {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.copy-btn {
  margin-left: 8px;
}

.lang-select {
  width: 200px;
  margin-bottom: 12px;
}

.code-block {
  position: relative;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  overflow: auto;
}

.code-block pre {
  margin: 0;
  padding: 14px 16px;
}

.code-block code {
  font-family: ui-monospace, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre;
}

.code-copy {
  position: absolute;
  top: 8px;
  right: 8px;
}

@media (max-width: 640px) {
  .now-grid {
    grid-template-columns: 1fr;
  }

  .lang-select {
    width: 100%;
  }
}
</style>
