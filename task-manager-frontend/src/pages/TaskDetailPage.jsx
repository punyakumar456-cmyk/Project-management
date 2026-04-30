import { useEffect, useState } from 'react';
import { FiArrowLeft, FiSave, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTaskStore } from '../store';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'No due date');
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'Just now');

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { selectedTask, error, getTaskById, updateTask, deleteTask } = useTaskStore();
  const [form, setForm] = useState(null);

  useEffect(() => {
    getTaskById(taskId);
  }, [taskId, getTaskById]);

  useEffect(() => {
    if (selectedTask) {
      setForm({
        title: selectedTask.title,
        description: selectedTask.description,
        status: selectedTask.status,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate ? selectedTask.dueDate.slice(0, 10) : '',
      });
    }
  }, [selectedTask]);

  const canManage = Boolean(selectedTask?.permissions?.canManage);
  const canUpdateStatus = Boolean(selectedTask?.permissions?.canUpdateStatus);

  const handleSave = async () => {
    if (!form) {
      return;
    }

    const payload = canManage ? form : { status: form.status };
    await updateTask(Number(taskId), payload);
    navigate(`/projects/${selectedTask.project.id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this task?')) {
      await deleteTask(Number(taskId));
      navigate(`/projects/${selectedTask.project.id}`);
    }
  };

  if (!selectedTask || !form) {
    return (
      <Layout>
        <div className="card text-slate-500">Loading task...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero-panel">
        <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200" onClick={() => navigate(-1)} type="button">
          <FiArrowLeft /> Back
        </button>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
              {canManage ? 'Admin Task Control' : 'Member Task View'}
            </p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">{selectedTask.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {canManage
                ? 'Update the full task definition, rework details, and monitor status changes from the activity feed.'
                : 'You can update the status of this assigned task and keep admin informed through progress changes.'}
            </p>
          </div>
          <div className="glass-panel grid min-w-[280px] gap-3 rounded-[1.6rem] p-5 text-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Project</span>
              <span className="font-semibold">{selectedTask.project.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Assigned to</span>
              <span className="font-semibold">{selectedTask.assignee?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Deadline</span>
              <span className="font-semibold">{formatDate(selectedTask.dueDate)}</span>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="alert alert-error mt-6">{error}</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Task Detail</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">{canManage ? 'Full task editor' : 'Status update panel'}</h3>
          </div>

          <label className="field">
            <span>Title</span>
            <input disabled={!canManage} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea disabled={!canManage} rows="5" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="field">
              <span>Status</span>
              <select disabled={!canUpdateStatus} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </label>

            <label className="field">
              <span>Priority</span>
              <select disabled={!canManage} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label className="field">
              <span>Due date</span>
              <input disabled={!canManage} type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </label>
          </div>

          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={handleSave} type="button">
              <FiSave /> Save
            </button>
            {canManage && (
              <button className="btn btn-danger" onClick={handleDelete} type="button">
                <FiTrash2 /> Delete
              </button>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-bold text-slate-950">Assignment summary</h3>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Project</p>
                <p className="font-semibold text-slate-950">{selectedTask.project.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Assigned to</p>
                <p className="font-semibold text-slate-950">{selectedTask.assignee?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-slate-500">Created by</p>
                <p className="font-semibold text-slate-950">{selectedTask.creator.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Overdue</p>
                <p className={`font-semibold ${selectedTask.isOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedTask.isOverdue ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-slate-950">Activity log</h3>
            <div className="timeline mt-5">
              {selectedTask.activity?.length ? (
                selectedTask.activity.map((activity) => (
                  <div key={activity.id} className="timeline-item">
                    <p className="font-semibold text-slate-950">{activity.user.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{activity.details || activity.action}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(activity.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
