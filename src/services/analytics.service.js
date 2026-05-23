import api from './api'
export const analyticsService = {
  getHospital: () => api.get('/analytics/hospital'),
  getMe:       () => api.get('/analytics/me'),
}
