import { useState } from 'react';
import { FiLock, FiMail, FiShield, FiUser, FiUsers } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((state) => state.signup);
  const loading = useAuthStore((state) => state.loading);
  const [role, setRole] = useState('Member');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await signup(form.name, form.email, form.password, form.passwordConfirm, role);
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError.message);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb--cyan" />
      <div className="auth-orb auth-orb--green" />

      <div className="auth-stage">
        <section className="auth-hero">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">Get Started</p>
          <h1 className="mt-4 text-4xl font-bold text-white">Create the right account for your workspace.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            The first Admin creates projects and teams. Members join the portal, appear in the admin directory, and then get
            assigned to private or shared workspaces.
          </p>

          <div className="auth-cubes">
            <div className="auth-cube auth-cube--one" />
            <div className="auth-cube auth-cube--two" />
            <div className="auth-cube auth-cube--three" />
          </div>
        </section>

        <section className="auth-3d-card">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">New Account</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Sign up</h2>
            <p className="mt-2 text-sm text-slate-500">Choose whether this registration is for the Admin or Member portal.</p>
          </div>

          <div className="portal-switch">
            {[
              { label: 'Admin', icon: FiShield },
              { label: 'Member', icon: FiUsers },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={role === label ? 'portal-switch__item is-active' : 'portal-switch__item'}
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
              ? 'Admin sign-up is intended for the first workspace owner.'
              : 'Member sign-up adds you to the admin directory for future assignment.'}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full name</span>
              <div className="input-icon">
                <FiUser className="text-slate-400" />
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
            </label>

            <label className="field">
              <span>Email</span>
              <div className="input-icon">
                <FiMail className="text-slate-400" />
                <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </div>
            </label>

            <label className="field">
              <span>Password</span>
              <div className="input-icon">
                <FiLock className="text-slate-400" />
                <input required minLength="6" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </div>
            </label>

            <label className="field">
              <span>Confirm password</span>
              <div className="input-icon">
                <FiLock className="text-slate-400" />
                <input
                  required
                  minLength="6"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(event) => setForm({ ...form, passwordConfirm: event.target.value })}
                />
              </div>
            </label>

            <button className="btn btn-primary w-full justify-center" disabled={loading} type="submit">
              {loading ? 'Creating account...' : `Sign Up as ${role}`}
            </button>
          </form>

          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link className="font-semibold text-sky-700 hover:text-sky-900" to="/login">
              Login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
