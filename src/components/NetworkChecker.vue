<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CircleCheck, CircleClose, Loading } from '@element-plus/icons-vue'

interface SourceResult {
  key: string
  name: string
  region: 'domestic' | 'international'
  /** 源站首页 */
  homeUrl: string
  iconUrl?: string
  status: 'idle' | 'loading' | 'success' | 'error'
  ip?: string
  location?: string
  isp?: string
  asn?: string
  colo?: string
  error?: string
  /**
   * 视角说明：
   * - client-to-cloudflare / browser：访客本机出口（可信）
   * - function-egress：Pages Function 出网 IP（云端部署时≠访客出口）
   * - local-geoip：本地开发回退
   */
  vantage?: string
}

interface LatencyResult {
  key: string
  name: string
  region: 'domestic' | 'international'
  /** 实际探测 URL */
  probeUrl: string
  /** 展示并跳转的站点 */
  homeUrl: string
  iconUrl?: string
  status: 'idle' | 'loading' | 'success' | 'error'
  latency?: number
  reason?: string
}

interface SelfInfo {
  ip: string
  type: 'ipv4' | 'ipv6'
  location?: string
  isp?: string
  asn?: string
  colo?: string
  timezone?: string
  edge?: boolean
  ipv6?: string
}

const loading = ref(false)
const error = ref('')
const selfInfo = ref<SelfInfo | null>(null)
/** 主 IPv4（尽力从多源汇总） */
const ipv4 = ref<SelfInfo | null>(null)
/** 主 IPv6 */
const ipv6 = ref<SelfInfo | null>(null)

const sources = ref<SourceResult[]>([
  {
    key: 'ip138',
    name: 'iP138.com',
    region: 'domestic',
    homeUrl: 'https://www.ip138.com/',
    iconUrl: '/favicons/ip138.ico',
    status: 'idle',
  },
  {
    key: 'ipcn',
    name: 'IP.cn 查询网',
    region: 'domestic',
    homeUrl: 'https://www.ip.cn/',
    iconUrl: '/favicons/ipcn.ico',
    status: 'idle',
  },
  {
    key: 'ipip',
    name: 'IPIP',
    region: 'domestic',
    homeUrl: 'https://myip.ipip.net/',
    iconUrl: '/favicons/ipip.ico',
    status: 'idle',
  },
  {
    key: 'cloudflare',
    name: 'Cloudflare',
    region: 'international',
    homeUrl: 'https://www.cloudflare.com/',
    iconUrl: '/favicons/cloudflare.ico',
    status: 'idle',
  },
  {
    key: 'ipinfo',
    name: 'IPinfo.io',
    region: 'international',
    homeUrl: 'https://ipinfo.io/',
    iconUrl: '/favicons/ipinfo.ico',
    status: 'idle',
  },
  {
    key: 'ipapi',
    name: 'ip-api.com',
    region: 'international',
    homeUrl: 'http://ip-api.com/',
    iconUrl: '/favicons/ipapi.ico',
    status: 'idle',
  },
])

const domesticSources = computed(() => sources.value.filter((s) => s.region === 'domestic'))
const internationalSources = computed(() => sources.value.filter((s) => s.region === 'international'))
const domesticLatency = computed(() => latency.value.filter((s) => s.region === 'domestic'))
const internationalLatency = computed(() => latency.value.filter((s) => s.region === 'international'))

