/** Indian number formatter — write once, use everywhere. */

export function formatINR(amount: number, compact = true): string {
  if (!compact) {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  if (Math.abs(amount) >= 1e7) {
    return `₹${(amount / 1e7).toFixed(2)} Cr`;
  }
  if (Math.abs(amount) >= 1e5) {
    return `₹${(amount / 1e5).toFixed(2)} L`;
  }
  if (Math.abs(amount) >= 1e3) {
    return `₹${(amount / 1e3).toFixed(1)}k`;
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toLocaleString('en-IN');
}

export function formatPct(n: number | null | undefined, sign = true): string {
  if (n == null) return '—';
  const prefix = sign && n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatMonthLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}
