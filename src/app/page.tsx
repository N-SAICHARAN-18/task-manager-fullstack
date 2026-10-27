'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  Clock,
  ListTodo,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink,
  Database,
  X,
  Sparkles,
} from 'lucide-react';
import { Task } from '@/lib/supabase';

type FilterType = 'all' | 'pending' | 'completed';
type SortType = 'newest' | 'oldest' | 'title';

export default function TaskManagerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDbConfigured, setIsDbConfigured] = useState<boolean>(true);

  // Form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Edit state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  // Action loading states
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Search & Filter state
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortType>('newest');

  // Toast notifications
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Formatted date string for client hydration using standard React external store pattern
  const todayString = React.useSyncExternalStore(
    () => () => {},
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    () => ''
  );

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Date.now();
      setToast({ id, message, type });
      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 4000);
    },
    []
  );

  // Fetch tasks
  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' });
      const data = await res.json();

      if (res.status === 503) {
        setIsDbConfigured(false);
        setTasks([]);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      setIsDbConfigured(true);
      setTasks(data.tasks || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading tasks';
      console.error('fetchTasks error:', err);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    const loadInitialTasks = async () => {
      try {
        const res = await fetch('/api/tasks', { cache: 'no-store' });
        const data = await res.json();
        if (!isMounted) return;

        if (res.status === 503) {
          setIsDbConfigured(false);
          setTasks([]);
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch tasks');
        }

        setIsDbConfigured(true);
        setTasks(data.tasks || []);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Error loading tasks';
        console.error('Initial fetch error:', err);
        showToast(msg, 'error');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialTasks();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      setFormError('Please enter a task title.');
      return;
    }

    if (trimmedTitle.length > 255) {
      setFormError('Title must be 255 characters or less.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          description: newDescription.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not create task');
      }

      setTasks((prev) => [data.task, ...prev]);
      setNewTitle('');
      setNewDescription('');
      showToast('Task added successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating task';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Complete / Pending
  const handleToggleComplete = async (task: Task) => {
    const updatedStatus = !task.is_completed;
    setActionTaskId(task.id);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, is_completed: updatedStatus } : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: updatedStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      showToast(
        updatedStatus ? 'Task completed! Great job!' : 'Task marked as pending.',
        'success'
      );
    } catch (err: unknown) {
      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, is_completed: task.is_completed } : t
        )
      );
      const msg = err instanceof Error ? err.message : 'Error updating task';
      showToast(msg, 'error');
    } finally {
      setActionTaskId(null);
    }
  };

  // Start editing
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditError('');
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setEditError('');

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError('Task title cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          description: editDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save changes');
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? data.task : t))
      );
      setEditingTask(null);
      showToast('Task updated successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating task';
      setEditError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingTaskId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('Task deleted successfully.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting task';
      showToast(msg, 'error');
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter & Search
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter === 'completed') return task.is_completed;
        if (filter === 'pending') return !task.is_completed;
        return true;
      })
      .filter((task) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [tasks, filter, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border backdrop-blur-md transition-all animate-bounce-in bg-white/95"
          style={{
            borderColor:
              toast.type === 'error'
                ? '#f87171'
                : toast.type === 'info'
                ? '#93c5fd'
                : '#86efac',
          }}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          )}
          {toast.type === 'info' && (
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-700">
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 ml-2"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                TaskFlow
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  Full-Stack
                </span>
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">
                Persistent Task Manager with Next.js & Supabase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database Status indicator */}
            <div
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isDbConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {isDbConfigured
                  ? 'Supabase PostgreSQL: Connected'
                  : 'Supabase: Configuration Required'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isDbConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchTasks(false)}
              disabled={isRefreshing}
              title="Refresh task list"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Refresh tasks"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
              />
            </button>

            {/* GitHub Repo Button */}
            <a
              href="https://github.com/N-SAICHARAN-18/task-manager-fullstack"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Setup Banner if DB Not Configured */}
        {!isDbConfigured && (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm text-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h2 className="font-semibold text-amber-900 text-base">
                  Database Credentials Required
                </h2>
                <p className="text-sm text-amber-800 leading-relaxed">
                  The application is running, but real database credentials for
                  Supabase PostgreSQL have not been configured yet. To enable persistent
                  storage across sessions and deployments, please configure your
                  Supabase URL and API Key:
                </p>
                <div className="bg-amber-100/70 p-3 rounded-lg font-mono text-xs text-amber-950 space-y-1">
                  <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here</div>
                </div>
                <p className="text-xs text-amber-700">
                  You can set these in <code className="font-semibold">.env.local</code> for local development or in your Vercel Project Settings for production.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Heading */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Task Dashboard
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Create, organize, and track your daily priorities with live persistent storage.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>
              Today: {todayString || 'Active'}
            </span>
          </div>
        </section>

        {/* Summary Counter Cards */}
        <section aria-label="Task Summary Metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Tasks Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Tasks
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ListTodo className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">
                {isLoading ? '-' : totalTasks}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {totalTasks === 1 ? '1 task recorded' : `${totalTasks} tasks recorded`}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalTasks > 0 ? 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Completed Tasks Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Completed
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-600">
                {isLoading ? '-' : completedTasks}
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {completionPercentage}% Rate
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Pending Tasks Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pending
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-600">
                {isLoading ? '-' : pendingTasks}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {pendingTasks === 0 && totalTasks > 0
                  ? 'All tasks done!'
                  : `${pendingTasks} remaining`}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Add Task Form Section */}
        <section aria-labelledby="add-task-heading" className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h2 id="add-task-heading" className="text-base font-bold text-slate-900">
              Create a New Task
            </h2>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="task-title-input"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  placeholder="e.g., Finalize project documentation..."
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  maxLength={255}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="task-desc-input"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="task-desc-input"
                  rows={2}
                  placeholder="Add additional details, links, or notes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60 placeholder:text-slate-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                {newTitle.length}/255 characters
              </span>

              <button
                id="submit-task-button"
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Task List Controls: Search & Filter Tabs */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
              <button
                id="filter-all-btn"
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All ({totalTasks})
              </button>
              <button
                id="filter-pending-btn"
                onClick={() => setFilter('pending')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Pending ({pendingTasks})
              </button>
              <button
                id="filter-completed-btn"
                onClick={() => setFilter('completed')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Completed ({completedTasks})
              </button>
            </div>

            {/* Search and Sort Toolbar */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="search-task-input"
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                id="sort-task-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                aria-label="Sort tasks by"
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Tasks Container */}
          <div className="space-y-3">
            {isLoading ? (
              // Loading Skeleton
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3 animate-pulse"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              // Empty State
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <ListTodo className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {searchQuery
                      ? 'No tasks matched your search'
                      : filter === 'completed'
                      ? 'No completed tasks yet'
                      : filter === 'pending'
                      ? 'No pending tasks!'
                      : 'No tasks found'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? `Try searching for something else or clear the search query "${searchQuery}".`
                      : filter === 'completed'
                      ? 'Mark any pending task as done to see it listed here.'
                      : 'Add your first task using the form above to stay organized.'}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            ) : (
              // Task Items
              filteredTasks.map((task) => {
                const isActioning = actionTaskId === task.id;
                const isDeleting = deletingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    id={`task-item-${task.id}`}
                    className={`group bg-white rounded-2xl border transition-card p-4 sm:p-5 shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      task.is_completed
                        ? 'border-emerald-100 bg-emerald-50/20'
                        : 'border-slate-200/80 hover:border-indigo-200'
                    }`}
                  >
                    {/* Left: Checkbox & Content */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Completion Toggle Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(task)}
                        disabled={isActioning}
                        title={
                          task.is_completed
                            ? 'Mark as pending'
                            : 'Mark as completed'
                        }
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                        aria-label={
                          task.is_completed
                            ? `Mark "${task.title}" as pending`
                            : `Mark "${task.title}" as completed`
                        }
                      >
                        {isActioning ? (
                          <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                        ) : task.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600" />
                        )}
                      </button>

                      {/* Text info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-sm font-semibold text-slate-900 break-words ${
                              task.is_completed
                                ? 'line-through text-slate-400'
                                : ''
                            }`}
                          >
                            {task.title}
                          </h3>

                          {/* Status Pill */}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              task.is_completed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                task.is_completed
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {task.is_completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>

                        {task.description && (
                          <p
                            className={`text-xs mt-1.5 text-slate-600 whitespace-pre-line leading-relaxed ${
                              task.is_completed ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            Created{' '}
                            {new Date(task.created_at).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Edit & Delete) */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => openEditModal(task)}
                        title="Edit task"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        aria-label={`Edit task "${task.title}"`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        disabled={isDeleting}
                        title="Delete task"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                        aria-label={`Delete task "${task.title}"`}
                      >
                        {isDeleting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Edit Task Modal */}
      {editingTask && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 id="edit-modal-title" className="font-bold text-slate-900 text-base">
                  Edit Task
                </h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Close edit modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-task-title"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-task-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={255}
                  disabled={isSavingEdit}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-task-desc"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="edit-task-desc"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={isSavingEdit}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editTitle.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            TaskFlow Full-Stack &bull; Built with Next.js, TypeScript, Tailwind CSS & Supabase PostgreSQL
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://github.com/N-SAICHARAN-18/task-manager-fullstack"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              GitHub Repository
            </a>
            <span>&bull;</span>
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              Hosted on Vercel
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