// 与 ip.skk.moe 对齐的探测目标；用 no-cors fetch + generate_204/favicon
const LATENCY_SITES: Omit<LatencyResult, 'status' | 'latency' | 'reason'>[] = [
  {
    key: 'douyin',
    name: '抖音',
    region: 'domestic',
    homeUrl: 'https://www.douyin.com/',
    probeUrl: 'https://www.douyin.com/favicon.ico',
    iconUrl: '/favicons/douyin.ico',
  },
  {
    key: 'bilibili',
    name: 'Bilibili',
    region: 'domestic',
    homeUrl: 'https://www.bilibili.com/',
    probeUrl: 'https://www.bilibili.com/favicon.ico',
    iconUrl: '/favicons/bilibili.ico',
  },
  {
    key: 'baidu',
    name: '百度',
    region: 'domestic',
    homeUrl: 'https://www.baidu.com/',
    probeUrl: 'https://www.baidu.com/favicon.ico',
    iconUrl: '/favicons/baidu.ico',
  },
  {
    key: 'wechat',
    name: '微信',
    region: 'domestic',
    homeUrl: 'https://weixin.qq.com/',
    probeUrl: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico',
    iconUrl: '/favicons/weixin.ico',
  },
  {
    key: 'taobao',
    name: '淘宝',
    region: 'domestic',
    homeUrl: 'https://www.taobao.com/',
    probeUrl: 'https://www.taobao.com/favicon.ico',
    iconUrl: '/favicons/taobao.ico',
  },
  {
    key: 'github',
    name: 'GitHub',
    region: 'international',
    homeUrl: 'https://github.com/',
    probeUrl: 'https://github.com/favicon.ico',
    iconUrl: '/favicons/github.ico',
  },
  {
    key: 'cloudflare',
    name: 'Cloudflare',
    region: 'international',
    homeUrl: 'https://www.cloudflare.com/',
    probeUrl: 'https://cp.cloudflare.com/generate_204',
    iconUrl: '/favicons/cloudflare.ico',
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT',
    region: 'international',
    homeUrl: 'https://chatgpt.com/',
    probeUrl: 'https://chatgpt.com/favicon.ico',
    iconUrl: '/favicons/chatgpt.png',
  },
  {
    key: 'claude',
    name: 'Claude',
    region: 'international',
    homeUrl: 'https://claude.ai/',
    probeUrl: 'https://claude.ai/favicon.ico',
    iconUrl: '/favicons/claude.png',
  },
  {
    key: 'gemini',
    name: 'Gemini',
    region: 'international',
    homeUrl: 'https://gemini.google.com/',
    probeUrl: 'https://gemini.google.com/favicon.ico',
    iconUrl: '/favicons/gemini.png',
  },
  {
    key: 'youtube',
    name: 'YouTube',
    region: 'international',
    homeUrl: 'https://www.youtube.com/',
    probeUrl: 'https://www.youtube.com/generate_204',
    iconUrl: '/favicons/youtube.ico',
  },
]

const latency = ref<LatencyResult[]>(
  LATENCY_SITES.map((s) => ({ ...s, status: 'idle' as const })),
)

async function fetchViaProxy(source: string) {
  const res = await fetch(`/api/ip/${source}`, { signal: AbortSignal.timeout(12000) })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `HTTP ${res.status}`)
  }
  return res.json()
}

async function fetchIpinfo() {
  const res = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data.ip) throw new Error('no ip')
  return {
    ok: true,
    ip: data.ip,
    location: [data.city, data.region, data.country].filter(Boolean).join(' '),
    isp: data.org || '',
    asn: (data.org || '').match(/AS\d+/)?.[0] || '',
    type: String(data.ip).includes(':') ? 'ipv6' : 'ipv4',
    vantage: 'browser',
  }
}

async function querySource(item: SourceResult) {
  item.status = 'loading'
  item.error = undefined
  item.ip = undefined
  item.location = undefined
  item.isp = undefined
  item.asn = undefined
  item.colo = undefined
  item.vantage = undefined
  try {
    const data = item.key === 'ipinfo' ? await fetchIpinfo() : await fetchViaProxy(item.key)
    if (!data?.ok || !data.ip) throw new Error(data?.error || '查询失败')
    item.ip = data.ip
    item.location = data.location || ''
    item.isp = data.isp || ''
    item.asn = data.asn || ''
    item.colo = data.colo || ''
    item.vantage = data.vantage || ''
    item.status = 'success'
  } catch (e) {
    item.status = 'error'
    item.error = e instanceof Error ? e.message : String(e)
  }
}

