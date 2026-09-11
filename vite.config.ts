import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
// @ts-expect-error Cloudflare Pages Function (JS)
import { onRequest as ipOnRequest } from './functions/api/ip/[source].js'
// @ts-expect-error Cloudflare Pages Function (JS)
import { onRequest as selfOnRequest } from './functions/api/ip/self.js'

const DEV_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
}

/** 本地无 request.cf 时，用 ip-api 模拟边缘访客信息 */
async function localSelfFallback() {
  const res = await fetch(
    'http://ip-api.com/json/?lang=zh-CN&fields=status,message,query,country,regionName,city,isp,org,as,timezone,lat,lon',
    { signal: AbortSignal.timeout(8000) },
  )
  const data = (await res.json()) as Record<string, unknown>
  if (data.status !== 'success') {
    return Response.json(
      { ok: false, error: (data.message as string) || 'ip-api failed' },
      { headers: DEV_CORS },
    )
  }
  const as = String(data.as || '')
  const asn = as.match(/AS\d+/)?.[0] || ''
  const ip = String(data.query || '')
  return Response.json(
    {
      ok: true,
      source: 'self-local',
      ip,
      type: ip.includes(':') ? 'ipv6' : 'ipv4',
      protocol: ip.includes(':') ? 'IPv6' : 'IPv4',
      location: [data.country, data.regionName, data.city].filter(Boolean).join(' '),
      city: data.city || '',
      region: data.regionName || '',
      country: data.country || '',
      isp: (data.isp as string) || (data.org as string) || '',
      asn,
      asOrganization: as,
      colo: 'LOCAL',
      timezone: data.timezone || '',
      fetchedAt: Date.now(),
      edge: false,
    },
    { headers: DEV_CORS },
  )
}

/** 本地开发时把 /api/ip/* 转给 Cloudflare Pages Function，与线上行为一致 */
function ipApiDevPlugin(): Plugin {
  return {
    name: 'ip-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/ip/')) return next()
        if (req.method && req.method !== 'GET' && req.method !== 'OPTIONS') return next()

        try {
          const source = decodeURIComponent(url.slice('/api/ip/'.length).split('?')[0] ?? '')
          const request = new Request(`http://localhost${url}`, { method: req.method ?? 'GET' })

          let response: Response
          if (source === 'self') {
            // 本地无 Cloudflare 边缘上下文，回退到第三方 GeoIP
            try {
              response = await selfOnRequest({ request, params: {} })
              const body = (await response.clone().json()) as { ok?: boolean }
              if (!body?.ok) {
                response = await localSelfFallback()
              }
            } catch {
              response = await localSelfFallback()
            }
          } else {
            response = await ipOnRequest({
              request,
              params: { source },
            })
          }

          res.statusCode = response.status
          response.headers.forEach((value: string, key: string) => {
            res.setHeader(key, value)
          })
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ipApiDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'favicons/*.png',
        'favicons/*.ico',
        'favicons/*.svg',
        'pwa-icons/*.png',
      ],
      manifest: {
        name: '我的导航',
        short_name: '导航',
        description: '个人导航仪表盘',
        theme_color: '#409eff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
