import { create } from 'zustand';
import { api, payload, sessionApi } from '../services/api';

let refreshing;
let sessionEpoch = 0;

export const useAuth = create(set => ({
  status: 'checking',
  user: null,
  token: null,
  async signIn(mode, input) {
    if (refreshing) await refreshing;
    ++sessionEpoch;
    const data = payload(await sessionApi.post('/auth/' + mode, input));
    set({ status: 'ready', user: data.user, token: data.accessToken });
  },
  async signOut() {
    if (refreshing) await refreshing;
    ++sessionEpoch;
    await sessionApi.post('/auth/logout');
    set({ status: 'ready', user: null, token: null });
  },
  async updateProfile(name) {
    const epoch = sessionEpoch;
    const user = payload(await api.patch('/auth/profile', { name }));
    if (epoch === sessionEpoch) set({ user });
  },
}));

const protectedRequest = url => url?.startsWith('/designs') || url?.startsWith('/publications') || url === '/auth/profile';

export function refreshSession() {
  if (!refreshing) {
    const epoch = sessionEpoch;
    refreshing = sessionApi.post('/auth/refresh')
      .then(response => {
        const { user, accessToken } = payload(response);
        if (epoch !== sessionEpoch) return null;
        useAuth.setState({ status: 'ready', user, token: accessToken });
        return accessToken;
      })
      .catch(() => {
        if (epoch === sessionEpoch) useAuth.setState({ status: 'ready', user: null, token: null });
        return null;
      })
      .finally(() => { refreshing = undefined; });
  }
  return refreshing;
}

api.interceptors.request.use(config => {
  if (protectedRequest(config.url)) {
    const token = useAuth.getState().token;
    if (token) config.headers.set('Authorization', 'Bearer ' + token);
  }
  return config;
});

api.interceptors.response.use(response => response, async error => {
  const { config, response } = error;
  if (response?.status === 401 && protectedRequest(config?.url) && !config.retried) {
    config.retried = true;
    if (await refreshSession()) return api(config);
  }
  throw error;
});
