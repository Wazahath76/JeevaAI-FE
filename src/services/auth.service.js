import api from './api'
export const authService = {
  register: d  => api.post('/auth/register', d),
  login: (e,p) => api.post('/auth/login', { email: e, password: p }),
  refresh: rt  => api.post('/auth/refresh', { refreshToken: rt }),
  logout: ()   => api.post('/auth/logout'),
  me: ()       => api.get('/auth/me'),
}
