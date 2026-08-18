import api from './client';
import type { ExecutiveOverview, Insight } from '@/types';

export async function getOverview(year?: number): Promise<ExecutiveOverview> {
  const res = await api.get<ExecutiveOverview>('/executive/overview', {
    params: year ? { year } : {},
  });
  return res.data;
}

export async function getInsights(year?: number): Promise<Insight[]> {
  const res = await api.get<Insight[]>('/executive/insights', {
    params: year ? { year } : {},
  });
  return res.data;
}
