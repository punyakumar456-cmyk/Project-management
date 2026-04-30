import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiMessageSquare, FiSend, FiTarget, FiTrash2, FiUserPlus, FiUsers } from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore, useProjectStore, useTaskStore } from '../store';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'No due date');
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'Just now');

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    selectedProject,
    error: projectError,
    getProjectById,
    addProjectMember,
    removeProjectMember,
    updateProject,
    addProjectMessage,
  } = useProjectStore();
  const { tasks, error: taskError, getProjectTasks, createTask, updateTask } = useTaskStore();

  const [memberForm, setMemberForm] = useState({ email: '', role: 'Member' });
  const [workspaceMessage, setWorkspaceMessage] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'Medium',
    dueDate: '',
  });

  useEffect(() => {
    getProjectById(projectId);
    getProjectTasks(projectId);
  }, [projectId, getProjectById, getProjectTasks]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    const memberOptions = selectedProject.members.filter((member) => member.user.role === 'Member');
    if (selectedProject.accessMode === 'Individual' && memberOptions[0]) {
      setTaskForm((current) => ({
        ...current,
        assigneeId: String(memberOptions[0].user.id),
      }));
    }
  }, [selectedProject]);

  const canManageProject = Boolean(selectedProject?.permissions?.canManage);
  const workspaceMembers = selectedProject?.members.filter((member) => member.user.role === 'Member') ?? [];
  const myProjectTasks = useMemo(
    () => tasks.filter((task) => task.assignee?.id === user?.id && task.projectId === selectedProject?.id),
    [tasks, user?.id, selectedProject?.id]
  );

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === 'To Do'),
      progress: tasks.filter((task) => task.status === 'In Progress'),
      done: tasks.filter((task) => task.status === 'Done'),
    }),
    [tasks]
  );

  const myGroupedTasks = useMemo(
    () => ({
      todo: myProjectTasks.filter((task) => task.status === 'To Do'),
      progress: myProjectTasks.filter((task) => task.status === 'In Progress'),
      done: myProjectTasks.filter((task) => task.status === 'Done'),
    }),
    [myProjectTasks]
  );

  const memberProgress = useMemo(
    () =>
      workspaceMembers.map((member) => {
        const assignedTasks = tasks.filter((task) => task.assignee?.id === member.user.id);
        const completed = assignedTasks.filter((task) => task.status === 'Done').length;
        const overdue = assignedTasks.filter((task) => task.isOverdue).length;

        return {
          ...member,
          assignedTasks,
          completed,
          overdue,
          progress: assignedTasks.length ? Math.round((completed / assignedTasks.length) * 100) : 0,
        };
      }),
    [workspaceMembers, tasks]
  );

  const handleAddMember = async (event) => {
    event.preventDefault();
    await addProjectMember(Number(projectId), memberForm.email, memberForm.role);
    setMemberForm({ email: '', role: 'Member' });
    await getProjectById(projectId);
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    await createTask({
      ...taskForm,
      projectId: Number(projectId),
      assigneeId: taskForm.assigneeId || null,
    });
    setTaskForm({
      title: '',
      description: '',
      assigneeId: selectedProject?.accessMode === 'Individual' && workspaceMembers[0] ? String(workspaceMembers[0].user.id) : '',
      priority: 'Medium',
      dueDate: '',
    });
    await getProjectTasks(projectId);
    await getProjectById(projectId);
  };

  const handleQuickStatusChange = async (taskId, status) => {
    await updateTask(taskId, { status });
    await getProjectTasks(projectId);
    await getProjectById(projectId);
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Remove this member from the project?')) {
      await removeProjectMember(Number(projectId), memberId);
      await getProjectById(projectId);
      await getProjectTasks(projectId);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    await addProjectMessage(Number(projectId), workspaceMessage);
    setWorkspaceMessage('');
    await getProjectById(projectId);
  };

  if (!selectedProject) {
    return (
      <Layout>
        <div className="card text-slate-500">Loading workspace...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero-panel">
        <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200" onClick={() => navigate('/projects')} type="button">
          <FiArrowLeft /> Back to workspaces
        </button>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className={selectedProject.accessMode === 'Team' ? 'mode-chip team' : 'mode-chip individual'}>{selectedProject.accessMode}</span>
              {selectedProject.teamName && <span className="text-sm font-semibold text-cyan-100">{selectedProject.teamName}</span>}
              <span className={`status-chip status-${selectedProject.status.toLowerCase()}`}>{selectedProject.status}</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-tight lg:text-4xl">{selectedProject.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">{selectedProject.description || 'No project description yet.'}</p>
          </div>

          <div className="glass-panel grid min-w-[280px] gap-3 rounded-[1.6rem] p-5 text-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Owner</span>
              <span className="font-semibold">{selectedProject.owner.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Deadline</span>
              <span className="font-semibold">{formatDate(selectedProject.dueDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Role</span>
              <span className="font-semibold">{selectedProject.currentUserRole}</span>
            </div>
          </div>
        </div>
      </section>

      {(projectError || taskError) && <div className="alert alert-error mt-6">{projectError || taskError}</div>}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
        <section className="space-y-6">
          {canManageProject ? (
            <form className="card space-y-4" onSubmit={handleCreateTask}>
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Admin Assignment</p>
                  <h3 className="text-2xl font-bold text-slate-950">Assign tasks with full details</h3>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{tasks.length} total tasks</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>Task title</span>
                  <input required value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} />
                </label>
                <label className="field">
                  <span>Due date</span>
                  <input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} />
                </label>
              </div>

              <label className="field">
                <span>Description</span>
                <textarea rows="3" value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>{selectedProject.accessMode === 'Individual' ? 'Assigned member' : 'Assign to member'}</span>
                  <select
                    disabled={selectedProject.accessMode === 'Individual'}
                    value={taskForm.assigneeId}
                    onChange={(event) => setTaskForm({ ...taskForm, assigneeId: event.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {workspaceMembers.map((member) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Priority</span>
                  <select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>

              <button className="btn btn-primary" type="submit">
                Create Task
              </button>
            </form>
          ) : (
            <div className="card">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Member Workspace</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">Your assigned work in this project</h3>
              <div className="scroll-row mt-5">
                {myProjectTasks.map((task) => (
                  <Link key={task.id} to={`/tasks/${task.id}`} className="task-card block">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{task.title}</p>
                      <span className={`status-chip status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{task.description || 'Open the task to update progress.'}</p>
                    <p className={`mt-3 text-xs font-semibold ${task.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>Due {formatDate(task.dueDate)}</p>
                  </Link>
                ))}
                {myProjectTasks.length === 0 && (
                  <div className="task-card">
                    <p className="font-semibold text-slate-950">No direct assignments yet</p>
                    <p className="mt-2 text-sm text-slate-500">Admin has not assigned a task to you in this workspace yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {canManageProject ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { key: 'todo', title: 'To Do' },
                { key: 'progress', title: 'In Progress' },
                { key: 'done', title: 'Done' },
              ].map((column) => (
                <div key={column.key} className="task-lane">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-950">{column.title}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{groupedTasks[column.key].length}</span>
                  </div>
                  {groupedTasks[column.key].length === 0 ? (
                    <p className="rounded-2xl bg-white/70 p-4 text-sm text-slate-500">No tasks here.</p>
                  ) : (
                    groupedTasks[column.key].map((task) => (
                      <article key={task.id} className="task-card">
                        <Link className="font-semibold text-slate-950 hover:text-cyan-700" to={`/tasks/${task.id}`}>
                          {task.title}
                        </Link>
                        <p className="mt-2 text-sm text-slate-500">{task.assignee ? task.assignee.name : 'Unassigned'}</p>
                        <p className={`mt-2 text-xs font-semibold ${task.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>{formatDate(task.dueDate)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {['To Do', 'In Progress', 'Done'].map((status) => (
                            <button
                              key={status}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                task.status === status ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                              onClick={() => handleQuickStatusChange(task.id, status)}
                              type="button"
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">My Task Board</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">Only your assigned tasks</h3>
              <p className="mt-2 text-sm text-slate-500">You do not see the admin board here. Only tasks assigned to you are shown unless you are made team lead.</p>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {[
                  { key: 'todo', title: 'To Do' },
                  { key: 'progress', title: 'In Progress' },
                  { key: 'done', title: 'Done' },
                ].map((column) => (
                  <div key={column.key} className="task-lane">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-950">{column.title}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{myGroupedTasks[column.key].length}</span>
                    </div>
                    {myGroupedTasks[column.key].length === 0 ? (
                      <p className="rounded-2xl bg-white/70 p-4 text-sm text-slate-500">No assigned tasks in this column.</p>
                    ) : (
                      myGroupedTasks[column.key].map((task) => (
                        <article key={task.id} className="task-card">
                          <Link className="font-semibold text-slate-950 hover:text-cyan-700" to={`/tasks/${task.id}`}>
                            {task.title}
                          </Link>
                          <p className="mt-2 text-sm text-slate-500">{task.description || 'Open the task to update your progress.'}</p>
                          <p className={`mt-2 text-xs font-semibold ${task.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>{formatDate(task.dueDate)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {['To Do', 'In Progress', 'Done'].map((status) => (
                              <button
                                key={status}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  task.status === status ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                                onClick={() => handleQuickStatusChange(task.id, status)}
                                type="button"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          {canManageProject && (
            <div className="card">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Workspace Control</p>
              <h3 className="mt-2 text-xl font-bold text-slate-950">Admin settings</h3>
              <div className="mt-4 space-y-3">
                <label className="field">
                  <span>Project status</span>
                  <select value={selectedProject.status} onChange={(event) => updateProject(Number(projectId), { status: event.target.value })}>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>
                {selectedProject.accessMode === 'Team' && (
                  <label className="field">
                    <span>Team name</span>
                    <input
                      value={selectedProject.teamName || ''}
                      onChange={(event) => updateProject(Number(projectId), { teamName: event.target.value })}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <FiUsers size={18} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-950">{canManageProject ? 'Team monitoring' : 'Workspace members'}</h3>
                <p className="text-sm text-slate-500">
                  {canManageProject ? "See each member's task load and progress at a glance." : 'These are the people connected to this workspace.'}
                </p>
              </div>
            </div>

            {canManageProject && selectedProject.accessMode === 'Team' && (
              <form className="mt-5 space-y-3" onSubmit={handleAddMember}>
                <label className="field">
                  <span>Member email</span>
                  <input required type="email" value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} />
                </label>
                <label className="field">
                  <span>Workspace role</span>
                  <select value={memberForm.role} onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })}>
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>
                <button className="btn btn-primary" type="submit">
                  <FiUserPlus /> Add Member
                </button>
              </form>
            )}

            <div className="mt-5 space-y-3">
              {canManageProject
                ? memberProgress.map((member) => (
                    <div key={member.user.id} className="member-health-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{member.user.name}</p>
                          <p className="text-sm text-slate-500">{member.user.email}</p>
                        </div>
                        {selectedProject.accessMode === 'Team' && member.user.id !== selectedProject.ownerId && (
                          <button className="text-rose-600 transition hover:text-rose-800" onClick={() => handleRemoveMember(member.user.id)} type="button">
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400">Assigned</p>
                          <p className="font-bold text-slate-950">{member.assignedTasks.length}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Done</p>
                          <p className="font-bold text-emerald-600">{member.completed}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Overdue</p>
                          <p className="font-bold text-rose-600">{member.overdue}</p>
                        </div>
                      </div>
                      <div className="progress-track mt-4">
                        <div className="progress-bar" style={{ width: `${member.progress}%` }} />
                      </div>
                    </div>
                  ))
                : selectedProject.members.map((member) => (
                    <div key={member.user.id} className="task-card">
                      <p className="font-semibold text-slate-950">{member.user.name}</p>
                      <p className="text-sm text-slate-500">{member.user.email} - {member.role}</p>
                    </div>
                  ))}
            </div>
          </div>

          {canManageProject && (
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                  <FiTarget size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">Task activity</h3>
                  <p className="text-sm text-slate-500">Admins can monitor every important task move here.</p>
                </div>
              </div>
              <div className="timeline mt-5">
                {selectedProject.activity?.length ? (
                  selectedProject.activity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="timeline-item">
                      <p className="font-semibold text-slate-950">{activity.user.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{activity.details || activity.action}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {activity.task?.title ? `${activity.task.title} - ` : ''}
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Task activity will appear after the first assignment or status update.</p>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                <FiMessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-950">Workspace discussion</h3>
                <p className="text-sm text-slate-500">Share updates, blockers, and handoffs inside the project.</p>
              </div>
            </div>

            <form className="mt-5 flex gap-3" onSubmit={handleSendMessage}>
              <input placeholder="Write an update, blocker, or note" value={workspaceMessage} onChange={(event) => setWorkspaceMessage(event.target.value)} />
              <button className="btn btn-primary" type="submit">
                <FiSend />
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {selectedProject.messages?.length ? (
                selectedProject.messages.map((message) => (
                  <div key={message.id} className="task-card">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{message.user.name}</p>
                      <span className="text-xs text-slate-400">{formatDateTime(message.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{message.message}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No messages yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
