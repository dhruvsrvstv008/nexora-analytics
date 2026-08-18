import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const YEARS = [2024, 2025, 2026];

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const DEPARTMENTS = [
  { id: 1, name: 'Technology' }, { id: 2, name: 'Sales' },
  { id: 3, name: 'Marketing' },  { id: 4, name: 'Operations' },
  { id: 5, name: 'Finance' },    { id: 6, name: 'Human Resources' },
  { id: 7, name: 'Customer Support' }, { id: 8, name: 'Product Management' },
];

export const REGIONS = [
  { id: 1, name: 'Delhi NCR' },          { id: 2, name: 'Punjab & Haryana' },
  { id: 3, name: 'Tamil Nadu & Kerala' },{ id: 4, name: 'Andhra & Telangana' },
  { id: 5, name: 'West Bengal' },        { id: 6, name: 'Odisha & Jharkhand' },
  { id: 7, name: 'Maharashtra' },        { id: 8, name: 'Gujarat' },
];

export const CATEGORIES = [
  { id: 1, name: 'Laptops & Computers' }, { id: 2, name: 'Mobile Devices' },
  { id: 3, name: 'Networking Equipment' },{ id: 4, name: 'Audio & Video' },
  { id: 5, name: 'Software Licenses' },   { id: 6, name: 'Office Supplies' },
  { id: 7, name: 'Furniture & Fixtures' },{ id: 8, name: 'Security Systems' },
  { id: 9, name: 'Peripherals & Accessories' },{ id: 10, name: 'Cloud & Managed Services' },
];

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

function FilterSelect({ label, value, onChange, children, className }: SelectProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-border rounded-control px-2.5 py-1.5 bg-white text-ink
                   focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[110px]"
      >
        {children}
      </select>
    </div>
  );
}

interface FilterBarProps {
  filters: { year?: number; month?: number; department_id?: number; region_id?: number; category_id?: number; };
  setFilter: (key: string, value: string | number | null | undefined) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  show?: { year?: boolean; month?: boolean; dept?: boolean; region?: boolean; cat?: boolean; };
}

export function FilterBar({ filters, setFilter, clearFilters, hasFilters, show = {} }: FilterBarProps) {
  const s = { year: true, month: true, dept: true, region: false, cat: false, ...show };

  return (
    <div className="flex items-end gap-3 flex-wrap bg-white border border-border rounded-card px-4 py-3 shadow-card">
      {s.year && (
        <FilterSelect label="Year" value={filters.year?.toString() ?? ''} onChange={v => setFilter('year', v || null)}>
          <option value="">All years</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </FilterSelect>
      )}
      {s.month && (
        <FilterSelect label="Month" value={filters.month?.toString() ?? ''} onChange={v => setFilter('month', v || null)}>
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </FilterSelect>
      )}
      {s.dept && (
        <FilterSelect label="Department" value={filters.department_id?.toString() ?? ''} onChange={v => setFilter('dept', v || null)}>
          <option value="">All departments</option>
          {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </FilterSelect>
      )}
      {s.region && (
        <FilterSelect label="Region" value={filters.region_id?.toString() ?? ''} onChange={v => setFilter('region', v || null)}>
          <option value="">All regions</option>
          {REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </FilterSelect>
      )}
      {s.cat && (
        <FilterSelect label="Category" value={filters.category_id?.toString() ?? ''} onChange={v => setFilter('cat', v || null)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FilterSelect>
      )}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-negative transition-colors mt-4 pb-0.5"
        >
          <X className="w-3 h-3" /> Clear filters
        </button>
      )}
    </div>
  );
}
