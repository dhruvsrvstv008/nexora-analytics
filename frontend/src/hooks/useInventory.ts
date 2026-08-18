import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory';
import type { Filters } from './useFilters';

export const useInventorySummary  = (f: Partial<Filters>) => useQuery({ queryKey: ['inv','summary', f],   queryFn: () => inventoryApi.summary({ category_id: f.category_id }),  staleTime: 60_000 });
export const useInventoryByCategory=()                    => useQuery({ queryKey: ['inv','by-cat'],        queryFn: () => inventoryApi.byCategory(),                              staleTime: 60_000 });
export const useInventoryAlerts   = (f: Partial<Filters>) => useQuery({ queryKey: ['inv','alerts', f],    queryFn: () => inventoryApi.alerts({ category_id: f.category_id }),   staleTime: 60_000 });
export const useInventoryVelocity = (f: Partial<Filters>) => useQuery({ queryKey: ['inv','velocity', f],  queryFn: () => inventoryApi.velocity({ category_id: f.category_id }), staleTime: 60_000 });
