import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { login } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_CREDS = [
  { role: 'admin',    email: 'admin@nexora.dev',    pwd: 'Admin@123'    },
  { role: 'analyst',  email: 'analyst@nexora.dev',  pwd: 'Analyst@123'  },
  { role: 'manager',  email: 'manager@nexora.dev',  pwd: 'Manager@123'  },
  { role: 'employee', email: 'employee@nexora.dev', pwd: 'Employee@123' },
];

export default function LoginPage() {
  const { setTokens } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]     = useState('admin@nexora.dev');
  const [password, setPassword] = useState('Admin@123');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const tokens = await login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      navigate('/');
    } catch {
      setError('Invalid credentials. Try a demo account below.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-sidebar p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Nexora Analytics</span>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-snug">
            Transform operational data into&nbsp;
            <span className="text-primary-light">actionable insights</span>.
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Sales trends, workforce analytics, inventory intelligence — all in one platform
            powered by 40+ advanced SQL queries and real-time dashboards.
          </p>
          <div className="flex gap-6 pt-2">
            {['40+ SQL Queries', '9 Dashboards', '190+ Employees', '₹892 Cr Revenue'].map((s) => (
              <div key={s} className="text-center">
                <p className="text-white font-bold text-base">{s.split(' ')[0]}</p>
                <p className="text-slate-500 text-xs">{s.split(' ').slice(1).join(' ')}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">© 2026 Nexora Analytics · Portfolio Project</p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-canvas">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-ink">Nexora</span>
          </div>

          <h1 className="text-2xl font-bold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-8">Sign in to your analytics dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink block mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-control border border-border bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="you@nexora.dev" required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 text-sm rounded-control border border-border bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-negative/10 rounded-control border border-negative/20">
                <AlertCircle className="w-4 h-4 text-negative flex-shrink-0" />
                <p className="text-xs text-negative">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-control
                         hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8">
            <p className="text-xs text-muted mb-3 font-medium">Quick access — demo accounts:</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDS.map((c) => (
                <button
                  key={c.role}
                  onClick={() => { setEmail(c.email); setPassword(c.pwd); }}
                  className="flex items-center gap-2 p-2.5 rounded-control border border-border bg-white
                             hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{c.role[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink capitalize">{c.role}</p>
                    <p className="text-[10px] text-muted">{c.pwd}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
