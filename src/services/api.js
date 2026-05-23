import axios from 'axios'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' }, timeout: 30000 })
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
api.interceptors.response.use(r => r, async error => {
  const orig = error.config
  if (error.response?.status === 401 && !orig._retry) {
    orig._retry = true
    try {
      const rt = localStorage.getItem('refreshToken')
      if (!rt) throw new Error('no token')
      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: rt })
      const { accessToken, refreshToken: nr } = res.data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', nr)
      orig.headers.Authorization = `Bearer ${accessToken}`
      return api(orig)
    } catch {
      localStorage.clear()
      window.location.href = '/auth/login'
    }
  }
  return Promise.reject(error)
})
export default api
