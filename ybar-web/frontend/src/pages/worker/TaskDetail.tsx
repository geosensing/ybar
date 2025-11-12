import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { tasksAPI } from '@/lib/api';
import type { Task } from '@/types';
import { ArrowLeft, Upload, MapPin } from 'lucide-react';

export default function WorkerTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionData, setSubmissionData] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    try {
      const { task: taskData } = await tasksAPI.getById(Number(id));
      setTask(taskData);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submission_data', submissionData);

      if (files) {
        Array.from(files).forEach((file) => {
          formData.append('files', file);
        });
      }

      await tasksAPI.submit(task.id, formData);
      navigate('/worker/my-tasks');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Task Details">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout title="Task Not Found">
        <div className="text-center py-12">
          <p className="text-gray-500">Task not found</p>
          <Link to="/worker/my-tasks" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
            Back to My Tasks
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={task.title}>
      <div className="space-y-6">
        <Link
          to="/worker/my-tasks"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Tasks
        </Link>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <span className={`px-3 py-1 text-sm rounded ${
              task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
              task.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
              task.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {task.status}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Job</h3>
              <p className="mt-1 text-gray-900">{task.job_title}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-900">{task.description}</p>
            </div>

            {task.job_description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Job Description</h3>
                <p className="mt-1 text-gray-900">{task.job_description}</p>
              </div>
            )}

            {task.location_name && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <div className="mt-1 flex items-center text-gray-900">
                  <MapPin className="h-4 w-4 mr-2" />
                  {task.location_name}
                </div>
                {task.latitude && task.longitude && (
                  <p className="mt-1 text-sm text-gray-500">
                    Coordinates: {task.latitude.toFixed(4)}, {task.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500">Payment</h3>
              <p className="mt-1 text-lg font-semibold text-green-600">${task.pay_per_task}</p>
            </div>

            {task.assigned_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assigned On</h3>
                <p className="mt-1 text-gray-900">
                  {new Date(task.assigned_at).toLocaleString()}
                </p>
              </div>
            )}

            {task.reviewer_notes && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800">Reviewer Notes</h3>
                <p className="mt-1 text-sm text-yellow-700">{task.reviewer_notes}</p>
              </div>
            )}
          </div>
        </div>

        {task.status === 'assigned' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Submit Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Submission Notes
                </label>
                <textarea
                  value={submissionData}
                  onChange={(e) => setSubmissionData(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add any notes about your submission..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Files (Photos, Videos)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => setFiles(e.target.files)}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Images and videos up to 10MB each
                    </p>
                  </div>
                </div>
                {files && files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {files.length} file(s) selected:
                    </p>
                    <ul className="mt-1 text-sm text-gray-500">
                      {Array.from(files).map((file, i) => (
                        <li key={i}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  to="/worker/my-tasks"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        {task.status === 'submitted' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Your task has been submitted and is awaiting review by the administrator.
            </p>
          </div>
        )}

        {task.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Congratulations! Your task has been approved. Payment will be processed soon.
            </p>
          </div>
        )}

        {task.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              This task was rejected. Please review the feedback and contact support if needed.
            </p>
          </div>
        )}

        {task.files && task.files.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Uploaded Files</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {task.files.map((file) => (
                <a
                  key={file.id}
                  href={`/uploads/${file.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                    {file.file_type.startsWith('image/') ? (
                      <img
                        src={`/uploads/${file.file_path}`}
                        alt="Upload"
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 truncate">{file.file_path}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
