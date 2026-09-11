/**
 * Cloudflare Pages Function: /api/ip/[source]
 * 服务端抓取无 CORS 的 IP 源，供前端多源对比。
 */
const SOURCES = {
  ipip: {
    url: 'https://myip.ipip.net',
    parse: (text) => {
      // 当前 IP：1.2.3.4  来自于：中国 重庆 重庆  联通
      const m = text.match(/当前\s*IP：\s*(\S+)\s+来自于：\s*(.+)/)
      if (!m) return { ok: false, error: 'parse failed', raw: text.slice(0, 200) }
      const rest = m[2].trim()
      // 地理与 ISP 之间是连续空格
      const segs = rest.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean)
      const location = segs[0] ?? rest
      const isp = segs[1] ?? ''
      return {
        ok: true,
        ip: m[1].trim(),
        location,
        isp,
        type: m[1].includes(':') ? 'ipv6' : 'ipv4',
      }
    },
  },
  pconline: {
    url: 'https://whois.pconline.com.cn/ipJson.jsp?ip=&json=true',
    // GBK 编码
    binary: true,
    decode: (buf) => new TextDecoder('gbk').decode(buf),
    parse: (text) => {
      try {
        const data = JSON.parse(text.trim())
        if (!data.ip) return { ok: false, error: data.err || 'no ip', raw: text.slice(0, 200) }
        const location = [data.pro, data.city].filter(Boolean).join(' ')
        return {
          ok: true,
          ip: data.ip,
          location: location || data.addr || '',
          isp: (data.addr || '').split(/\s+/).pop() || '',
          type: String(data.ip).includes(':') ? 'ipv6' : 'ipv4',
        }
      } catch {
        return { ok: false, error: 'invalid json', raw: text.slice(0, 200) }
      }
    },
  },
  cn3322: {
    url: 'https://ip.3322.net',
    parse: (text) => {
      const ip = text.trim()
      if (!ip) return { ok: false, error: 'empty' }
      return { ok: true, ip, location: '', isp: '', type: ip.includes(':') ? 'ipv6' : 'ipv4' }
    },
  },
  // ip.skk.moe 同款国内源：2026.ip138.com（iframe 简页，含归属地）
  ip138: {
    url: 'https://2026.ip138.com/',
    parse: (text) => {
      // <title>您的IP地址是：1.2.3.4</title> ... 来自：中国 重庆 重庆 渝中 联通
      const ip = text.match(/您的iP地址是[：:]\s*([\d.:a-fA-F]+)/i)?.[1]
      if (!ip) return { ok: false, error: 'parse failed', raw: text.slice(0, 200) }
      const geoRaw = text.match(/来自[：:]\s*([^<]+)/)?.[1]?.trim() ?? ''
      const parts = geoRaw.split(/\s+/).filter(Boolean)
      const isp = parts.length >= 2 ? parts[parts.length - 1] : ''
      const location = isp ? parts.slice(0, -1).join(' ') : geoRaw
      return {
        ok: true,
        ip,
        location,
        isp,
        type: ip.includes(':') ? 'ipv6' : 'ipv4',
      }
    },
  },
  // ip.cn：先取首页 _ticket，再调 my.ip.cn/json
  ipcn: {
    customFetch: async () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      const pageRes = await fetch('https://www.ip.cn/', {
        headers: { 'User-Agent': ua, Accept: 'text/html' },
      })
      const html = await pageRes.text()
      const ticket = html.match(/var\s+_ticket\s*=\s*"([^"]+)"/)?.[1]
      if (!ticket) throw new Error('ip.cn ticket not found')
      const apiRes = await fetch(`https://my.ip.cn/json/?ticket=${encodeURIComponent(ticket)}`, {
        headers: { 'User-Agent': ua, Accept: 'application/json' },
      })
      return apiRes.text()
    },
    parse: (text) => {
      try {
        const json = JSON.parse(text)
        if (!json.status || !json.data?.ip) {
          return { ok: false, error: json.msg || 'ip.cn failed', raw: text.slice(0, 200) }
        }
        const d = json.data
        const location = [d.country, d.province, d.city, d.district].filter(Boolean).join(' ')
        return {
          ok: true,
          ip: d.ip,
          location,
          isp: d.isp || '',
          type: String(d.ip).includes(':') ? 'ipv6' : 'ipv4',
        }
      } catch {
        return { ok: false, error: 'invalid json', raw: text.slice(0, 200) }
      }
    },
  },
  cloudflare: {
    url: 'https://www.cloudflare.com/cdn-cgi/trace',
    parse: (text) => {
      const map = {}
      for (const line of text.split('\n')) {
        const i = line.indexOf('=')
        if (i > 0) map[line.slice(0, i).trim()] = line.slice(i + 1).trim()
      }
      const ip = map.ip
      if (!ip) return { ok: false, error: 'parse failed', raw: text.slice(0, 200) }
      return {
        ok: true,
        ip,
        location: map.loc || '',
        isp: map.colo || '',
        colo: map.colo || '',
        warp: map.warp || '',
        type: ip.includes(':') ? 'ipv6' : 'ipv4',
      }
    },
  },
  ipapi: {
    url: 'http://ip-api.com/json/?lang=zh-CN&fields=status,message,query,country,regionName,city,isp,org,as,timezone,lat,lon',
    parse: (text) => {
      try {
        const data = JSON.parse(text)
        if (data.status !== 'success') {
          return { ok: false, error: data.message || 'failed' }
        }
        const location = [data.country, data.regionName, data.city].filter(Boolean).join(' ')
        return {
          ok: true,
          ip: data.query,
          location,
          isp: data.isp || data.org || '',
          asn: data.as || '',
          timezone: data.timezone || '',
          lat: data.lat,
          lon: data.lon,
          type: String(data.query).includes(':') ? 'ipv6' : 'ipv4',
        }
      } catch {
        return { ok: false, error: 'invalid json' }
      }
    },
  },
  'icanhazip-v6': {
    url: 'https://ipv6.icanhazip.com',
    parse: (text) => {
      const ip = text.trim()
      if (!ip || !ip.includes(':')) return { ok: false, error: 'no ipv6' }
      return { ok: true, ip, location: '', isp: '', type: 'ipv6' }
    },
  },
  'ipw-v6': {
    url: 'https://6.ipw.cn',
    parse: (text) => {
      const ip = text.trim()
      if (!ip || !ip.includes(':')) return { ok: false, error: 'no ipv6' }
      return { ok: true, ip, location: '', isp: '', type: 'ipv6' }
    },
  },
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=60',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export async function onRequest(context) {
  const { request, params } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const source = params.source
  const conf = SOURCES[source]
  if (!conf) {
    return json({ ok: false, error: `unknown source: ${source}`, available: Object.keys(SOURCES) }, 404)
  }

  try {
    let text
    if (conf.customFetch) {
      text = await conf.customFetch()
    } else {
      const res = await fetch(conf.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/plain, text/html, application/json, */*',
        },
      })
      const buf = await res.arrayBuffer()
      text = conf.decode ? conf.decode(buf) : new TextDecoder('utf-8').decode(buf)
    }
    const parsed = conf.parse(text)
    return json({
      source,
      fetchedAt: Date.now(),
      ...parsed,
    })
  } catch (e) {
    return json(
      {
        ok: false,
        source,
        error: e && e.message ? e.message : String(e),
      },
      200,
    )
  }
}
