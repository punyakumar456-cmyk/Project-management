import { useMemo, useState } from 'react';
import { FiArrowRight, FiCheckCircle, FiLock, FiMail, FiShield, FiUsers } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

const portalContent = {
  Admin: {
    badge: 'Admin Portal',
    title: 'Direct projects, assign work, and monitor execution.',
    description: 'Use the admin portal to create workspaces, assign members, track delivery, and keep every task moving.',
    points: ['Create and assign detailed tasks', 'Monitor member progress in real time', 'Control workspace roles and timelines'],
  },
  Member: {
    badge: 'Member Portal',
    title: 'Open your assigned workspace and move work forward.',
    description: 'Use the member portal to review assigned tasks, update progress, and stay aligned with admin expectations.',
    points: ['See only your assigned work', 'Update task status clearly', 'Collaborate inside shared project discussions'],
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const [role, setRole] = useState('Admin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const activePortal = useMemo(() => portalContent[role], [role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(form.email, form.password, role);
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError.message);
    }
  };

  return (
    <div className="auth-shell auth-shell--login">
      <div className="auth-orb auth-orb--cyan" />
      <div className="auth-orb auth-orb--green" />
      <div className="auth-gridlines" />

      <div className="auth-stage auth-stage--login">
        <section className="auth-login-showcase">
          <div className="auth-login-showcase__inner">
            <p className="auth-login-showcase__eyebrow">Task Orbit</p>
            <h1 className="auth-login-showcase__title">Login should feel like entering the right control room.</h1>
            <p className="auth-login-showcase__text">
              Switch between admin and member portals before signing in so the workspace opens with the right experience from the first click.
            </p>

            <div className="auth-login-portal-card">
              <div className="auth-login-portal-card__head">
                <span className="auth-login-portal-card__badge">{activePortal.badge}</span>
                <div className="auth-login-portal-card__switch">
                  {[
                    { label: 'Admin', icon: FiShield },
                    { label: 'Member', icon: FiUsers },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      className={role === label ? 'auth-login-portal-card__switch-item is-active' : 'auth-login-portal-card__switch-item'}
                      onClick={() => setRole(label)}
                      type="button"
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <h2 className="auth-login-portal-card__title">{activePortal.title}</h2>
              <p className="auth-login-portal-card__text">{activePortal.description}</p>

              <div className="auth-login-points">
                {activePortal.points.map((point) => (
                  <div key={point} className="auth-login-point">
                    <FiCheckCircle size={16} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="auth-login-panel">
          <div className="auth-login-panel__header">
            <p className="auth-login-panel__eyebrow">Secure Access</p>
            <h2 className="auth-login-panel__title">Sign in to continue</h2>
            <p className="auth-login-panel__text">Choose your portal, enter your credentials, and land in the workspace built for your role.</p>
          </div>

          <div className="auth-login-tabstrip">
            {[
              { label: 'Admin', icon: FiShield },
              { label: 'Member', icon: FiUsers },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={role === label ? 'auth-login-tabstrip__item is-active' : 'auth-login-tabstrip__item'}
                onClick={() => setRole(label)}
                type="button"
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className={role === 'Admin' ? 'role-banner admin' : 'role-banner member'}>
            {role === 'Admin'
              ? 'Admin login opens the command center for project assignment and monitoring.'
              : 'Member login opens the member workspace with assigned tasks and progress updates.'}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email address</span>
              <div className="input-icon auth-login-input">
                <FiMail className="text-slate-400" />
                <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </div>
            </label>

            <label className="field">
              <span>Password</span>
              <div className="input-icon auth-login-input">
                <FiLock className="text-slate-400" />
                <input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </div>
            </label>

            <button className="btn btn-primary auth-login-submit" disabled={loading} type="submit">
              {loading ? 'Signing in...' : `Enter ${role} Portal`}
              {!loading && <FiArrowRight size={16} />}
            </button>
          </form>

          <div className="auth-login-footer">
            <p className="text-sm text-slate-500">
              Need an account?{' '}
              <Link className="font-semibold text-sky-700 hover:text-sky-900" to="/signup">
                Create one
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
