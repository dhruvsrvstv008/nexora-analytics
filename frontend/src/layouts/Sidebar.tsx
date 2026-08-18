import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Users2, Users, Wallet,
  Package, BarChart2, UserCheck, Network, Settings,
  LogOut, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem { label: string; path: string; icon: React.ElementType; roles?: string[]; }

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'MAIN',
    items: [{ label: 'Executive', path: '/', icon: LayoutDashboard }],
  },
  {
    section: 'ANALYTICS',
    items: [
      { label: 'Sales',        path: '/sales',     icon: TrendingUp },
      { label: 'Managers',     path: '/managers',  icon: Users2 },
      { label: 'Workforce',    path: '/workforce', icon: Users },
      { label: 'Salary',       path: '/salary',    icon: Wallet,    roles: ['admin'] },
      { label: 'Inventory',    path: '/inventory', icon: Package },
      { label: 'Finance',      path: '/finance',   icon: BarChart2, roles: ['admin', 'analyst'] },
      { label: 'HR',           path: '/hr',        icon: UserCheck },
      { label: 'Org Hierarchy',path: '/hierarchy', icon: Network },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
    ],
  },
];

interface Props { collapsed: boolean; setCollapsed: (v: boolean) => void; }

export function Sidebar({ collapsed, setCollapsed }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function canSee(roles?: string[]) {
    if (!roles) return true;
    return user ? roles.includes(user.role) : false;
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar h-screen transition-all duration-200 flex-shrink-0 relative',
        collapsed ? 'w-16' : 'w-[248px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">Nexora</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto">
        {NAV.map((section) => {
          const visible = section.items.filter((i) => canSee(i.roles));
          if (!visible.length) return null;
          return (
            <div key={section.section}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold text-slate-500 tracking-widest">
                  {section.section}
                </p>
              )}
              <ul className="space-y-0.5">
                {visible.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0')
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User card */}
      <div className="border-t border-white/10 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-light">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button onClick={logout} title="Log out" className="text-slate-500 hover:text-white transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={logout} title="Log out" className="w-full flex justify-center text-slate-500 hover:text-white transition-colors py-1">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-border shadow-card flex items-center justify-center text-muted hover:text-ink transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
