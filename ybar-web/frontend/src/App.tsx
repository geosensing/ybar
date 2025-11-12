import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminJobs from '@/pages/admin/Jobs';
import AdminJobDetail from '@/pages/admin/JobDetail';
import AdminReviewTasks from '@/pages/admin/ReviewTasks';
import AdminPayments from '@/pages/admin/Payments';
import WorkerDashboard from '@/pages/worker/Dashboard';
import WorkerJobs from '@/pages/worker/Jobs';
import WorkerMyTasks from '@/pages/worker/MyTasks';
import WorkerTaskDetail from '@/pages/worker/TaskDetail';
import WorkerPayments from '@/pages/worker/Payments';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  if (user?.role === 'admin') {
    return (
      <Router>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/jobs" element={<AdminJobs />} />
          <Route path="/admin/jobs/:id" element={<AdminJobDetail />} />
          <Route path="/admin/review" element={<AdminReviewTasks />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/worker" element={<WorkerDashboard />} />
        <Route path="/worker/jobs" element={<WorkerJobs />} />
        <Route path="/worker/my-tasks" element={<WorkerMyTasks />} />
        <Route path="/worker/tasks/:id" element={<WorkerTaskDetail />} />
        <Route path="/worker/payments" element={<WorkerPayments />} />
        <Route path="*" element={<Navigate to="/worker" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
