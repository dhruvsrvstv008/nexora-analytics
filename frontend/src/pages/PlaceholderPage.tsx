import { Construction } from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';

interface Props { title: string; }

export default function PlaceholderPage({ title }: Props) {
  return (
    <AppShell title={title}>
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Construction className="w-10 h-10 text-muted" />
        <div>
          <p className="font-semibold text-ink">{title}</p>
          <p className="text-sm text-muted mt-1">Coming in Phase 6 — Sales, Workforce & Inventory pages.</p>
        </div>
      </div>
    </AppShell>
  );
}
