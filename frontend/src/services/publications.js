import { api, payload } from './api';

export const publications = {
  list: design => api.get('/publications', { params: { design } }).then(payload),
  create: data => api.post('/publications', data).then(payload),
  preview: id => api.get('/publications/' + id + '/preview').then(payload),
  privacy: (id, data) => api.patch('/publications/' + id + '/privacy', data).then(payload),
  close: (id, action) => api.post('/publications/' + id + '/' + action).then(payload),
  remove: id => api.delete('/publications/' + id).then(payload),
};

function recipientOptions(access) {
  return access ? { headers: { Authorization: 'Bearer ' + access } } : {};
}

export const messages = {
  get: (token, signal) => api.get('/messages/' + encodeURIComponent(token), { signal }).then(payload),
  unlock: (token, password) => api.post('/messages/' + encodeURIComponent(token) + '/unlock', { password }).then(payload),
  view: (token, access) => api.post('/messages/' + encodeURIComponent(token) + '/views', {}, recipientOptions(access)),
  report: (token, input, access) => api.post('/messages/' + encodeURIComponent(token) + '/reports', input, recipientOptions(access)),
};
