import api from './client';

const p = (params: object) => ({ params });

export const financeApi = {
  summary:       (params?: object) => api.get<any>('/finance/summary',               p(params ?? {})).then(r => r.data),
  monthlyTrend:  (params?: object) => api.get<any[]>('/finance/revenue-vs-expenses', p(params ?? {})).then(r => r.data),
  deptCosts:     (params?: object) => api.get<any[]>('/finance/department-costs',    p(params ?? {})).then(r => r.data),
  deptPnl:       (params?: object) => api.get<any[]>('/finance/dept-pnl',            p(params ?? {})).then(r => r.data),
};
