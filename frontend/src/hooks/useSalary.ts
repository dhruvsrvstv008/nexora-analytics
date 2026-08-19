import { useQuery } from '@tanstack/react-query';
import { salaryApi } from '@/api/salary';

export const useSalarySummary    = () => useQuery({ queryKey: ['sal','summary'],       queryFn: salaryApi.summary,        staleTime: 60_000 });
export const useSalaryByDept     = () => useQuery({ queryKey: ['sal','by-dept'],       queryFn: salaryApi.byDepartment,   staleTime: 60_000 });
export const useAboveDeptAvg     = () => useQuery({ queryKey: ['sal','above-avg'],     queryFn: salaryApi.aboveDeptAvg,   staleTime: 60_000, retry: false });
export const useTopEarners       = () => useQuery({ queryKey: ['sal','top-earners'],   queryFn: salaryApi.topEarners,     staleTime: 60_000, retry: false });
export const useSalaryBands      = () => useQuery({ queryKey: ['sal','bands'],         queryFn: salaryApi.bands,          staleTime: 60_000 });
export const usePayrollShare     = () => useQuery({ queryKey: ['sal','payroll-share'], queryFn: salaryApi.payrollShare,   staleTime: 60_000 });
export const useSalaryInsights   = () => useQuery({ queryKey: ['sal','insights'],      queryFn: salaryApi.insights,       staleTime: 60_000 });
