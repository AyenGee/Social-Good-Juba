import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.admin_status) {
      fetchAdminData();
    }
  }, [currentUser]);

  const fetchAdminData = async () => {
    try {
      const [usersRes, jobsRes] = await Promise.all([
        axios.get('/api/users/admin/users'),
        axios.get('/api/jobs/admin/jobs')
      ]);
      
      setUsers(usersRes.data);
      setJobs(jobsRes.data.jobs);
      
      // Calculate basic stats
      setStats({
        totalUsers: usersRes.data.length,
        totalJobs: jobsRes.data.jobs.length,
        activeJobs: jobsRes.data.jobs.filter(job => job.status === 'posted').length,
        pendingApplications: usersRes.data.filter(user => 
          user.role === 'freelancer' && user.freelancer_profile?.approval_status === 'pending'
        ).length
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser?.admin_status) {
    return (
      <div className="form-container">
        <div className="form">
          <h2>Access Denied</h2>
          <p>Admin access required.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalJobs}</div>
          <div className="stat-label">Total Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.activeJobs}</div>
          <div className="stat-label">Active Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pendingApplications}</div>
          <div className="stat-label">Pending Applications</div>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-section">
          <h2>Users</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {user.role === 'freelancer' && user.freelancer_profile ? (
                        <span className={`status-badge status-${user.freelancer_profile.approval_status}`}>
                          {user.freelancer_profile.approval_status}
                        </span>
                      ) : (
                        <span className="status-badge status-approved">Active</span>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h2>Recent Jobs</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 10).map(job => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.client?.email}</td>
                    <td>
                      <span className={`status-badge status-${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{new Date(job.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
