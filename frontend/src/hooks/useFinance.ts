import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import type { Filters } from './useFilters';

const Q = (f: Partial<Filters>) => ({ year: f.year });

export const useFinanceSummary  = (f: Partial<Filters>) => useQuery({ queryKey: ['fin','summary', f],   queryFn: () => financeApi.summary(Q(f)),      staleTime: 60_000 });
export const useFinanceTrend    = (f: Partial<Filters>) => useQuery({ queryKey: ['fin','trend', f],     queryFn: () => financeApi.monthlyTrend(Q(f)), staleTime: 60_000 });
export const useFinanceDeptCosts= (f: Partial<Filters>) => useQuery({ queryKey: ['fin','costs', f],     queryFn: () => financeApi.deptCosts(Q(f)),    staleTime: 60_000 });
export const useFinanceDeptPnl  = (f: Partial<Filters>) => useQuery({ queryKey: ['fin','pnl', f],       queryFn: () => financeApi.deptPnl(Q(f)),      staleTime: 60_000 });
