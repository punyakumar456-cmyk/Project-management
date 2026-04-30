import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const getMe = useAuthStore((state) => state.getMe);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const loading = useAuthStore((state) => state.loading);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      getMe();
      return;
    }

    setName(user.name);
  }, [user, getMe]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await updateProfile(name);
    setMessage('Profile updated successfully.');
  };

  if (!user) {
    return (
      <Layout>
        <div className="card text-slate-500">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Profile</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Your account</h2>
          <p className="mt-2 text-sm text-slate-500">Keep your basic information current for team collaboration.</p>

          {message && <div className="alert alert-success mt-6">{message}</div>}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="field">
              <span>Email</span>
              <input disabled value={user.email} />
            </label>
            <button className="btn btn-primary" disabled={loading} type="submit">
              Save Changes
            </button>
          </form>
        </section>

        <aside className="card">
          <h3 className="text-xl font-bold text-slate-900">Role and access</h3>
          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Role</p>
              <p className="font-semibold text-slate-900">{user.role}</p>
            </div>
            <div>
              <p className="text-slate-500">Created</p>
              <p className="font-semibold text-slate-900">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-500">Permissions</p>
              <p className="font-semibold text-slate-900">
                {user.role === 'Admin'
                  ? 'Can create projects, manage teams, and assign tasks.'
                  : 'Can view assigned projects and update assigned task status.'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
