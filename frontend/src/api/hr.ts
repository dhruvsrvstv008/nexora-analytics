import api from './client';

const p = (params: object) => ({ params });

export const hrApi = {
  summary:      ()                => api.get<any>('/hr/summary').then(r => r.data),
  hiringTrend:  (params?: object) => api.get<any[]>('/hr/hiring-trend',  p(params ?? {})).then(r => r.data),
  attrition:    ()                => api.get<any[]>('/hr/attrition').then(r => r.data),
  tenure:       (params?: object) => api.get<any[]>('/hr/tenure',        p(params ?? {})).then(r => r.data),
  hierarchy:    (params?: object) => api.get<any[]>('/workforce/hierarchy', p(params ?? {})).then(r => r.data),
  insights:     ()                => api.get<import('@/types').Insight[]>('/hr/insights').then(r => r.data),
};