async function queryPrimary() {
  // 1) Cloudflare 边缘访客信息（线上最准）
  const [selfRes, ipapiRes, v6ARes, v6BRes] = await Promise.allSettled([
    fetchViaProxy('self'),
    fetchViaProxy('ipapi'),
    fetchViaProxy('icanhazip-v6'),
    fetchViaProxy('ipw-v6'),
  ])

  const self = selfRes.status === 'fulfilled' && selfRes.value?.ok ? (selfRes.value as SelfInfo) : null
  const api = ipapiRes.status === 'fulfilled' && ipapiRes.value?.ok ? ipapiRes.value : null
  selfInfo.value = self

  const fromSelf =
    self && self.ip
      ? {
          ip: self.ip,
          type: self.type,
          location: self.location || '',
          isp: self.isp || '',
          asn: self.asn || '',
          colo: self.colo || '',
          timezone: self.timezone || '',
        }
      : null
  const fromApi = api?.ip
    ? {
        ip: api.ip,
        type: (api.type as 'ipv4' | 'ipv6') || 'ipv4',
        location: api.location || '',
        isp: api.isp || '',
        asn: api.asn || '',
        colo: '',
        timezone: api.timezone || '',
      }
    : null

  const primary = fromSelf || fromApi
  if (!primary) {
    throw new Error(
      selfRes.status === 'rejected'
        ? `self: ${selfRes.reason?.message || selfRes.reason}`
        : '无法获取公网 IP',
    )
  }

  if (primary.type === 'ipv6') {
    ipv6.value = primary
    ipv4.value = fromApi && fromApi.type === 'ipv4' ? fromApi : null
  } else {
    ipv4.value = primary
  }

  // 2) 另一侧协议栈：v6 专用端点
  const v6 =
    (v6ARes.status === 'fulfilled' && v6ARes.value?.ok && v6ARes.value.ip) ||
    (v6BRes.status === 'fulfilled' && v6BRes.value?.ok && v6BRes.value.ip) ||
    self?.ipv6 ||
    undefined
  if (v6 && !ipv6.value) {
    ipv6.value = {
      ip: String(v6),
      type: 'ipv6',
      location: '',
      isp: '',
      asn: '',
    }
  }
}

async function testLatency(item: LatencyResult): Promise<void> {
  item.status = 'loading'
  item.latency = undefined
  item.reason = undefined
  const start = performance.now()
  try {
    await fetch(item.probeUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    })
    item.latency = Math.round(performance.now() - start)
    item.status = 'success'
  } catch (e) {
    const elapsed = Math.round(performance.now() - start)
    const name = e instanceof Error ? e.name : ''
    item.reason = name === 'TimeoutError' || name === 'AbortError' || elapsed >= 4900 ? '超时' : '阻断'
    item.latency = elapsed
    item.status = 'error'
  }
}

async function testAllLatency() {
  await Promise.all(latency.value.map((item) => testLatency(item)))
}

function latencyClass(item: LatencyResult) {
  if (item.status !== 'success' || item.latency === undefined) return ''
  const ms = item.latency
  if (ms < 200) return 'fast'
  if (ms < 500) return 'normal'
  if (ms < 1000) return 'slow'
  return 'very-slow'
}

/** 0–2s 线性映射，超时/失败显示空条 */
function latencyPercent(item: LatencyResult) {
  if (item.status !== 'success' || item.latency === undefined) return 0
  return Math.min(100, Math.round((item.latency / 2000) * 100))
}

function progressColor(item: LatencyResult) {
  if (item.status === 'error') return 'var(--el-color-danger)'
  const ms = item.latency ?? 0
  if (ms < 200) return 'var(--el-color-success)'
  if (ms < 500) return 'var(--el-color-warning)'
  return 'var(--el-color-danger)'
}

function latencyLabel(ms?: number) {
  if (ms === undefined) return '-'
  if (ms < 200) return '快'
  if (ms < 500) return '正常'
  if (ms < 1000) return '慢'
  return '很慢'
}

function faviconFallback(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.visibility = 'hidden'
}

