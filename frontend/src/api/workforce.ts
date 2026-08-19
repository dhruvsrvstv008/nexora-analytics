import api from './client';

export interface WorkforceSummary {
  active_count: number; exited_count: number; new_hires_ytd: number;
  exits_ytd: number; avg_tenure_months: number; headcount_prev_year: number;
  attrition_rate_pct: number;
}
export interface DistributionRow {
  dimension_label: string; dimension_key: string; headcount: number;
  avg_salary: number; headcount_share_pct: number;
}
export interface HeadcountPoint { period: string; new_hires: number; exits: number; active_headcount: number; }
export interface TenureRow { tenure_months: number; tenure_bucket: string; department_name: string; job_level: string; status: string; }

const p = (params: object) => ({ params });

export const workforceApi = {
  summary:      (params?: object) => api.get<WorkforceSummary>('/workforce/summary',        p(params ?? {})).then(r => r.data),
  distribution: (by: string, params?: object) => api.get<DistributionRow[]>('/workforce/distribution', p({ by, ...params })).then(r => r.data),
  headcountTrend:(params?: object) => api.get<HeadcountPoint[]>('/workforce/headcount-trend', p(params ?? {})).then(r => r.data),
  hierarchy:    (params?: object) => api.get<any[]>('/workforce/hierarchy',                 p(params ?? {})).then(r => r.data),
  salarySummary:(params?: object) => api.get<any>('/salary/summary',                        p(params ?? {})).then(r => r.data),
  salaryByDept: ()                => api.get<any[]>('/salary/by-department').then(r => r.data),
  tenure:       (params?: object) => api.get<TenureRow[]>('/hr/tenure',                     p(params ?? {})).then(r => r.data),
  insights:     ()                => api.get<import('@/types').Insight[]>('/workforce/insights').then(r => r.data),
};
