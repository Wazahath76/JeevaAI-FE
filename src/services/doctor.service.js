import api from './api'
export const doctorService = {
  getAll:      p => api.get('/doctors', { params: p }),
  getAvailable:p => api.get('/doctors/available', { params: p }),
  getById:    id => api.get(`/doctors/${id}`),
  toggleAvail:(id,a) => api.patch(`/doctors/${id}/availability?available=${a}`),
}
