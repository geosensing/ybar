import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { tasksAPI } from '@/lib/api';
import type { Task } from '@/types';
import { Check, X, FileText, Star } from 'lucide-react';

export default function AdminReviewTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [workerRating, setWorkerRating] = useState<number>(0);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { tasks: tasksData } = await tasksAPI.getPendingReview();
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (taskId: number, status: 'approved' | 'rejected') => {
    setReviewing(true);
    try {
      await tasksAPI.review(taskId, status, reviewNotes, workerRating > 0 ? workerRating : undefined);
      setReviewNotes('');
      setWorkerRating(0);
      setSelectedTask(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to review task:', error);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <Layout title="Review Task Submissions">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500">No tasks pending review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks List */}
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`bg-white shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  selectedTask?.id === task.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  {task.file_count && task.file_count > 0 && (
                    <span className="flex items-center text-sm text-gray-500">
                      <FileText className="h-4 w-4 mr-1" />
                      {task.file_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{task.job_title}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Worker: {task.worker_name}</span>
                  <span className="text-gray-500">${task.pay_per_task}</span>
                </div>
                {task.submitted_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted: {new Date(task.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Review Panel */}
          <div className="lg:sticky lg:top-6 h-fit">
            {selectedTask ? (
              <div className="bg-white shadow rounded-lg p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{selectedTask.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Job Details</h3>
                  <p className="text-sm text-gray-600">{selectedTask.job_title}</p>
                  <p className="text-sm text-gray-600 mt-1">Pay: ${selectedTask.pay_per_task}</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Worker</h3>
                  <p className="text-sm text-gray-600">{selectedTask.worker_name}</p>
                  <p className="text-sm text-gray-500">{selectedTask.worker_email}</p>
                </div>

                {selectedTask.location_name && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                    <p className="text-sm text-gray-600">{selectedTask.location_name}</p>
                  </div>
                )}

                {selectedTask.submission_data && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Submission Notes</h3>
                    <p className="text-sm text-gray-600">{selectedTask.submission_data}</p>
                  </div>
                )}

                {selectedTask.files && selectedTask.files.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Uploaded Files</h3>
                    <div className="space-y-2">
                      {selectedTask.files.map((file) => (
                        <a
                          key={file.id}
                          href={`/uploads/${file.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {file.file_path}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Rate Worker (Optional)</h3>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setWorkerRating(rating)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            rating <= workerRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    {workerRating > 0 && (
                      <button
                        type="button"
                        onClick={() => setWorkerRating(0)}
                        className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Review Notes (Optional)</h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Add notes for the worker..."
                  />
                </div>

                <div className="border-t pt-4 flex space-x-3">
                  <button
                    onClick={() => handleReview(selectedTask.id, 'approved')}
                    disabled={reviewing}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(selectedTask.id, 'rejected')}
                    disabled={reviewing}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <p className="text-gray-500">Select a task to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
