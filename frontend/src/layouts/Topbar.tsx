import { Search, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface Props { title: string; }

export function Topbar({ title }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-ink flex-shrink-0">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full bg-canvas border border-border
                     text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Refresh */}
        <button
          onClick={() => qc.invalidateQueries()}
          title="Refresh data"
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-negative rounded-full border-2 border-white" />
        </button>

        {/* Role pill */}
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {user?.role}
        </span>
      </div>
    </header>
  );
}