async function refreshAll() {
  loading.value = true
  error.value = ''
  ipv4.value = null
  ipv6.value = null
  try {
    await Promise.all([queryPrimary(), ...sources.value.map(querySource), testAllLatency()])
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  loading.value = false
}

onMounted(() => {
  refreshAll()
})

function sameIpHint(items: SourceResult[]) {
  const ips = [...new Set(items.map((s) => s.ip).filter(Boolean))]
  if (ips.length <= 1) return null
  return `${ips.length} 个不同出口：${ips.join(' / ')}`
}

function sourceHost(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/** 本地开发：Function 从本机出网，国内源结果可信 */
const isLocalDev = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(window.location.host)

function vantageLabel(v?: string) {
  switch (v) {
    case 'browser':
    case 'client-to-cloudflare':
      return '本机出口'
    case 'function-egress':
      return isLocalDev ? '本机出口' : '云出口'
    case 'local-geoip':
      return '本地回退'
    default:
      return ''
  }
}

function vantageTagType(v?: string): 'success' | 'warning' | 'info' {
  if (v === 'function-egress' && !isLocalDev) return 'warning'
  if (v === 'browser' || v === 'client-to-cloudflare') return 'success'
  return 'info'
}
</script>

<template>
  <div class="network-checker">
    <!-- 双栈主卡片 -->
    <div class="stack-grid">
      <el-card class="stack-card" shadow="never">
        <div class="stack-label">IPv4</div>
        <div v-if="loading && !ipv4 && !ipv6" class="stack-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          查询中
        </div>
        <template v-else-if="ipv4">
          <div class="stack-ip mono">{{ ipv4.ip }}</div>
          <div class="stack-meta">
            <div>{{ ipv4.location || '位置未知' }}</div>
            <div v-if="ipv4.isp || ipv4.asn" class="stack-isp">
              {{ ipv4.isp }}
              <el-tag v-if="ipv4.asn" size="small" type="info" effect="plain">{{ ipv4.asn }}</el-tag>
            </div>
            <div v-if="ipv4.colo" class="stack-colo">节点 {{ ipv4.colo }}</div>
          </div>
        </template>
        <div v-else class="stack-empty">未检测到</div>
      </el-card>

      <el-card class="stack-card" shadow="never">
        <div class="stack-label">IPv6</div>
        <div v-if="loading && !ipv4 && !ipv6" class="stack-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          查询中
        </div>
        <template v-else-if="ipv6">
          <div class="stack-ip mono">{{ ipv6.ip }}</div>
          <div class="stack-meta">
            <div>{{ ipv6.location || '位置未知' }}</div>
            <div v-if="ipv6.isp || ipv6.asn" class="stack-isp">
              {{ ipv6.isp }}
              <el-tag v-if="ipv6.asn" size="small" type="info" effect="plain">{{ ipv6.asn }}</el-tag>
            </div>
          </div>
        </template>
        <div v-else class="stack-empty">未检测到</div>
      </el-card>
    </div>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <div v-if="selfInfo?.edge === false" class="edge-hint">
      本地开发环境无 Cloudflare 边缘信息，已回退第三方 GeoIP；部署到 Pages 后将读取真实边缘 ASN/节点。
    </div>

    <!-- 多源对比 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">多源出口对比</span>
          <el-button size="small" :loading="loading" @click="sources.forEach(querySource)">
            刷新
          </el-button>
        </div>
      </template>

      <div class="compare-split">
        <div class="compare-col">
          <div class="compare-col-title">国内源</div>
          <el-alert
            v-if="sameIpHint(domesticSources)"
            :title="sameIpHint(domesticSources)!"
            type="warning"
            :closable="false"
            show-icon
            class="hint"
          />
          <div class="compare-list">
            <div v-for="row in domesticSources" :key="row.key" class="compare-item">
              <div class="compare-head">
                <img
                  v-if="row.iconUrl"
                  :src="row.iconUrl"
                  alt=""
                  class="site-icon"
                  @error="faviconFallback"
                />
                <span v-else class="site-icon site-icon-fallback"></span>
                <a
                  class="compare-name link"
                  :href="row.homeUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  :title="row.homeUrl"
                >
                  {{ row.name }}
                </a>
                <el-tag
                  v-if="row.status === 'success' && vantageLabel(row.vantage)"
                  size="small"
                  :type="vantageTagType(row.vantage)"
                  effect="plain"
                >
                  {{ vantageLabel(row.vantage) }}
                </el-tag>
                <el-icon v-if="row.status === 'loading'" class="is-loading muted"><Loading /></el-icon>
                <el-icon v-else-if="row.status === 'success'" class="ok"><CircleCheck /></el-icon>
                <el-icon v-else-if="row.status === 'error'" class="fail"><CircleClose /></el-icon>
              </div>
              <div class="compare-ip mono">
                <span v-if="row.status === 'loading'" class="muted">查询中...</span>
                <template v-else-if="row.ip">{{ row.ip }}</template>
                <span v-else class="muted fail-text">{{ row.error || '-' }}</span>
              </div>
              <div class="compare-geo muted">
                <template v-if="row.status === 'success'">
                  {{ [row.location, row.isp].filter(Boolean).join(' · ') || '—' }}
                </template>
              </div>
              <div class="compare-url muted">
                <a class="link subtle" :href="row.homeUrl" target="_blank" rel="noopener noreferrer">
                  {{ sourceHost(row.homeUrl) }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="compare-col">
          <div class="compare-col-title">国际源</div>
          <el-alert
            v-if="sameIpHint(internationalSources)"
            :title="sameIpHint(internationalSources)!"
            type="warning"
            :closable="false"
            show-icon
            class="hint"
          />
          <div class="compare-list">
            <div v-for="row in internationalSources" :key="row.key" class="compare-item">
              <div class="compare-head">
                <img
                  v-if="row.iconUrl"
                  :src="row.iconUrl"
                  alt=""
                  class="site-icon"
                  @error="faviconFallback"
                />
                <span v-else class="site-icon site-icon-fallback"></span>
                <a
                  class="compare-name link"
                  :href="row.homeUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  :title="row.homeUrl"
                >
                  {{ row.name }}
                </a>
                <el-tag
                  v-if="row.status === 'success' && vantageLabel(row.vantage)"
                  size="small"
                  :type="vantageTagType(row.vantage)"
                  effect="plain"
                >
                  {{ vantageLabel(row.vantage) }}
                </el-tag>
                <el-icon v-if="row.status === 'loading'" class="is-loading muted"><Loading /></el-icon>
                <el-icon v-else-if="row.status === 'success'" class="ok"><CircleCheck /></el-icon>
                <el-icon v-else-if="row.status === 'error'" class="fail"><CircleClose /></el-icon>
              </div>
              <div class="compare-ip mono">
                <span v-if="row.status === 'loading'" class="muted">查询中...</span>
                <template v-else-if="row.ip">{{ row.ip }}</template>
                <span v-else class="muted fail-text">{{ row.error || '-' }}</span>
              </div>
              <div class="compare-geo muted">
                <template v-if="row.status === 'success'">
                  {{ [row.location, row.isp, row.asn, row.colo && `CF ${row.colo}`].filter(Boolean).join(' · ') || '—' }}
                </template>
              </div>
              <div class="compare-url muted">
                <a class="link subtle" :href="row.homeUrl" target="_blank" rel="noopener noreferrer">
                  {{ sourceHost(row.homeUrl) }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footnote">
        <template v-if="isLocalDev">
          本地开发：Function 从本机出网，国内源结果即你的出口 IP。
        </template>
        <template v-else>
          部署在 Cloudflare Pages 时，经 Function 代理的国内源显示的是
          <strong>云端出网 IP</strong>，不是你家宽的出口；「本机出口」标签（IPinfo / Cloudflare）
          才是你访问本站时的真实出口。国内/国际 IP 不一致通常表示走了代理或策略路由。
        </template>
      </div>
    </el-card>

    <!-- 连通性 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">国内外连通性 / 延迟</span>
          <el-button size="small" @click="testAllLatency">重新测速</el-button>
        </div>
      </template>

      <div class="compare-split">
        <div v-for="group in [
          { title: '国内站点', items: domesticLatency },
          { title: '国际站点', items: internationalLatency },
        ]" :key="group.title" class="compare-col">
          <div class="compare-col-title">{{ group.title }}</div>
          <div class="latency-list">
            <div v-for="item in group.items" :key="item.key" class="latency-card">
              <div class="latency-top">
                <img
                  v-if="item.iconUrl"
                  :src="item.iconUrl"
                  alt=""
                  class="site-icon"
                  @error="faviconFallback"
                />
                <span v-else class="site-icon site-icon-fallback"></span>
                <div class="latency-identity">
                  <a
                    class="latency-name link"
                    :href="item.homeUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="item.homeUrl"
                  >
                    {{ item.name }}
                  </a>
                  <a
                    class="latency-probe link subtle"
                    :href="item.probeUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="item.probeUrl"
                  >
                    {{ sourceHost(item.probeUrl) }}
                  </a>
                </div>
                <div class="latency-value" :class="latencyClass(item)">
                  <el-icon v-if="item.status === 'loading'" class="is-loading"><Loading /></el-icon>
                  <template v-else-if="item.status === 'success'">
                    <span class="ms">{{ item.latency }}ms</span>
                    <span class="label">{{ latencyLabel(item.latency) }}</span>
                  </template>
                  <template v-else-if="item.status === 'error'">
                    <span class="ms fail-text">{{ item.reason || '不可达' }}</span>
                  </template>
                  <span v-else class="muted">--ms</span>
                </div>
              </div>
              <el-progress
                :percentage="latencyPercent(item)"
                :stroke-width="6"
                :show-text="false"
                :status="item.status === 'error' ? 'exception' : undefined"
                :color="progressColor(item)"
              />
              <div class="latency-url muted">
                探测
                <a class="link subtle" :href="item.probeUrl" target="_blank" rel="noopener noreferrer">
                  {{ item.probeUrl.replace(/^https?:\/\//, '').slice(0, 48) }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.network-checker {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.stack-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stack-card {
  min-height: 160px;
}

.stack-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.stack-ip {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  word-break: break-all;
  color: var(--el-text-color-primary);
}

.stack-meta {
  margin-top: 10px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stack-isp {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.stack-colo {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stack-loading,
.stack-empty {
  padding: 28px 0;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.edge-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 0 4px;
}

.section-card {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.hint {
  margin-bottom: 12px;
}

.compare-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.compare-col-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}

.compare-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compare-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
}

.compare-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}

.compare-name {
  font-weight: 600;
  flex: 1;
  text-decoration: none;
  color: var(--el-text-color-primary);
}

.compare-name:hover {
  color: var(--el-color-primary);
}

.compare-url {
  margin-top: 6px;
  font-size: 12px;
  word-break: break-all;
}

.link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.link.subtle {
  color: var(--el-text-color-secondary);
}

.compare-ip {
  font-size: 14px;
  font-weight: 600;
  word-break: break-all;
  min-height: 1.3em;
}

.compare-geo {
  margin-top: 4px;
  font-size: 12px;
  min-height: 1.2em;
}

.footnote {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.latency-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.latency-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.latency-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.latency-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.latency-name {
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.latency-name:hover {
  color: var(--el-color-primary);
}

.latency-probe {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.latency-url {
  font-size: 12px;
  word-break: break-all;
  line-height: 1.4;
}

.site-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
  flex-shrink: 0;
  background: var(--el-bg-color);
}

.site-icon-fallback {
  display: inline-block;
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color-lighter);
}

.latency-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-shrink: 0;
}

.latency-value .ms {
  font-family: 'Courier New', ui-monospace, monospace;
  font-size: 16px;
  font-weight: 700;
}

.latency-value .label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.latency-value.fast .ms {
  color: var(--el-color-success);
}
.latency-value.normal .ms {
  color: var(--el-color-warning);
}
.latency-value.slow .ms,
.latency-value.very-slow .ms {
  color: var(--el-color-danger);
}

.mono {
  font-family: 'Courier New', ui-monospace, monospace;
}

.muted {
  color: var(--el-text-color-secondary);
}

.ok {
  color: var(--el-color-success);
}

.fail {
  color: var(--el-color-danger);
}

.fail-text {
  color: var(--el-color-danger) !important;
  font-size: 13px !important;
}

@media (max-width: 640px) {
  .stack-grid {
    grid-template-columns: 1fr;
  }

  .stack-ip {
    font-size: 18px;
  }

  .compare-split {
    grid-template-columns: 1fr;
  }
}
</style>
