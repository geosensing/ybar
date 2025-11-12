import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { tasksAPI, paymentsAPI } from '@/lib/api';
import { Briefcase, Clock, DollarSign, CheckCircle } from 'lucide-react';

export default function WorkerDashboard() {
  const [stats, setStats] = useState({
    assigned: 0,
    submitted: 0,
    approved: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [tasks, payments] = await Promise.all([
        tasksAPI.getMyTasks(),
        paymentsAPI.getMyPayments(),
      ]);

      const tasksByStatus = tasks.tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalEarnings = payments.payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({
        assigned: tasksByStatus.assigned || 0,
        submitted: tasksByStatus.submitted || 0,
        approved: tasksByStatus.approved || 0,
        totalEarnings,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active Tasks',
      value: stats.assigned,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/worker/my-tasks',
    },
    {
      title: 'Submitted',
      value: stats.submitted,
      icon: Briefcase,
      color: 'bg-blue-500',
      link: '/worker/my-tasks',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/worker/my-tasks',
    },
    {
      title: 'Total Earnings',
      value: `$${stats.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      link: '/worker/payments',
    },
  ];

  return (
    <Layout title="Worker Dashboard">
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
                to="/worker/jobs"
                className="border border-gray-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Browse Jobs</h3>
                <p className="mt-1 text-sm text-gray-500">Find and accept new tasks</p>
              </Link>
              <Link
                to="/worker/my-tasks"
                className="border border-gray-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">My Tasks</h3>
                <p className="mt-1 text-sm text-gray-500">View and submit your tasks</p>
              </Link>
              <Link
                to="/worker/payments"
                className="border border-gray-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Payments</h3>
                <p className="mt-1 text-sm text-gray-500">Track your earnings</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
