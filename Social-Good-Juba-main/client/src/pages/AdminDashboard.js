import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [freelancerProfiles, setFreelancerProfiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState(null);

  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    email: '',
    phone: '',
    address: ''
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    if (currentUser?.admin_status) {
      fetchAdminData();
    }
  }, [currentUser]);

  const fetchAdminData = async () => {
    try {
      console.log('Fetching admin data...');
      
      // Fetch all admin data
      const [usersResponse, profilesResponse, jobsResponse] = await Promise.all([
        axios.get('/api/users/admin/users'),
        axios.get('/api/users/freelancer-profiles'),
        axios.get('/api/jobs/admin/jobs')
      ]);

      console.log('Users response:', usersResponse.data);
      console.log('Profiles response:', profilesResponse.data);
      console.log('Jobs response:', jobsResponse.data);

      setUsers(usersResponse.data || []);
      setFreelancerProfiles(profilesResponse.data.profiles || []);
      setJobs(jobsResponse.data.jobs || []);
      
      // Calculate comprehensive admin stats
      const adminStats = {
        totalUsers: usersResponse.data?.length || 0,
        totalFreelancers: usersResponse.data?.filter(u => u.freelancer_profile).length || 0,
        totalClients: usersResponse.data?.filter(u => !u.freelancer_profile).length || 0,
        totalJobs: jobsResponse.data.jobs?.length || 0,
        activeJobs: jobsResponse.data.jobs?.filter(j => j.status === 'posted' || j.status === 'in_progress').length || 0,
        completedJobs: jobsResponse.data.jobs?.filter(j => j.status === 'completed').length || 0,
        totalApplications: jobsResponse.data.jobs?.reduce((sum, job) => sum + (job.applications?.length || 0), 0) || 0
      };
      
      console.log('Calculated stats:', adminStats);
      setStats(adminStats);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      console.error('Error details:', error.response?.data);
      setNotification({
        type: 'error',
        message: 'Failed to load admin data'
      });
    } finally {
      setLoading(false);
    }
  };







  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    
    try {
      await axios.post('/api/users/admin/create-admin', createAdminForm);
      alert('Admin user created successfully!');
      setShowCreateAdminModal(false);
      setCreateAdminForm({ email: '', phone: '', address: '' });
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error creating admin:', error);
      alert(error.response?.data?.error || 'Failed to create admin user.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleInputChange = (e) => {
    setCreateAdminForm({
      ...createAdminForm,
      [e.target.name]: e.target.value
    });
  };

  const handleUserAction = async (userId, action) => {
    try {
      if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          await axios.delete(`/api/users/admin/users/${userId}`);
          setNotification({
            type: 'success',
            message: 'User deleted successfully'
          });
          fetchAdminData();
        }
      } else if (action === 'toggle-admin') {
        const user = users.find(u => u.id === userId);
        await axios.put(`/api/users/admin/users/${userId}`, {
          admin_status: !user.admin_status
        });
        setNotification({
          type: 'success',
          message: `User ${!user.admin_status ? 'promoted to' : 'removed from'} admin`
        });
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Action failed'
      });
    }
  };

  const handleJobAction = async (jobId, action) => {
    try {
      if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
          await axios.delete(`/api/jobs/admin/jobs/${jobId}`);
          setNotification({
            type: 'success',
            message: 'Job deleted successfully'
          });
          fetchAdminData();
        }
      } else if (action === 'update-status') {
        const job = jobs.find(j => j.id === jobId);
        const newStatus = job.status === 'posted' ? 'in_progress' : 'posted';
        await axios.put(`/api/jobs/admin/jobs/${jobId}`, {
          status: newStatus
        });
        setNotification({
          type: 'success',
          message: `Job status updated to ${newStatus}`
        });
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error performing job action:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Action failed'
      });
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const viewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  if (!currentUser?.admin_status) {
    return (
      <div className="admin-access-denied">
        <div className="access-denied-content">
          <h1>Access Denied</h1>
          <p>You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Admin Header */}
      <div className="admin-header">
        <div className="admin-title">
          <h1>Admin Dashboard</h1>
          <p>Manage users, review applications, and monitor platform activity</p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Admin Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalFreelancers}</div>
            <div className="stat-label">Freelancers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalClients}</div>
            <div className="stat-label">Clients</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalJobs}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-number">{stats.activeJobs}</div>
            <div className="stat-label">Active Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.completedJobs}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalApplications}</div>
            <div className="stat-label">Applications</div>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({stats.totalUsers})
        </button>
        <button
          className={`tab-button ${activeTab === 'freelancers' ? 'active' : ''}`}
          onClick={() => setActiveTab('freelancers')}
        >
          Freelancers ({stats.totalFreelancers})
        </button>
        <button
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs ({stats.totalJobs})
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Admin Content */}
      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button 
                    className="quick-action"
                    onClick={() => setActiveTab('users')}
                  >
                    <span className="action-icon">👥</span>
                    <span>Manage Users</span>
                  </button>
                  <button 
                    className="quick-action"
                    onClick={() => setActiveTab('freelancers')}
                  >
                    <span className="action-icon">🔧</span>
                    <span>View Freelancers</span>
                  </button>
                  <button 
                    className="quick-action"
                    onClick={() => setActiveTab('jobs')}
                  >
                    <span className="action-icon">📋</span>
                    <span>Manage Jobs</span>
                  </button>
                  <button 
                    className="quick-action"
                    onClick={() => setShowCreateAdminModal(true)}
                  >
                    <span className="action-icon">👑</span>
                    <span>Create Admin</span>
                  </button>
                </div>
              </div>
              
              <div className="overview-card">
                <h3>Platform Summary</h3>
                <div className="application-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Users:</span>
                    <span className="summary-value approved">{stats.totalUsers}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Freelancers:</span>
                    <span className="summary-value pending">{stats.totalFreelancers}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Active Jobs:</span>
                    <span className="summary-value active">{stats.activeJobs}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Applications:</span>
                    <span className="summary-value total">{stats.totalApplications}</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3>Recent Activity</h3>
                <div className="recent-activity">
                  <div className="activity-item">
                    <span className="activity-icon">👤</span>
                    <span className="activity-text">Latest user joined</span>
                    <span className="activity-time">2 hours ago</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">📋</span>
                    <span className="activity-text">New job posted</span>
                    <span className="activity-time">4 hours ago</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">✅</span>
                    <span className="activity-text">Job completed</span>
                    <span className="activity-time">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'freelancers' && (
          <div className="applications-section">
            <div className="section-header">
              <h2>Freelancer Profiles</h2>
              <p>View all freelancer profiles on the platform</p>
            </div>

            {freelancerProfiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔧</div>
                <h3>No freelancer profiles yet</h3>
                <p>Users will appear here once they create their freelancer profiles.</p>
              </div>
            ) : (
              <div className="applications-list">
                {freelancerProfiles.map(profile => (
                  <div key={profile.id} className="application-card">
                    <div className="application-header">
                      <div className="applicant-info">
                        <h3>{profile.user?.username || profile.user?.email || 'Unknown User'}</h3>
                        <p>Profile Created: {new Date(profile.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                                         <div className="application-details">
                       <div className="detail-row">
                         <span className="detail-label">Bio:</span>
                         <span className="detail-value">{profile.bio}</span>
                       </div>
                       <div className="detail-row">
                         <span className="detail-label">Experience:</span>
                         <span className="detail-value">{profile.experience_years} years</span>
                       </div>
                       <div className="detail-row">
                         <span className="detail-label">Service Areas:</span>
                         <span className="detail-value">{profile.service_areas?.join(', ') || 'None specified'}</span>
                       </div>
                       <div className="detail-row">
                         <span className="detail-label">Hourly Rate:</span>
                         <span className="detail-value">R{profile.hourly_rate_min} - R{profile.hourly_rate_max}/hr</span>
                       </div>
                       {profile.certifications && (
                         <div className="detail-row">
                           <span className="detail-label">Certifications:</span>
                           <span className="detail-value">{profile.certifications?.join(', ') || 'None specified'}</span>
                         </div>
                       )}
                     </div>
                    
                    
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>User Management</h2>
              <p>View and manage all platform users</p>
            </div>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.admin_status ? 'role-admin' : (user.freelancer_profile?.approval_status === 'approved' ? 'role-freelancer' : 'role-client')}`}>
                          {user.admin_status ? 'Admin' : (user.freelancer_profile?.approval_status === 'approved' ? 'Freelancer' : 'Client')}
                        </span>
                      </td>
                      <td>
                        {user.admin_status ? 'Admin' : (user.freelancer_profile?.approval_status ? user.freelancer_profile.approval_status : 'Active')}
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => viewUserDetails(user)}
                          >
                            View
                          </button>
                          {!user.admin_status && (
                            <button 
                              className="btn btn-sm btn-warning"
                              onClick={() => handleUserAction(user.id, 'toggle-admin')}
                            >
                              {user.admin_status ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleUserAction(user.id, 'delete')}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <div className="section-header">
              <h2>Job Management</h2>
              <p>View and manage all platform jobs</p>
            </div>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Applications</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td>{job.title}</td>
                      <td>{job.client?.username || job.client?.email || 'Unknown'}</td>
                      <td>
                        <span className={`status-badge status-${job.status}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>{job.applications?.length || 0}</td>
                      <td>{new Date(job.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => viewJobDetails(job)}
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => handleJobAction(job.id, 'update-status')}
                          >
                            Toggle Status
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleJobAction(job.id, 'delete')}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Admin Settings</h2>
              <p>Configure platform settings and preferences</p>
            </div>
            
            <div className="settings-grid">
              <div className="settings-card">
                <h3>Platform Settings</h3>
                <div className="setting-item">
                  <label>Platform Name</label>
                  <input type="text" defaultValue="Juba Platform" className="form-input" />
                </div>
                <div className="setting-item">
                  <label>Default Job Status</label>
                  <select className="form-select">
                    <option value="posted">Posted</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <button className="btn btn-primary">Save Settings</button>
              </div>

              <div className="settings-card">
                <h3>User Management</h3>
                <div className="setting-item">
                  <label>Auto-approve Freelancers</label>
                  <input type="checkbox" className="form-checkbox" />
                </div>
                <div className="setting-item">
                  <label>Require Email Verification</label>
                  <input type="checkbox" className="form-checkbox" defaultChecked />
                </div>
                <button className="btn btn-primary">Save Settings</button>
              </div>

              <div className="settings-card">
                <h3>System Information</h3>
                <div className="info-item">
                  <span className="info-label">Platform Version:</span>
                  <span className="info-value">1.0.0</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Database Status:</span>
                  <span className="info-value status-good">Connected</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Backup:</span>
                  <span className="info-value">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="modal-overlay">
          <div className="modal create-admin-modal">
            <div className="modal-header">
              <h3>Create New Admin User</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateAdminModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleCreateAdmin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={createAdminForm.email}
                    onChange={handleInputChange}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={createAdminForm.phone}
                    onChange={handleInputChange}
                    placeholder="+27123456789"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    className="form-textarea"
                    value={createAdminForm.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    required
                    rows="3"
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={creatingAdmin}
                  >
                    {creatingAdmin ? 'Creating...' : 'Create Admin User'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => setShowCreateAdminModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal user-details-modal">
            <div className="modal-header">
              <h3>User Details</h3>
              <button 
                className="modal-close"
                onClick={() => setShowUserModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-details">
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{selectedUser.username || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">
                      {selectedUser.admin_status ? 'Admin' : 
                       selectedUser.freelancer_profile ? 'Freelancer' : 'Client'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Joined:</span>
                    <span className="detail-value">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {selectedUser.freelancer_profile && (
                  <div className="detail-section">
                    <h4>Freelancer Profile</h4>
                    <div className="detail-item">
                      <span className="detail-label">Bio:</span>
                      <span className="detail-value">{selectedUser.freelancer_profile.bio || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Experience:</span>
                      <span className="detail-value">{selectedUser.freelancer_profile.experience_years} years</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Hourly Rate:</span>
                      <span className="detail-value">
                        R{selectedUser.freelancer_profile.hourly_rate_min} - R{selectedUser.freelancer_profile.hourly_rate_max}/hr
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowUserModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="modal-overlay">
          <div className="modal job-details-modal">
            <div className="modal-header">
              <h3>Job Details</h3>
              <button 
                className="modal-close"
                onClick={() => setShowJobModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="job-details">
                <div className="detail-section">
                  <h4>Job Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Title:</span>
                    <span className="detail-value">{selectedJob.title}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{selectedJob.description}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{selectedJob.location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      <span className={`status-badge status-${selectedJob.status}`}>
                        {selectedJob.status}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Client:</span>
                    <span className="detail-value">{selectedJob.client?.username || selectedJob.client?.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{new Date(selectedJob.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {selectedJob.applications && selectedJob.applications.length > 0 && (
                  <div className="detail-section">
                    <h4>Applications ({selectedJob.applications.length})</h4>
                    <div className="applications-list">
                      {selectedJob.applications.map(app => (
                        <div key={app.id} className="application-item">
                          <div className="app-freelancer">
                            {app.freelancer?.username || app.freelancer?.email}
                          </div>
                          <div className="app-rate">R{app.proposed_rate}</div>
                          <div className="app-status">
                            <span className={`status-badge status-${app.status}`}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowJobModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
