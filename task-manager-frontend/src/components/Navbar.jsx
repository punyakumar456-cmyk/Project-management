import { useMemo, useState } from 'react';
import { FiActivity, FiFolder, FiGrid, FiLogOut, FiMenu, FiUser, FiX } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navItems = useMemo(
    () => [
      { to: '/dashboard', label: user?.role === 'Admin' ? 'Admin Hub' : 'My Desk', icon: FiGrid },
      { to: '/projects', label: user?.role === 'Admin' ? 'Workspaces' : 'Assigned Work', icon: FiFolder },
      { to: '/profile', label: 'Profile', icon: FiUser },
    ],
    [user?.role]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-white/50 bg-white/65 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button className="text-left" onClick={() => navigate('/dashboard')}>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-700">Task Orbit</p>
          <h1 className="text-xl font-bold text-slate-950">
            {user?.role === 'Admin' ? 'Admin command center' : 'Member execution desk'}
          </h1>
        </button>

        <nav className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 p-1.5 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                location.pathname === to
                  ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon size={15} />
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <>
              <div className="rounded-full border border-slate-200/80 bg-white/75 px-4 py-2 text-right shadow-sm">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  <FiActivity size={12} /> {user.role}
                </p>
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              </div>
              <button className="btn btn-outline" onClick={handleLogout} type="button">
                <FiLogOut /> Logout
              </button>
            </>
          )}
        </div>

        <button
          className="inline-flex items-center rounded-2xl border border-slate-200 bg-white/80 p-2.5 md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          type="button"
        >
          {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200/80 bg-white/90 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                  location.pathname === to ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <button className="btn btn-outline justify-center" onClick={handleLogout} type="button">
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
