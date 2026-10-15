import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, CheckSquare, FolderKanban,
  Timer, BarChart3, LogOut, Sparkles
} from 'lucide-react';
import type { ReactNode } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'الرئيسية' },
  { to: '/tasks', icon: CheckSquare, label: 'المهام' },
  { to: '/projects', icon: FolderKanban, label: 'المشاريع' },
  { to: '/timer', icon: Timer, label: 'المؤقت' },
  { to: '/stats', icon: BarChart3, label: 'الإحصائيات' },
  { to: '/assistant', icon: Sparkles, label: 'المساعد الذكي' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-dark flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-l border-border-teal flex flex-col fixed right-0 top-0 h-screen z-20">
        {/* Logo */}
        <div className="p-6 border-b border-border-teal">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-glow">
              <span className="text-bg-dark font-bold text-lg">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Life OS</h1>
              <p className="text-xs text-gray-500">نظامك الشخصي</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/30 shadow-glow'
                    : 'text-gray-400 hover:text-white hover:bg-card-hover'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border-teal">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-bold">{username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{username}</p>
              <p className="text-xs text-gray-500">متصل الآن</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all text-sm"
          >
            <LogOut size={16} />
            تسجيل خروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}