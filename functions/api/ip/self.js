/**
 * Cloudflare Pages Function: /api/ip/self
 * 直接读取边缘请求上的访客 IP / ASN / 地理信息（与 ip.skk.moe 同思路）。
 * 本地开发时 request.cf 不存在，由 Vite 中间件回退到第三方 GeoIP。
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function isIPv6(ip) {
  return !!ip && ip.includes(':')
}

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const cf = request.cf || {}
  const connecting = request.headers.get('CF-Connecting-IP') || ''
  const connectingV6 = request.headers.get('CF-Connecting-IPv6') || ''
  const ip = connecting

  if (!ip) {
    return json({ ok: false, error: 'no CF-Connecting-IP' }, 200)
  }

  const asnNumber = cf.asn != null ? `AS${cf.asn}` : ''
  const asOrg = cf.asOrganization || ''
  const city = cf.city || ''
  const region = cf.region || cf.regionCode || ''
  const country = cf.country || ''
  const location = [country, region, city].filter(Boolean).join(' ')

  return json({
    ok: true,
    source: 'self',
    ip,
    type: isIPv6(ip) ? 'ipv6' : 'ipv4',
    // 本次请求的协议族；双栈用户另一次连接可能不同
    protocol: isIPv6(ip) ? 'IPv6' : 'IPv4',
    location,
    city,
    region,
    country,
    isp: asOrg,
    asn: asnNumber,
    asOrganization: asOrg,
    colo: cf.colo || '',
    timezone: cf.timezone || '',
    continent: cf.continent || '',
    // 同请求里若带了 v6 头则附带
    ipv6: connectingV6 && connectingV6 !== ip ? connectingV6 : undefined,
    fetchedAt: Date.now(),
    edge: true,
  })
}
