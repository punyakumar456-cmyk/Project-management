import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight, FiCheckCircle, FiClock, FiFolder, FiTarget, FiTrendingUp, FiUsers } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useAuthStore, useProjectStore, useTaskStore } from '../store';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'No date');

const buildStatCards = (stats) => [
  { label: 'Active Workspaces', value: stats.projects, icon: FiFolder },
  { label: 'Open Tasks', value: stats.openTasks, icon: FiClock },
  { label: 'Completed', value: stats.completedTasks, icon: FiCheckCircle },
  { label: 'Overdue', value: stats.overdueTasks, icon: FiAlertCircle },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const projects = useProjectStore((state) => state.projects);
  const getProjects = useProjectStore((state) => state.getProjects);
  const tasks = useTaskStore((state) => state.tasks);
  const getTasks = useTaskStore((state) => state.getTasks);

  useEffect(() => {
    getProjects();
    getTasks();
  }, [getProjects, getTasks]);

  const stats = useMemo(
    () => ({
      projects: projects.length,
      openTasks: tasks.filter((task) => task.status !== 'Done').length,
      completedTasks: tasks.filter((task) => task.status === 'Done').length,
      overdueTasks: tasks.filter((task) => task.isOverdue).length,
    }),
    [projects, tasks]
  );

  const myTasks = useMemo(() => tasks.filter((task) => task.assignee?.id === user?.id), [tasks, user?.id]);
  const recentTasks = useMemo(() => [...tasks].slice(0, 6), [tasks]);

  const memberPerformance = useMemo(() => {
    const members = new Map();

    projects.forEach((project) => {
      project.members
        .filter((member) => member.user.role === 'Member')
        .forEach((member) => {
          if (!members.has(member.user.id)) {
            members.set(member.user.id, {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              assigned: 0,
              done: 0,
              overdue: 0,
              inProgress: 0,
            });
          }
        });
    });

    tasks.forEach((task) => {
      if (!task.assignee?.id || !members.has(task.assignee.id)) {
        return;
      }

      const member = members.get(task.assignee.id);
      member.assigned += 1;
      if (task.status === 'Done') member.done += 1;
      if (task.status === 'In Progress') member.inProgress += 1;
      if (task.isOverdue) member.overdue += 1;
    });

    return [...members.values()].sort((left, right) => right.assigned - left.assigned || left.name.localeCompare(right.name));
  }, [projects, tasks]);

  const workspaceHealth = useMemo(
    () =>
      projects.slice(0, 6).map((project) => {
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

  const heroCopy =
    user?.role === 'Admin'
      ? {
          eyebrow: 'Admin View',
          title: 'Assign projects, steer delivery, and watch member progress in one place.',
          text: 'This workspace is now split by role. Admins create work, assign owners, and monitor every status move members make.',
        }
      : {
          eyebrow: 'Member View',
          title: 'See your assigned work clearly and move each task to completion.',
          text: 'Your dashboard focuses on the tasks assigned by admin, the deadlines that matter, and the projects where you need to act next.',
        };

  return (
    <Layout>
      <section className="hero-panel tilt-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">{heroCopy.eyebrow}</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold leading-tight lg:text-4xl">{heroCopy.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">{heroCopy.text}</p>
          </div>
          <div className="glass-panel rounded-[1.6rem] px-5 py-4 text-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Today focus</p>
            <p className="mt-2 text-2xl font-bold">{user?.role === 'Admin' ? `${stats.openTasks} tasks need direction` : `${myTasks.length} tasks on your desk`}</p>
          </div>
        </div>
      </section>

      <section className="stats-strip mt-8">
        {buildStatCards(stats).map(({ label, value, icon: Icon }) => (
          <article key={label} className="metric-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-3 text-4xl font-bold text-slate-950">{value}</p>
              </div>
              <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-lg shadow-slate-900/15">
                <Icon size={22} />
              </div>
            </div>
          </article>
        ))}
      </section>

      {user?.role === 'Admin' ? (
        <div className="workspace-shell mt-8">
          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="card">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Monitoring</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">Member workload snapshot</h3>
                </div>
                <Link className="text-sm font-semibold text-cyan-700" to="/projects">
                  Open workspaces
                </Link>
              </div>

              <div className="scroll-row">
                {memberPerformance.length === 0 ? (
                  <div className="member-health-card">
                    <p className="font-semibold text-slate-900">No members yet</p>
                    <p className="mt-2 text-sm text-slate-500">As members sign up and get assigned, their progress cards will appear here.</p>
                  </div>
                ) : (
                  memberPerformance.map((member) => {
                    const progress = member.assigned ? Math.round((member.done / member.assigned) * 100) : 0;

                    return (
                      <article key={member.id} className="member-health-card">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{progress}% done</span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400">Assigned</p>
                            <p className="font-bold text-slate-950">{member.assigned}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">In Progress</p>
                            <p className="font-bold text-amber-600">{member.inProgress}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Overdue</p>
                            <p className="font-bold text-rose-600">{member.overdue}</p>
                          </div>
                        </div>
                        <div className="progress-track mt-4">
                          <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </article>

            <article className="card">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Attention</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">Tasks that need admin action</h3>
              <div className="mt-5 space-y-3">
                {tasks.filter((task) => task.isOverdue || !task.assignee).slice(0, 6).map((task) => (
                  <Link key={task.id} to={`/tasks/${task.id}`} className="task-card block transition hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{task.project.name}</p>
                      </div>
                      <span className={`status-chip status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {task.assignee ? `Assigned to ${task.assignee.name}` : 'Unassigned task'}
                    </p>
                    <p className={`mt-2 text-xs font-semibold ${task.isOverdue ? 'text-rose-600' : 'text-amber-600'}`}>
                      {task.isOverdue ? `Overdue since ${formatDate(task.dueDate)}` : 'Needs assignee'}
                    </p>
                  </Link>
                ))}
                {tasks.filter((task) => task.isOverdue || !task.assignee).length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Nothing urgent right now. Assign more work or review active workspaces.</p>
                )}
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Portfolio</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">Workspace health</h3>
                </div>
                <FiTrendingUp className="text-cyan-700" size={22} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {workspaceHealth.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="task-card block">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{project.name}</p>
                      <span className={`status-chip status-${project.status.toLowerCase()}`}>{project.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{project.teamName || project.accessMode}</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Tasks</p>
                        <p className="font-bold text-slate-950">{project.taskCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Done</p>
                        <p className="font-bold text-emerald-600">{project.completed}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Overdue</p>
                        <p className="font-bold text-rose-600">{project.overdue}</p>
                      </div>
                    </div>
                    <div className="progress-track mt-4">
                      <div className="progress-bar" style={{ width: `${project.progress}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="card">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Recent flow</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">Latest task movement</h3>
              <div className="timeline mt-5">
                {recentTasks.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Create a workspace and assign tasks to start monitoring delivery.</p>
                ) : (
                  recentTasks.map((task) => (
                    <div key={task.id} className="timeline-item">
                      <p className="font-semibold text-slate-950">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {task.project.name} - {task.assignee ? task.assignee.name : 'Unassigned'}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {task.status} - due {formatDate(task.dueDate)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </div>
      ) : (
        <div className="workspace-shell mt-8">
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">My Tasks</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">Assigned by admin</h3>
                </div>
                <Link className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700" to="/projects">
                  View all work <FiArrowRight size={15} />
                </Link>
              </div>

              <div className="scroll-row mt-5">
                {myTasks.length === 0 ? (
                  <div className="task-card">
                    <p className="font-semibold text-slate-950">Nothing assigned yet</p>
                    <p className="mt-2 text-sm text-slate-500">When an admin assigns work, your active task cards will show up here.</p>
                  </div>
                ) : (
                  myTasks.map((task) => (
                    <Link key={task.id} to={`/tasks/${task.id}`} className="task-card block">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{task.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{task.project.name}</p>
                        </div>
                        <span className={`status-chip status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{task.description || 'Open this task to update your status.'}</p>
                      <p className={`mt-3 text-xs font-semibold ${task.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                        Due {formatDate(task.dueDate)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </article>

            <article className="card">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Execution</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">Your workload breakdown</h3>
              <div className="mt-5 space-y-4">
                {[
                  { label: 'Ready to start', value: myTasks.filter((task) => task.status === 'To Do').length, icon: FiTarget },
                  { label: 'In progress', value: myTasks.filter((task) => task.status === 'In Progress').length, icon: FiClock },
                  { label: 'Completed', value: myTasks.filter((task) => task.status === 'Done').length, icon: FiCheckCircle },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="task-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-950 p-3 text-white">
                        <Icon size={18} />
                      </div>
                      <p className="font-semibold text-slate-950">{label}</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="card">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <FiUsers size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Assigned Workspaces</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-950">Where you are currently involved</h3>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="task-card block">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{project.name}</p>
                      <span className={`status-chip status-${project.status.toLowerCase()}`}>{project.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{project.teamName || project.accessMode}</p>
                  </Link>
                ))}
                {projects.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">You have not been added to any project yet.</p>
                )}
              </div>
            </article>

            <article className="card">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Recent queue</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">Everything you can see right now</h3>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {recentTasks.map((task) => (
                  <Link key={task.id} to={`/tasks/${task.id}`} className="task-card block">
                    <p className="font-semibold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.project.name}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      {task.assignee ? `Owner: ${task.assignee.name}` : 'Waiting for assignee'} - {formatDate(task.dueDate)}
                    </p>
                  </Link>
                ))}
                {recentTasks.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Your task feed will populate after the first assignment.</p>
                )}
              </div>
            </article>
          </section>
        </div>
      )}
    </Layout>
  );
}
