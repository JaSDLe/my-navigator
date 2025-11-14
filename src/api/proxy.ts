// API 接口封装
import request from '@/utils/request';
import type { AxiosResponse } from 'axios';

// 通过后端代理获取图片，避免CORS限制
// 传入图片URL，返回图片文件字节流
export function getProxyImg(url: string): Promise<AxiosResponse<Blob>> {
  return request.get<Blob>(`/test/img/proxy?url=${encodeURIComponent(url)}`, {
    responseType: 'blob'
  });
}