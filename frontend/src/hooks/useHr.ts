import { useQuery } from '@tanstack/react-query';
import { hrApi } from '@/api/hr';
import type { Filters } from './useFilters';

export const useHrSummary     = ()                    => useQuery({ queryKey: ['hr','summary'],          queryFn: hrApi.summary,                                   staleTime: 60_000 });
export const useHiringTrend   = (f: Partial<Filters>) => useQuery({ queryKey: ['hr','hiring', f],        queryFn: () => hrApi.hiringTrend({ department_id: f.department_id }),  staleTime: 60_000 });
export const useAttrition     = ()                    => useQuery({ queryKey: ['hr','attrition'],        queryFn: hrApi.attrition,                                 staleTime: 60_000 });
export const useHierarchy     = (f: Partial<Filters>) => useQuery({ queryKey: ['hr','hierarchy', f],     queryFn: () => hrApi.hierarchy({ department_id: f.department_id }),   staleTime: 60_000 });
