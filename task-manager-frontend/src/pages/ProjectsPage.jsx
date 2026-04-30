import { useEffect, useMemo, useState } from 'react';
import { FiFolderPlus, FiShield, FiTarget, FiTrash2, FiUser, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore, useDirectoryStore, useProjectStore, useTaskStore } from '../store';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'No deadline');

export default function ProjectsPage() {
  const user = useAuthStore((state) => state.user);
  const { projects, loading, error, getProjects, createProject, deleteProject } = useProjectStore();
  const { users, getUsers } = useDirectoryStore();
  const tasks = useTaskStore((state) => state.tasks);
  const getTasks = useTaskStore((state) => state.getTasks);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    accessMode: 'Individual',
    teamName: '',
    memberIds: [],
  });

  useEffect(() => {
    getProjects();
    getTasks();
    if (user?.role === 'Admin') {
      getUsers();
    }
  }, [getProjects, getTasks, getUsers, user?.role]);

  const members = useMemo(() => users.filter((account) => account.role === 'Member'), [users]);

  const projectsWithMetrics = useMemo(
    () =>
      projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const completed = projectTasks.filter((task) => task.status === 'Done').length;
        const overdue = projectTasks.filter((task) => task.isOverdue).length;

        return {
          ...project,
          taskCount: projectTasks.length,
          completed,
          overdue,
          progress: projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0,
        };
      }),
    [projects, tasks]
  );

  const toggleMember = (memberId) => {
    setForm((current) => {
      const selected = current.memberIds.includes(memberId);
      return {
        ...current,
        memberIds: selected ? current.memberIds.filter((id) => id !== memberId) : [...current.memberIds, memberId],
      };
    });
  };

  const handleModeChange = (accessMode) => {
    setForm((current) => ({
      ...current,
      accessMode,
      teamName: accessMode === 'Team' ? current.teamName : '',
      memberIds: accessMode === 'Individual' ? current.memberIds.slice(0, 1) : current.memberIds,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await createProject(form);
    setForm({
      name: '',
      description: '',
      dueDate: '',
      accessMode: 'Individual',
      teamName: '',
      memberIds: [],
    });
    setShowForm(false);
    await getProjects();
    await getTasks();
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Delete this project and all of its tasks?')) {
      await deleteProject(projectId);
      await getTasks();
    }
  };

  return (
    <Layout>
      <section className="hero-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
          {user?.role === 'Admin' ? 'Workspace Control' : 'Assigned Workspaces'}
        </p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold leading-tight lg:text-4xl">
              {user?.role === 'Admin'
                ? 'Admins create projects, assign members, and keep every workspace distinct.'
                : 'Members see only the workspaces assigned by admin and the tasks inside them.'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {user?.role === 'Admin'
                ? 'Private workspaces can hold one member, while team workspaces can support shared delivery and visibility.'
                : 'Open any workspace below to review tasks, update status, and report your progress cleanly.'}
            </p>
          </div>
          {user?.role === 'Admin' && (
            <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)} type="button">
              <FiFolderPlus /> {showForm ? 'Close Builder' : 'Create Workspace'}
            </button>
          )}
        </div>
      </section>

      {error && <div className="alert alert-error mt-6">{error}</div>}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          {showForm && user?.role === 'Admin' && (
            <form className="card space-y-5" onSubmit={handleSubmit}>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Admin Builder</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">Create a workspace with full assignment details</h3>
                <p className="mt-2 text-sm text-slate-500">Choose the project mode, members, timeline, and a clear description up front.</p>
              </div>

              <div className="portal-switch">
                {['Individual', 'Team'].map((mode) => (
                  <button
                    key={mode}
                    className={form.accessMode === mode ? 'portal-switch__item is-active' : 'portal-switch__item'}
                    onClick={() => handleModeChange(mode)}
                    type="button"
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>Workspace name</span>
                  <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="field">
                  <span>Due date</span>
                  <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
                </label>
              </div>

              {form.accessMode === 'Team' && (
                <label className="field">
                  <span>Team name</span>
                  <input
                    placeholder="Delivery Crew, QA Wing, Design Studio"
                    value={form.teamName}
                    onChange={(event) => setForm({ ...form, teamName: event.target.value })}
                  />
                </label>
              )}

              <label className="field">
                <span>Project description</span>
                <textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{form.accessMode === 'Individual' ? 'Choose one member' : 'Choose project members'}</p>
                    <p className="text-sm text-slate-500">
                      {form.accessMode === 'Individual'
                        ? 'This workspace stays private between admin and one member.'
                        : 'Selected members will collaborate in the same shared workspace.'}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {form.memberIds.length} selected
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {members.map((member) => {
                    const selected = form.memberIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        className={selected ? 'member-pick is-selected' : 'member-pick'}
                        onClick={() => {
                          if (form.accessMode === 'Individual') {
                            setForm((current) => ({ ...current, memberIds: [member.id] }));
                            return;
                          }

                          toggleMember(member.id);
                        }}
                        type="button"
                      >
                        <div className="flex items-start gap-3">
                          <div className={selected ? 'member-pick__icon is-selected' : 'member-pick__icon'}>
                            {form.accessMode === 'Team' ? <FiUsers size={16} /> : <FiUser size={16} />}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-950">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {member.lastLoginAt ? `Last login ${new Date(member.lastLoginAt).toLocaleString()}` : 'Not logged in yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn btn-primary" disabled={loading} type="submit">
                  Create Workspace
                </button>
                <button className="btn btn-outline" onClick={() => setShowForm(false)} type="button">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {projectsWithMetrics.length === 0 ? (
              <div className="card text-center text-slate-500">
                {user?.role === 'Admin' ? 'No workspaces yet. Create the first one and start assigning work.' : 'No workspaces have been assigned to you yet.'}
              </div>
            ) : (
              projectsWithMetrics.map((project) => (
                <article key={project.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={project.accessMode === 'Team' ? 'mode-chip team' : 'mode-chip individual'}>{project.accessMode}</span>
                        {project.teamName && <span className="text-sm font-semibold text-slate-500">{project.teamName}</span>}
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-slate-950">{project.name}</h3>
                      <p className="mt-2 text-sm text-slate-500">{project.description || 'No description added yet.'}</p>
                    </div>
                    <span className={`status-chip status-${project.status.toLowerCase()}`}>{project.status}</span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-slate-400">Tasks</p>
                      <p className="font-bold text-slate-950">{project.taskCount}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-slate-400">Done</p>
                      <p className="font-bold text-emerald-600">{project.completed}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-slate-400">Overdue</p>
                      <p className="font-bold text-rose-600">{project.overdue}</p>
                    </div>
                  </div>

                  <div className="progress-track mt-4">
                    <div className="progress-bar" style={{ width: `${project.progress}%` }} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <FiUsers size={16} />
                      {project.members.filter((member) => member.user.role === 'Member').length} member access
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FiTarget size={16} />
                      {formatDate(project.dueDate)}
                    </span>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Link className="btn btn-primary" to={`/projects/${project.id}`}>
                      Open Workspace
                    </Link>
                    {user?.role === 'Admin' && (
                      <button className="btn btn-danger" onClick={() => handleDelete(project.id)} type="button">
                        <FiTrash2 /> Delete
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="space-y-6">
          {user?.role === 'Admin' ? (
            <div className="card h-fit">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <FiShield size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">Member directory</h3>
                  <p className="text-sm text-slate-500">Every registered member is available here for assignment.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {members.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No members registered yet.</p>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="task-card">
                      <p className="font-semibold text-slate-950">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {member.lastLoginAt ? `Last login ${new Date(member.lastLoginAt).toLocaleString()}` : 'Waiting for first login'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="card h-fit">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <FiTarget size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">Member notes</h3>
                  <p className="text-sm text-slate-500">Open a workspace to review tasks and update the status assigned by admin.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">Only admin can create projects and assign work.</div>
                <div className="rounded-2xl bg-slate-50 p-4">You can focus on the tasks inside your assigned workspaces and mark them complete.</div>
                <div className="rounded-2xl bg-slate-50 p-4">Your status changes are visible to admin for monitoring and follow-up.</div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </Layout>
  );
}
