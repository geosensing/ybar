import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { jobsAPI, tasksAPI, paymentsAPI } from '@/lib/api';
import { Briefcase, CheckCircle, Clock, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingReview: 0,
    pendingPayments: 0,
    totalPaid: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [jobs, tasks, payments] = await Promise.all([
        jobsAPI.getAll(),
        tasksAPI.getPendingReview(),
        paymentsAPI.getStats(),
      ]);

      setStats({
        totalJobs: jobs.jobs.filter(j => j.status === 'active').length,
        pendingReview: tasks.tasks.length,
        pendingPayments: payments.stats.pending_count,
        totalPaid: payments.stats.paid_amount,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active Jobs',
      value: stats.totalJobs,
      icon: Briefcase,
      color: 'bg-blue-500',
      link: '/admin/jobs',
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/admin/review',
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/admin/payments',
    },
    {
      title: 'Total Paid',
      value: `$${stats.totalPaid.toFixed(2)}`,
      icon: CheckCircle,
      color: 'bg-purple-500',
      link: '/admin/payments',
    },
  ];

  return (
    <Layout title="Admin Dashboard">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Link
                key={stat.title}
                to={stat.link}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.title}
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                to="/admin/jobs"
                className="border border-gray-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Create New Job</h3>
                <p className="mt-1 text-sm text-gray-500">Post a new data collection job</p>
              </Link>
              <Link
                to="/admin/review"
                className="border border-gray-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Review Submissions</h3>
                <p className="mt-1 text-sm text-gray-500">Review pending task submissions</p>
              </Link>
              <Link
                to="/admin/payments"
                className="border border-gray-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Process Payments</h3>
                <p className="mt-1 text-sm text-gray-500">Manage worker payments</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
