import api from './client';

const p = (params: object) => ({ params });

export const managersApi = {
  leaderboard: (params?: object)     => api.get<any[]>('/managers',                   p(params ?? {})).then(r => r.data),
  overview:    (id: number, params?: object) => api.get<any>(`/managers/${id}/overview`, p(params ?? {})).then(r => r.data),
  team:        (id: number, params?: object) => api.get<any[]>(`/managers/${id}/team`,  p(params ?? {})).then(r => r.data),
};
