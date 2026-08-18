import { useQuery } from '@tanstack/react-query';
import { workforceApi } from '@/api/workforce';
import type { Filters } from './useFilters';

const Q = (f: Partial<Filters>) => ({ department_id: f.department_id });

export const useWfSummary      = (f: Partial<Filters>) => useQuery({ queryKey: ['wf','summary', f],      queryFn: () => workforceApi.summary(Q(f)),           staleTime: 60_000 });
export const useWfDistribution = (f: Partial<Filters>) => useQuery({ queryKey: ['wf','dist', f],         queryFn: () => workforceApi.distribution(f.dim ?? 'department', Q(f)), staleTime: 60_000 });
export const useHeadcountTrend = (f: Partial<Filters>) => useQuery({ queryKey: ['wf','hc-trend', f],     queryFn: () => workforceApi.headcountTrend(Q(f)),    staleTime: 60_000 });
export const useSalaryByDept   = ()                    => useQuery({ queryKey: ['salary','by-dept'],      queryFn: () => workforceApi.salaryByDept(),          staleTime: 60_000 });
export const useTenure         = (f: Partial<Filters>) => useQuery({ queryKey: ['wf','tenure', f],        queryFn: () => workforceApi.tenure(Q(f)),            staleTime: 60_000 });
