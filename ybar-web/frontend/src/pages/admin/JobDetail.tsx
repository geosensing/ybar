import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { jobsAPI, tasksAPI } from '@/lib/api';
import type { Job, Task } from '@/types';
import { ArrowLeft, Plus } from 'lucide-react';

interface TaskForm {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  location_name: string;
}

export default function AdminJobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<TaskForm>();

  useEffect(() => {
    if (id) {
      loadJobAndTasks();
    }
  }, [id]);

  const loadJobAndTasks = async () => {
    try {
      const [jobData, tasksData] = await Promise.all([
        jobsAPI.getById(Number(id)),
        tasksAPI.getByJob(Number(id)),
      ]);
      setJob(jobData.job);
      setTasks(tasksData.tasks);
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TaskForm) => {
    try {
      await tasksAPI.create({ ...data, job_id: Number(id) });
      reset();
      setShowTaskForm(false);
      loadJobAndTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  if (loading) {
    return (
      <Layout title="Job Details">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout title="Job Not Found">
        <div className="text-center py-12">
          <p className="text-gray-500">Job not found</p>
          <Link to="/admin/jobs" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
            Back to Jobs
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={job.title}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/admin/jobs" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Jobs
          </Link>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-900">{job.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p className="mt-1 text-gray-900">{job.location || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pay per Task</h3>
              <p className="mt-1 text-gray-900">${job.pay_per_task}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
              <p className="mt-1 text-gray-900">{job.n_tasks}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date Range</h3>
              <p className="mt-1 text-gray-900">
                {new Date(job.start_date).toLocaleDateString()} - {new Date(job.end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <span className={`mt-1 inline-block px-2 py-1 text-xs rounded ${
                job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {job.status}
              </span>
            </div>
          </div>
        </div>

        {showTaskForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Task</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  {...register('title', { required: true })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description', { required: true })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    {...register('latitude', { valueAsNumber: true })}
                    type="number"
                    step="any"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    {...register('longitude', { valueAsNumber: true })}
                    type="number"
                    step="any"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location Name</label>
                  <input
                    {...register('location_name')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks ({tasks.length})</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    {task.location_name && (
                      <p className="text-sm text-gray-500 mt-1">📍 {task.location_name}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.status === 'available' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                    task.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                    task.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
                {task.worker_name && (
                  <p className="text-sm text-gray-500 mt-2">Worker: {task.worker_name}</p>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-center text-gray-500 py-8">No tasks added yet</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
