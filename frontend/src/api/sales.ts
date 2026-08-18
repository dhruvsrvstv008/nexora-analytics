import api from './client';

export interface SalesSummary {
  total_orders: number; revenue: number; profit: number; avg_order_value: number;
  prev_revenue: number; prev_profit: number; prev_orders: number;
  revenue_growth_pct: number; profit_growth_pct: number; profit_margin_pct: number;
}
export interface TargetRow {
  employee_id: number; full_name: string; department_name: string; manager_name: string;
  period_month: string; actual_revenue: number; target_amount: number;
  achievement_pct: number; performance_tier: 'Exceeded' | 'Met' | 'Missed';
  rank_in_period: number; order_count: number;
}
export interface DimRow { [key: string]: string | number | null; }

const p = (params: object) => ({ params });

export const salesApi = {
  summary:       (params?: object) => api.get<SalesSummary>('/sales/summary',     p(params ?? {})).then(r => r.data),
  trend:         (params?: object) => api.get<any[]>('/sales/trend',              p(params ?? {})).then(r => r.data),
  byDimension:   (dim: string, params?: object) => api.get<DimRow[]>('/sales/by-dimension', p({ dim, ...params })).then(r => r.data),
  targets:       (params?: object) => api.get<TargetRow[]>('/sales/targets',      p(params ?? {})).then(r => r.data),
  orders:        (params?: object) => api.get<any[]>('/sales/orders',             p(params ?? {})).then(r => r.data),
  topProducts:   (params?: object) => api.get<any[]>('/sales/top-products',       p(params ?? {})).then(r => r.data),
  topPerCategory:(params?: object) => api.get<any[]>('/sales/top-per-category',   p(params ?? {})).then(r => r.data),
};
