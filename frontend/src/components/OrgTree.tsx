import { useState } from 'react';
import { ChevronRight, ChevronDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HierarchyRow {
  employee_id: number; full_name: string; manager_id: number | null;
  depth: number; department_name: string; job_title: string;
  job_level: string; salary: number; direct_report_count: number;
}

interface TreeNode extends HierarchyRow { children: TreeNode[]; }

const DEPT_COLORS: Record<string, string> = {
  'Technology':          '#4F46E5', 'Sales':              '#06B6D4',
  'Marketing':           '#F59E0B', 'Operations':         '#10B981',
  'Finance':             '#EF4444', 'Human Resources':    '#8B5CF6',
  'Customer Support':    '#F97316', 'Product Management': '#EC4899',
};

function buildTree(rows: HierarchyRow[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  rows.forEach(r => map.set(r.employee_id, { ...r, children: [] }));

  const roots: TreeNode[] = [];
  rows.forEach(r => {
    const node = map.get(r.employee_id)!;
    if (r.manager_id == null || !map.has(r.manager_id)) {
      roots.push(node);
    } else {
      map.get(r.manager_id)!.children.push(node);
    }
  });
  return roots;
}

const LEVEL_STYLE: Record<string, string> = {
  executive: 'bg-purple-50 border-purple-200 text-purple-700',
  manager:   'bg-primary/5 border-primary/20 text-primary',
  senior:    'bg-slate-50 border-slate-200 text-slate-600',
  associate: 'bg-white border-border text-muted',
};

interface NodeProps { node: TreeNode; depth: number; defaultExpanded?: boolean; }

function OrgNode({ node, depth, defaultExpanded = false }: NodeProps) {
  const [open, setOpen] = useState(defaultExpanded || depth < 2);
  const hasChildren = node.children.length > 0;
  const deptColor = DEPT_COLORS[node.department_name] ?? '#64748B';

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 pr-4 rounded-lg hover:bg-canvas transition-colors group cursor-default',
        )}
        style={{ paddingLeft: `${depth * 28 + 12}px` }}
      >
        {/* Expand button */}
        <button
          onClick={() => hasChildren && setOpen(!open)}
          className={cn('w-5 h-5 flex items-center justify-center flex-shrink-0 rounded transition-colors',
            hasChildren ? 'text-muted hover:text-ink hover:bg-slate-100' : 'opacity-0 pointer-events-none')}
        >
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Department color pip */}
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: deptColor }} />

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
          style={{ background: deptColor }}>
          {node.full_name.charAt(0)}
        </div>

        {/* Name + title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{node.full_name}</p>
          <p className="text-xs text-muted truncate">{node.job_title}</p>
        </div>

        {/* Department */}
        <span className="hidden lg:block text-xs text-muted w-36 text-right truncate">{node.department_name}</span>

        {/* Level badge */}
        <span className={cn('hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize w-24 justify-center flex-shrink-0',
          LEVEL_STYLE[node.job_level])}>
          {node.job_level}
        </span>

        {/* Direct reports */}
        <div className="flex-shrink-0 text-right w-16">
          {node.direct_report_count > 0 && (
            <span className="text-xs font-semibold text-muted">
              {node.direct_report_count} {node.direct_report_count === 1 ? 'report' : 'reports'}
            </span>
          )}
        </div>
      </div>

      {/* Children */}
      {open && hasChildren && (
        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border"
            style={{ left: `${depth * 28 + 26}px` }}
          />
          {node.children.map(child => (
            <OrgNode key={child.employee_id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props { data: HierarchyRow[]; loading?: boolean; }

export function OrgTree({ data, loading }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-50 animate-pulse"
            style={{ marginLeft: `${(i % 3) * 28}px` }} />
        ))}
      </div>
    );
  }

  // Filter support: if searching, show flat list; otherwise show tree
  const filtered = searchTerm
    ? data.filter(r =>
        r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const tree = buildTree(data);

  return (
    <div>
      {/* Search bar */}
      <div className="px-5 py-3 border-b border-border">
        <input
          type="text"
          placeholder="Search by name, title, or department…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full max-w-sm text-xs border border-border rounded-control px-3 py-1.5
                     focus:outline-none focus:ring-2 focus:ring-primary/30 bg-canvas"
        />
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-canvas text-[10px] font-semibold text-muted uppercase tracking-wide">
        <div style={{ paddingLeft: '52px' }} className="flex-1">Name / Title</div>
        <span className="hidden lg:block w-36 text-right">Department</span>
        <span className="hidden sm:block w-24 text-center">Level</span>
        <span className="w-16 text-right">Reports</span>
      </div>

      {/* Tree or flat filtered list */}
      <div className="p-2">
        {filtered ? (
          filtered.length > 0
            ? filtered.map(r => (
                <div key={r.employee_id} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-canvas transition-colors">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DEPT_COLORS[r.department_name] ?? '#64748B' }} />
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
                    style={{ background: DEPT_COLORS[r.department_name] ?? '#64748B' }}>
                    {r.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{r.full_name}</p>
                    <p className="text-xs text-muted">{r.job_title} · {r.department_name}</p>
                  </div>
                  <span className="text-xs text-muted">Depth {r.depth}</span>
                </div>
              ))
            : <p className="text-xs text-muted text-center py-8">No employees match "{searchTerm}"</p>
        ) : (
          tree.map(root => <OrgNode key={root.employee_id} node={root} depth={0} defaultExpanded />)
        )}
      </div>
    </div>
  );
}
