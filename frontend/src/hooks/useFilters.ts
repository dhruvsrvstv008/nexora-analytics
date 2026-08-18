import { useSearchParams } from 'react-router-dom';

export interface Filters {
  year?: number; month?: number; department_id?: number;
  manager_id?: number; category_id?: number; region_id?: number;
  dim: string; status?: string; limit: number; offset: number;
}

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = (k: string) => searchParams.get(k);
  const getNum = (k: string) => (get(k) ? Number(get(k)) : undefined);

  const filters: Filters = {
    year:          getNum('year'),
    month:         getNum('month'),
    department_id: getNum('dept'),
    manager_id:    getNum('mgr'),
    category_id:   getNum('cat'),
    region_id:     getNum('region'),
    dim:           get('dim') ?? 'department',
    status:        get('status') ?? undefined,
    limit:         Number(get('limit') ?? 50),
    offset:        Number(get('offset') ?? 0),
  };

  function setFilter(key: string, value: string | number | null | undefined) {
    const params = new URLSearchParams(searchParams);
    if (value != null && value !== '') params.set(key, String(value));
    else params.delete(key);
    // Reset pagination when any filter changes (except limit/offset itself)
    if (key !== 'offset') params.delete('offset');
    setSearchParams(params, { replace: true });
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  const hasFilters = ['year','month','dept','mgr','cat','region','status'].some(k => !!get(k));

  return { filters, setFilter, clearFilters, hasFilters };
}
