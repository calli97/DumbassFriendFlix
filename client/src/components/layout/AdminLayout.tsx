import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface AdminLayoutProps {
  children: ReactNode;
}

const navLinks = [
  { to: '/users', label: 'Users' },
  { to: '/media', label: 'Media' },
  { to: '/requests', label: 'Requests' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-0 flex items-center justify-between">
        {/* Brand + nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 py-3">
            <img src="/img/Magios.png" alt="Magiosflix" className="h-7 w-auto" />
            <span className="font-semibold text-indigo-600">Magiosflix</span>
          </div>

          <nav className="flex">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'px-3 py-4 text-sm font-medium border-b-2 transition-colors duration-150',
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{user?.username}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">{children}</main>
    </div>
  );
}
