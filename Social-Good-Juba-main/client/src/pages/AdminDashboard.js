import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
        const [freelancerProfiles, setFreelancerProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    email: '',
    phone: '',
    address: ''
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    if (currentUser?.admin_status) {
      fetchAdminData();
    }
  }, [currentUser]);

  const fetchAdminData = async () => {
    try {
      console.log('Fetching admin data...');
      
      // Fetch users and freelancer profiles
      const [usersResponse, profilesResponse] = await Promise.all([
        axios.get('/api/users/admin/users'),
        axios.get('/api/users/freelancer-profiles')
      ]);

      console.log('Users response:', usersResponse.data);
      console.log('Profiles response:', profilesResponse.data);
      console.log('Profiles array:', profilesResponse.data.profiles);

      setUsers(usersResponse.data || []);
      setFreelancerProfiles(profilesResponse.data.profiles || []);
      
      // Calculate admin stats
      const adminStats = {
        totalUsers: usersResponse.data?.length || 0,
        totalFreelancers: usersResponse.data?.filter(u => u.freelancer_profile).length || 0,
        totalClients: usersResponse.data?.filter(u => !u.freelancer_profile).length || 0
      };
      
      console.log('Calculated stats:', adminStats);
      setStats(adminStats);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      console.error('Error details:', error.response?.data);
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
                    onClick={() => setActiveTab('freelancers')}
                  >
                    <span className="action-icon">🔧</span>
                    <span>View Freelancers</span>
                  </button>
                  <button 
                    className="quick-action"
                    onClick={() => setActiveTab('users')}
                  >
                    <span className="action-icon">👥</span>
                    <span>Manage Users</span>
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
                <h3>Freelancer Summary</h3>
                <div className="application-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Freelancers:</span>
                    <span className="summary-value approved">{stats.totalFreelancers}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Active Users:</span>
                    <span className="summary-value pending">{stats.totalUsers}</span>
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
                        <button className="btn btn-sm btn-outline">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </div>
  );
};

export default AdminDashboard;
