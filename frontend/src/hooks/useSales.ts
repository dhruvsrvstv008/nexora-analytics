import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/api/sales';
import type { Filters } from './useFilters';

const Q = (f: Partial<Filters>) => ({
  year: f.year, month: f.month, department_id: f.department_id,
  region_id: f.region_id, manager_id: f.manager_id, category_id: f.category_id,
});

export const useSalesSummary    = (f: Partial<Filters>) => useQuery({ queryKey: ['sales','summary', f],    queryFn: () => salesApi.summary(Q(f)),    staleTime: 60_000 });
export const useSalesTrend      = (f: Partial<Filters>) => useQuery({ queryKey: ['sales','trend', f],      queryFn: () => salesApi.trend(Q(f)),      staleTime: 60_000 });
export const useSalesByDim      = (f: Partial<Filters>) => useQuery({ queryKey: ['sales','dim', f],        queryFn: () => salesApi.byDimension(f.dim ?? 'department', Q(f)), staleTime: 60_000 });
export const useSalesTargets    = (f: Partial<Filters>) => useQuery({ queryKey: ['sales','targets', f],    queryFn: () => salesApi.targets(Q(f)),    staleTime: 60_000 });
export const useSalesOrders     = (f: Partial<Filters>) => useQuery({ queryKey: ['sales','orders', f],     queryFn: () => salesApi.orders({ ...Q(f), status: f.status, limit: f.limit, offset: f.offset }), staleTime: 60_000 });
export const useTopProducts     = (f: Partial<Filters>) => useQuery({ queryKey: ['sales','top-products',f],queryFn: () => salesApi.topProducts({ year: f.year }),    staleTime: 60_000 });
export const useSalesInsights   = (f: Partial<Filters>) => useQuery({ queryKey: ['sales','insights', f],   queryFn: () => salesApi.insights({ year: f.year }),       staleTime: 60_000 });
