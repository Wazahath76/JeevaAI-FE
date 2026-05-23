import api from './api'
export const aiService = {
  request:  id   => api.post(`/ai/recommend/${id}`),
  getFor:   id   => api.get(`/ai/recommendations/patient/${id}`),
  approve:  (id,d) => api.put(`/ai/recommendations/${id}/approve`, d),
  reject:   (id,d) => api.put(`/ai/recommendations/${id}/reject`, d),
  modify:   (id,d) => api.put(`/ai/recommendations/${id}/modify`, d),
}
