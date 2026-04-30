import { create } from 'zustand';
import API from '../utils/api';

const readError = (error, fallback) => error.response?.data?.message || fallback;

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  signup: async (name, email, password, passwordConfirm, role) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/signup', { name, email, password, passwordConfirm, role });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (error) {
      const message = readError(error, 'Signup failed.');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  login: async (email, password, role) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/login', { email, password, role });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (error) {
      const message = readError(error, 'Login failed.');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, loading: false, error: null });
  },

  getMe: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/auth/me');
      set({ user: data.data, loading: false });
      return data.data;
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false, error: readError(error, 'Session expired.') });
      throw error;
    }
  },

  updateProfile: async (name) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put('/auth/update-profile', { name });
      set({ user: data.data, loading: false });
      return data.data;
    } catch (error) {
      const message = readError(error, 'Failed to update profile.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
}));

export const useDirectoryStore = create((set) => ({
  users: [],
  loading: false,
  error: null,

  getUsers: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/auth/users');
      set({ users: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ loading: false, error: readError(error, 'Failed to load registered users.') });
      return [];
    }
  },
}));

export const useProjectStore = create((set) => ({
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,

  getProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/projects');
      set({ projects: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ loading: false, error: readError(error, 'Failed to load projects.') });
      return [];
    }
  },

  getProjectById: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get(`/projects/${projectId}`);
      set({ selectedProject: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ loading: false, error: readError(error, 'Failed to load project.') });
      return null;
    }
  },

  createProject: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/projects', payload);
      set((state) => ({
        projects: [data.data, ...state.projects],
        loading: false,
      }));
      return data.data;
    } catch (error) {
      const message = readError(error, 'Failed to create project.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  updateProject: async (projectId, updates) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put(`/projects/${projectId}`, updates);
      set((state) => ({
        projects: state.projects.map((project) => (project.id === projectId ? data.data : project)),
        selectedProject: data.data,
        loading: false,
      }));
      return data.data;
    } catch (error) {
      const message = readError(error, 'Failed to update project.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  deleteProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await API.delete(`/projects/${projectId}`);
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== projectId),
        loading: false,
      }));
    } catch (error) {
      const message = readError(error, 'Failed to delete project.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  addProjectMember: async (projectId, email, role = 'Member') => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post(`/projects/${projectId}/members`, { email, role });
      set((state) => ({
        selectedProject: data.data,
        projects: state.projects.map((project) => (project.id === projectId ? data.data : project)),
        loading: false,
      }));
      return data.data;
    } catch (error) {
      const message = readError(error, 'Failed to add project member.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  removeProjectMember: async (projectId, userId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.delete(`/projects/${projectId}/members/${userId}`);
      set((state) => ({
        selectedProject: data.data,
        projects: state.projects.map((project) => (project.id === projectId ? data.data : project)),
        loading: false,
      }));
      return data.data;
    } catch (error) {
      const message = readError(error, 'Failed to remove project member.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  addProjectMessage: async (projectId, message) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post(`/projects/${projectId}/messages`, { message });
      set((state) => ({
        selectedProject: state.selectedProject
          ? {
              ...state.selectedProject,
              messages: data.data,
            }
          : state.selectedProject,
        loading: false,
      }));
      return data.data;
    } catch (error) {
      const messageText = readError(error, 'Failed to post workspace message.');
      set({ loading: false, error: messageText });
      throw new Error(messageText);
    }
  },
}));

export const useTaskStore = create((set) => ({
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,

  getTasks: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/tasks');
      set({ tasks: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ loading: false, error: readError(error, 'Failed to load tasks.') });
      return [];
    }
  },

  getProjectTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get(`/tasks/project/${projectId}`);
      set({ tasks: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ loading: false, error: readError(error, 'Failed to load project tasks.') });
      return [];
    }
  },

  getTaskById: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get(`/tasks/${taskId}`);
      set({ selectedTask: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ loading: false, error: readError(error, 'Failed to load task.') });
      return null;
    }
  },

  createTask: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/tasks', payload);
      set((state) => ({
        tasks: [...state.tasks, data.data],
        loading: false,
      }));
      return data.data;
    } catch (error) {
      const message = readError(error, 'Failed to create task.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  updateTask: async (taskId, updates) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put(`/tasks/${taskId}`, updates);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? data.data : task)),
        selectedTask: data.data,
        loading: false,
      }));
      return data.data;
    } catch (error) {
      const message = readError(error, 'Failed to update task.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      await API.delete(`/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
        loading: false,
      }));
    } catch (error) {
      const message = readError(error, 'Failed to delete task.');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },
}));
