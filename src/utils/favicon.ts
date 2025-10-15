/**
 * 获取网站图标的工具函数
 */
import axios from 'axios'

// 定义 favicon 缓存项的接口
interface FaviconCacheItem {
  isValid: boolean
  timestamp: number
}

// 定义 Axios 错误的接口
interface AxiosError extends Error {
  code?: string
  response?: {
    status: number
    statusText: string
    headers: any
    data: any
  }
  request?: any
}

// 创建专门用于 favicon 请求的 axios 实例
const faviconAxios = axios.create({
  timeout: 5000, // 5秒超时
  validateStatus: (status) => status >= 200 && status < 400, // 接受2xx和3xx状态码
  withCredentials: false, // 禁用凭证以避免CORS问题
})

// favicon检查结果缓存
const faviconCache = new Map<string, FaviconCacheItem>()
const CACHE_TTL = 5 * 60 * 1000 // 缓存5分钟

/**
 * 从URL中提取域名
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

/**
 * 生成可能的favicon URL列表
 */
function generateFaviconUrls(domain: string): string[] {
  const urls: string[] = []

  // 常见的favicon路径
  urls.push(`https://${domain}/favicon.ico`)
  urls.push(`https://${domain}/favicon.png`)
  urls.push(`https://${domain}/favicon.svg`)
  urls.push(`https://${domain}/favicon.gif`)

  // 对于www域名，也尝试非www版本
  if (domain.startsWith('www.')) {
    const nonWwwDomain = domain.substring(4)
    urls.push(`https://${nonWwwDomain}/favicon.ico`)
    urls.push(`https://${nonWwwDomain}/favicon.png`)
    urls.push(`https://${nonWwwDomain}/favicon.svg`)
    urls.push(`https://${nonWwwDomain}/favicon.gif`)
  } else {
    urls.push(`https://www.${domain}/favicon.ico`)
    urls.push(`https://www.${domain}/favicon.png`)
    urls.push(`https://www.${domain}/favicon.svg`)
    urls.push(`https://www.${domain}/favicon.gif`)
  }

  return urls
}

/**
 * 检查图片URL是否可访问
 */
async function checkImageUrl(url: string): Promise<boolean> {
  // 检查缓存
  const cached = faviconCache.get(url)
  if (cached) {
    const now = Date.now()
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.isValid
    } else {
      // 缓存过期，删除旧缓存
      faviconCache.delete(url)
    }
  }

  try {
    const response = await faviconAxios.head(url)
    const isValid = response.headers['content-type']?.startsWith('image/') ?? false

    // 缓存结果
    faviconCache.set(url, { isValid, timestamp: Date.now() })

    return isValid
  } catch (error: AxiosError) {
    // 缓存失败结果
    faviconCache.set(url, { isValid: false, timestamp: Date.now() })

    // 区分不同类型的错误
    if (error.code === 'ECONNABORTED') {
      console.debug(`Favicon请求超时: ${url}`)
    } else if (error.response) {
      // 服务器返回了错误状态码
      console.debug(`Favicon请求失败 (${error.response.status}): ${url}`)
    } else if (error.request) {
      // 请求已发出但没有收到响应，可能是CORS错误
      console.debug(`Favicon请求无响应或被CORS阻止: ${url}`)
    } else {
      // 其他错误
      console.debug(`Favicon请求错误: ${url}`, error.message)
    }
    return false
  }
}

/**
 * 获取网站的favicon URL
 * @param url 网站URL
 * @returns Promise<string | null> 返回找到的favicon URL，如果没找到则返回null
 */
export async function getFaviconUrl(url: string): Promise<string | null> {
  if (!url || !url.startsWith('http')) {
    return null
  }

  const domain = extractDomain(url)
  if (!domain) {
    return null
  }

  const faviconUrls = generateFaviconUrls(domain)

  // 顺序检查favicon URL，找到第一个有效的就立即返回
  for (const faviconUrl of faviconUrls) {
    const isValid = await checkImageUrl(faviconUrl)
    if (isValid) {
      return faviconUrl
    }
  }

  return null
}
