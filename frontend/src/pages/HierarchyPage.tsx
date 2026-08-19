import { Network } from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';
import { FilterBar } from '@/components/ui/FilterBar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { OrgTree } from '@/components/OrgTree';
import { useFilters } from '@/hooks/useFilters';
import { useHierarchy } from '@/hooks/useHr';

export default function HierarchyPage() {
  const { filters, setFilter, clearFilters, hasFilters } = useFilters();
  const { data, isPending } = useHierarchy(filters);

  const maxDepth = data ? Math.max(...data.map((d: any) => d.depth), 0) : 0;
  const deptCount = data ? new Set(data.map((d: any) => d.department_name)).size : 0;

  return (
    <AppShell title="Org Hierarchy">
      <div className="mb-6">
        <FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} hasFilters={hasFilters}
          show={{ year: false, month: false, dept: true }} />
      </div>

      {/* Meta stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {isPending
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-card border border-border shadow-card p-5 h-20 animate-pulse bg-slate-50" />
            ))
          : [
              { label: 'Total Nodes',     value: String(data?.length ?? 0) },
              { label: 'Hierarchy Depth', value: `${maxDepth + 1} levels` },
              { label: 'Departments',     value: String(deptCount) },
              { label: 'Algorithm',       value: 'Recursive CTE', accent: '#4F46E5' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-card border border-border shadow-card p-5">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">{k.label}</p>
                <p className="mt-2 text-xl font-bold" style={{ color: k.accent ?? '#0F172A' }}>{k.value}</p>
              </div>
            ))
        }
      </div>

      {/* SQL Showcase callout */}
      <div className="mb-6 p-4 rounded-card border border-primary/30 bg-primary/5 flex items-start gap-3">
        <Network className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-primary">Recursive CTE — Interview Showpiece</p>
          <p className="text-xs text-muted mt-0.5">
            The tree below is rendered from a single <code className="bg-primary/10 text-primary px-1 rounded text-[11px]">WITH RECURSIVE org_tree AS (...)</code> query
            in <code className="bg-primary/10 text-primary px-1 rounded text-[11px]">workforce/hierarchy.sql</code>.
            It walks the self-referencing <code className="bg-primary/10 text-primary px-1 rounded text-[11px]">manager_id</code> FK to arbitrary depth
            using a cycle guard (<code className="bg-primary/10 text-primary px-1 rounded text-[11px]">NOT (employee_id = ANY(path))</code>),
            and computes each employee's depth, full reporting chain, and direct-report count in one pass.
          </p>
        </div>
      </div>

      {/* Org tree */}
      <Card noPad>
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <CardHeader className="mb-0">
            <CardTitle>Organisation Tree</CardTitle>
            <p className="text-xs text-muted">
              {isPending ? 'Loading…' : `${data?.length ?? 0} employees · Click chevrons to expand/collapse`}
            </p>
          </CardHeader>
        </div>
        <OrgTree data={data ?? []} loading={isPending} />
      </Card>
    </AppShell>
  );
}
