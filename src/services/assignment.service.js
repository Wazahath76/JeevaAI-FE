import api from './api'
export const assignmentService = {
  assign:     d  => api.post('/assignments', d),
  revoke:     d  => api.post('/assignments/revoke', d),
  getForPatient: id => api.get(`/assignments/patient/${id}`),
  getMy:      () => api.get('/assignments/my'),
}
