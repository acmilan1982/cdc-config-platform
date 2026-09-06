import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// 请求级“跳过全局错误弹窗”开关：仅供页内自收敛错误反馈的只读查询页按请求开启；
// 未显式开启（默认）的其它页面请求错误弹窗行为保持不变。
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalErrorPopup?: boolean
  }
}

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

http.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    // 开启 skipGlobalErrorPopup 的请求由页面统一做脱敏/收敛反馈，不再叠加全局弹窗。
    if (error.config?.skipGlobalErrorPopup) {
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || error.message || '网络请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default http
