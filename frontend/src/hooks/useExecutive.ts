import { useQuery } from '@tanstack/react-query';
import { getOverview, getInsights } from '@/api/executive';

export function useExecutiveOverview(year?: number) {
  return useQuery({
    queryKey: ['executive', 'overview', year],
    queryFn: () => getOverview(year),
    staleTime: 60_000,
  });
}

export function useExecutiveInsights(year?: number) {
  return useQuery({
    queryKey: ['executive', 'insights', year],
    queryFn: () => getInsights(year),
    staleTime: 60_000,
  });
}
