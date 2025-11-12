import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { profileAPI, devicesAPI, pointsAPI } from '@/lib/api';
import type { User, Device, PointsBalance } from '@/types';
import { User as UserIcon, Smartphone, DollarSign, Star } from 'lucide-react';

export default function WorkerProfile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [points, setPoints] = useState<PointsBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileData, devicesData, pointsData] = await Promise.all([
        profileAPI.get(),
        devicesAPI.getAll(),
        pointsAPI.getBalance(),
      ]);
      setProfile(profileData.user);
      setDevices(devicesData.devices);
      setPoints(pointsData);
      reset(profileData.user);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const { user } = await profileAPI.update(data);
      setProfile(user);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleReimburse = async () => {
    if (!confirm('Request reimbursement for all your points? This will convert your points to cash.')) {
      return;
    }

    if (!profile?.paytm) {
      alert('Please add your Paytm account details in your profile before requesting reimbursement.');
      setEditing(true);
      return;
    }

    try {
      const result = await pointsAPI.reimburse();
      alert(result.note);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process reimbursement');
    }
  };

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile">
      <div className="space-y-6">
        {/* Points Balance */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100">Points Balance</p>
              <p className="text-4xl font-bold mt-2">{points?.current_balance || 0}</p>
              {profile?.average_rating && (
                <div className="flex items-center mt-2 text-primary-100">
                  <Star className="h-4 w-4 mr-1 fill-current" />
                  <span>{profile.average_rating.toFixed(1)} ({profile.total_ratings} ratings)</span>
                </div>
              )}
            </div>
            <DollarSign className="h-16 w-16 text-primary-200" />
          </div>
          <button
            onClick={handleReimburse}
            disabled={!points || points.current_balance < 10}
            className="mt-4 w-full bg-white text-primary-700 px-4 py-2 rounded-md font-medium hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Reimbursement
          </button>
        </div>

        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <UserIcon className="h-6 w-6 text-gray-400 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="p-6">
            {editing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{String(errors.name.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      value={profile?.email}
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <input
                      {...register('age', { valueAsNumber: true })}
                      type="number"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sex</label>
                    <select
                      {...register('sex')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paytm Account</label>
                    <input
                      {...register('paytm')}
                      placeholder="Enter your Paytm number/ID"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      {...register('address')}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.phone || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.age || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sex</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.sex || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Paytm Account</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.paytm || 'Not provided'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.address || 'Not provided'}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        {/* Registered Devices */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <Smartphone className="h-6 w-6 text-gray-400 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Registered Devices</h2>
          </div>
          <div className="p-6">
            {devices.length === 0 ? (
              <p className="text-sm text-gray-500">No devices registered</p>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{device.device_name || device.device_id}</p>
                      <p className="text-xs text-gray-500">
                        {device.device_type} • Registered {new Date(device.registered_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
          </div>
          <div className="p-6">
            {points?.transactions && points.transactions.length > 0 ? (
              <div className="space-y-3">
                {points.transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${transaction.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points >= 0 ? '+' : ''}{transaction.points}
                      </p>
                      <p className="text-xs text-gray-500">Balance: {transaction.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
