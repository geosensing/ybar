import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { jobsAPI, tasksAPI } from '@/lib/api';
import type { Job, Task } from '@/types';
import { DollarSign, MapPin, Calendar, Briefcase } from 'lucide-react';

export default function WorkerJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsData, tasksData] = await Promise.all([
        jobsAPI.getAll(),
        tasksAPI.getAvailable(),
      ]);
      setJobs(jobsData.jobs);
      setAvailableTasks(tasksData.tasks);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId: number) => {
    try {
      await tasksAPI.assign(taskId);
      navigate('/worker/my-tasks');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to accept task');
      loadData();
    }
  };

  const filteredTasks = selectedJob
    ? availableTasks.filter(t => t.job_id === selectedJob)
    : availableTasks;

  return (
    <Layout title="Browse Jobs">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Jobs Filter */}
          <div className="bg-white shadow rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Job</label>
            <select
              value={selectedJob || ''}
              onChange={(e) => setSelectedJob(e.target.value ? Number(e.target.value) : null)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Available Tasks */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Available Tasks ({filteredTasks.length})
            </h2>
            {filteredTasks.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for new data collection tasks
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                          {task.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ${task.pay_per_task}
                        </span>
                      </div>

                      <p className="text-sm text-gray-900 font-medium mb-2">{task.job_title}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>

                      {task.location_name && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          {task.location_name}
                        </div>
                      )}

                      {task.latitude && task.longitude && (
                        <div className="text-xs text-gray-500 mb-3">
                          📍 {task.latitude.toFixed(4)}, {task.longitude.toFixed(4)}
                        </div>
                      )}

                      <button
                        onClick={() => handleAcceptTask(task.id)}
                        className="w-full mt-3 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Accept Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Jobs Overview */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Active Jobs</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{job.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{job.description}</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ${job.pay_per_task} per task
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {job.location || 'Various locations'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Until {new Date(job.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        {job.available_tasks} available tasks
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
