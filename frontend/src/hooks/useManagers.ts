import { useQuery } from '@tanstack/react-query';
import { managersApi } from '@/api/managers';
import type { Filters } from './useFilters';

const Q = (f: Partial<Filters>) => ({ year: f.year, month: f.month, department_id: f.department_id });

export const useManagerLeaderboard = (f: Partial<Filters>) => useQuery({ queryKey: ['mgr','list', f],         queryFn: () => managersApi.leaderboard(Q(f)),        staleTime: 60_000 });
export const useManagerOverview    = (id: number, f: Partial<Filters>) => useQuery({ queryKey: ['mgr','overview', id, f], queryFn: () => managersApi.overview(id, Q(f)), staleTime: 60_000 });
export const useManagerTeam        = (id: number, f: Partial<Filters>) => useQuery({ queryKey: ['mgr','team', id, f],    queryFn: () => managersApi.team(id, Q(f)),    staleTime: 60_000 });
