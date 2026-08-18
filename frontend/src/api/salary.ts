import api from './client';

const p = (params: object) => ({ params });

export const salaryApi = {
  summary:         (params?: object) => api.get<any>('/salary/summary',                   p(params ?? {})).then(r => r.data),
  byDepartment:    ()                => api.get<any[]>('/salary/by-department').then(r => r.data),
  aboveDeptAvg:    (params?: object) => api.get<any[]>('/salary/above-department-average', p(params ?? {})).then(r => r.data),
  topEarners:      (params?: object) => api.get<any[]>('/salary/top-earners',              p(params ?? {})).then(r => r.data),
  bands:           (params?: object) => api.get<any[]>('/salary/bands',                    p(params ?? {})).then(r => r.data),
  payrollShare:    ()                => api.get<any[]>('/salary/payroll-share').then(r => r.data),
  departmentRank:  (params?: object) => api.get<any[]>('/salary/department-rank',          p(params ?? {})).then(r => r.data),
};
