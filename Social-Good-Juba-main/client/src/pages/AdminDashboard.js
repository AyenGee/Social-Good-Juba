import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [freelancerProfiles, setFreelancerProfiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [conversations, setConversations] = useState([]);

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
      
      // Fetch users, freelancer profiles, reports, and conversations
      const [usersResponse, profilesResponse, reportsResponse, conversationsResponse] = await Promise.allSettled([
        axios.get('/api/users/admin/users'),
        axios.get('/api/users/freelancer-profiles'),
        axios.get('/api/reports/admin/all').catch(() => ({ data: { reports: [] } })),
        axios.get('/api/reports/admin/chats').catch(() => ({ data: { conversations: [] } }))
      ]);

      console.log('Users response:', usersResponse.value?.data);
      console.log('Profiles response:', profilesResponse.value?.data);
      console.log('Profiles array:', profilesResponse.value?.data?.profiles);

      setUsers(usersResponse.value?.data || []);
      setFreelancerProfiles(profilesResponse.value?.data?.profiles || []);
      setReports(reportsResponse.value?.data?.reports || []);
      setConversations(conversationsResponse.value?.data?.conversations || []);
      
      // Calculate comprehensive admin stats
      const adminStats = {
        totalUsers: usersResponse.value?.data?.length || 0,
        totalFreelancers: usersResponse.value?.data?.filter(u => (u.freelancer_profiles && u.freelancer_profiles.length > 0)).length || 0,
        totalClients: usersResponse.value?.data?.filter(u => !(u.freelancer_profiles && u.freelancer_profiles.length > 0)).length || 0,
        totalReports: reportsResponse.value?.data?.reports?.length || 0,
        pendingReports: reportsResponse.value?.data?.reports?.filter(r => r.status === 'pending').length || 0,
        totalConversations: conversationsResponse.value?.data?.conversations?.length || 0
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

  const toggleVerifyFreelancer = async (userId, currentVerified) => {
    try {
      await axios.post(`/api/users/admin/freelancers/${userId}/verify`, { verified: !currentVerified });
      fetchAdminData();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update verification');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/users/admin/users/${userId}`);
      fetchAdminData();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete user');
    }
  };

  const updateReportStatus = async (reportId, status, adminNotes = '') => {
    try {
      await axios.put(`/api/reports/admin/${reportId}/status`, { status, admin_notes: adminNotes });
      fetchAdminData();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update report status');
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/reports/admin/jobs/${jobId}`);
      fetchAdminData();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete job');
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
          Freelancer Profiles ({stats.totalFreelancers})
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports ({stats.pendingReports || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          All Chats ({stats.totalConversations || 0})
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
                                <span className={`role-badge ${user.admin_status ? 'role-admin' : ((user.freelancer_profiles && user.freelancer_profiles[0]?.approval_status === 'approved') ? 'role-freelancer' : 'role-client')}`}>
                                  {user.admin_status ? 'Admin' : ((user.freelancer_profiles && user.freelancer_profiles[0]?.approval_status === 'approved') ? 'Freelancer' : 'Client')}
                                </span>
                              </td>
                              <td>
                                {user.admin_status ? 'Admin' : ((user.freelancer_profiles && user.freelancer_profiles[0]?.approval_status) ? user.freelancer_profiles[0].approval_status : 'Active')}
                              </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        {(user.freelancer_profiles && user.freelancer_profiles[0]) && (
                          <button className="btn btn-sm btn-success" onClick={() => toggleVerifyFreelancer(user.id, !!user.verification_status)}>
                            {user.verification_status ? 'Unverify' : 'Verify'}
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger" style={{marginLeft: 8}} onClick={() => deleteUser(user.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="section-header">
              <h2>User Reports</h2>
              <p>Review and manage user reports</p>
            </div>
            
            {reports.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No reports yet</h3>
                <p>User reports will appear here when submitted.</p>
              </div>
            ) : (
              <div className="reports-list">
                {reports.map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <div className="report-info">
                        <h4>{report.report_type.replace('_', ' ').toUpperCase()}</h4>
                        <p>Reported by: {report.reporter?.username || report.reporter?.email}</p>
                        <p>Reported user: {report.reported_user?.username || report.reported_user?.email}</p>
                        <p>Date: {new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`status-badge ${report.status}`}>
                        {report.status}
                      </span>
                    </div>
                    
                    <div className="report-description">
                      <strong>Description:</strong>
                      <p>{report.description}</p>
                    </div>
                    
                    {report.job && (
                      <div className="report-context">
                        <strong>Related Job:</strong> {report.job.title}
                      </div>
                    )}
                    
                    {report.status === 'pending' && (
                      <div className="report-actions">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                        >
                          Resolve
                        </button>
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="chats-section">
            <div className="section-header">
              <h2>All Conversations</h2>
              <p>Monitor all platform conversations</p>
            </div>
            
            {conversations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>No conversations yet</h3>
                <p>User conversations will appear here.</p>
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.map(conversation => (
                  <div key={conversation.id} className="conversation-card">
                    <div className="conversation-header">
                      <div className="conversation-participants">
                        <h4>
                          {conversation.client?.username || conversation.client?.email} ↔ 
                          {conversation.freelancer?.username || conversation.freelancer?.email}
                        </h4>
                        <p>Last updated: {new Date(conversation.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="conversation-messages">
                      <strong>Recent Messages:</strong>
                      {conversation.messages && conversation.messages.slice(-3).map(message => (
                        <div key={message.id} className="message-preview">
                          <span className="message-sender">{message.sender?.username}:</span>
                          <span className="message-content">{message.content}</span>
                          <span className="message-time">{new Date(message.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
