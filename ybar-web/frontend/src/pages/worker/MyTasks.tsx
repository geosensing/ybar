import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { tasksAPI } from '@/lib/api';
import type { Task } from '@/types';
import { Clock, FileText, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function WorkerMyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { tasks: tasksData } = await tasksAPI.getMyTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'submitted':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout title="My Tasks">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'assigned' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'submitted' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Submitted
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'approved' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Approved
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">
              {filter === 'all' ? 'No tasks yet. Browse jobs to get started!' : `No ${filter} tasks`}
            </p>
            {filter === 'all' && (
              <Link
                to="/worker/jobs"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700"
              >
                Browse Available Jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <Link
                key={task.id}
                to={`/worker/tasks/${task.id}`}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {getStatusIcon(task.status)}
                      <h3 className="ml-2 text-lg font-medium text-gray-900 line-clamp-1">
                        {task.title}
                      </h3>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 font-medium mb-2">{task.job_title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>

                  {task.location_name && (
                    <p className="text-sm text-gray-600 mb-2">📍 {task.location_name}</p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ${task.pay_per_task}
                    </div>
                    {task.file_count && task.file_count > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-1" />
                        {task.file_count} files
                      </div>
                    )}
                  </div>

                  {task.reviewer_notes && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                      Note: {task.reviewer_notes}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
