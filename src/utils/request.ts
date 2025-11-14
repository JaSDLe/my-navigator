import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useSettingsStore } from '@/stores/settings'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '', // 默认为空，后续从设置中获取
  timeout: 10000, // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const settingsStore = useSettingsStore()
    // 从设置中获取请求URL和token
    const requestUrl = settingsStore.requestUrl
    const token = settingsStore.token

    // 如果设置了请求URL，则更新baseURL
    if (requestUrl) {
      config.baseURL = requestUrl
    }

    // 如果设置了token，则添加到请求头
    if (token) {
      if (config.headers) {
        config.headers['Authorization'] = `${token}`
      } else {
        config.headers = {
          Authorization: `${token}`,
        }
      }
    }

    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    console.error('响应错误:', error)
    return Promise.reject(error)
  },
)

export default service

// 导出类型定义
export type { AxiosRequestConfig, AxiosResponse }
