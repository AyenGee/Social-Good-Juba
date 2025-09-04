import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RatingModal from '../components/RatingModal';
import RatingDisplay from '../components/RatingDisplay';
import ChatButton from '../components/ChatButton';
import '../components/Reviews.css';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [activeMode, setActiveMode] = useState('client'); // 'client' or 'freelancer'
  const [clientData, setClientData] = useState({ jobs: [], stats: {}, applications: [] });
  const [freelancerData, setFreelancerData] = useState({ 
    applications: [], 
    approvedJobs: [], 
    stats: {},
    hasApprovedProfile: true 
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewsTab, setReviewsTab] = useState('given'); // 'given' or 'received'
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingJob, setEditingJob] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingJob, setRatingJob] = useState(null);
  const [ratingUser, setRatingUser] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser, activeMode, lastRefresh]);



  // Function to refresh data (can be called from child components)
  const refreshData = () => {
    setLastRefresh(Date.now());
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      if (activeMode === 'client') {

        
        // Fetch client data (posted jobs, etc.)
        const [jobsResponse, statsResponse] = await Promise.all([
          axios.get('/api/jobs/my-jobs'),
          axios.get('/api/jobs/client-stats')
        ]);
        

        
        // Fetch applications for all jobs
        let applications = [];
        if (jobsResponse.data.jobs && jobsResponse.data.jobs.length > 0) {
          try {
            const jobIds = jobsResponse.data.jobs.map(job => job.id);
            const applicationsResponse = await axios.get('/api/jobs/applications', {
              params: { jobIds: jobIds.join(',') }
            });
            applications = applicationsResponse.data.applications || [];
    
          } catch (error) {
            console.error('Error fetching applications:', error);
          }
        }
        
        setClientData({
          jobs: jobsResponse.data.jobs || [],
          stats: statsResponse.data.stats || {},
          applications: applications
        });
        

      } else {

        
        // Fetch freelancer data (approved profile, available jobs, etc.)
        const [profileResponse, jobsResponse, statsResponse] = await Promise.all([
          axios.get('/api/users/freelancer-profile'),
          axios.get('/api/jobs/available-jobs'),
          axios.get('/api/jobs/freelancer-stats')
        ]);
        

        
        // Also fetch the freelancer's own applications
        let myApplications = [];
        try {
          const applicationsResponse = await axios.get('/api/jobs/my-applications');
          myApplications = applicationsResponse.data.applications || [];
        } catch (error) {
          console.error('Error fetching my applications:', error);
        }
        
        setFreelancerData({
          applications: profileResponse.data.applications || [],
          approvedJobs: jobsResponse.data.jobs || [],
          stats: statsResponse.data.stats || {},
          myApplications: myApplications, // Add this to track freelancer's own applications
          hasApprovedProfile: true // All users can access freelancer features
        });
        

      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      posted: { label: 'Posted', className: 'status-posted' },
      in_progress: { label: 'In Progress', className: 'status-in-progress' },
      completed: { label: 'Completed', className: 'status-completed' },
      cancelled: { label: 'Cancelled', className: 'status-cancelled' },
      pending: { label: 'Pending Review', className: 'status-pending' },
      approved: { label: 'Approved', className: 'status-approved' },
      rejected: { label: 'Rejected', className: 'status-cancelled' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'status-pending' };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  // Job management functions
  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowEditModal(true);
  };

  const handleDeleteJob = (jobId) => {
    setDeletingJobId(jobId);
    setShowDeleteModal(true);
  };

  const confirmDeleteJob = async () => {
    try {
      await axios.delete(`/api/jobs/${deletingJobId}`);
      setNotification({
        type: 'success',
        message: 'Job deleted successfully!'
      });
      setShowDeleteModal(false);
      setDeletingJobId(null);
      refreshData();
    } catch (error) {
      console.error('Error deleting job:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete job. Please try again.'
      });
    }
  };

  const handleUpdateJob = async (updatedJob) => {
    try {
      await axios.put(`/api/jobs/${updatedJob.id}`, updatedJob);
      setNotification({
        type: 'success',
        message: 'Job updated successfully!'
      });
      setShowEditModal(false);
      setEditingJob(null);
      refreshData();
    } catch (error) {
      console.error('Error updating job:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update job. Please try again.'
      });
    }
  };

  const handleRateUser = (job, userToRate) => {
    setRatingJob(job);
    setRatingUser(userToRate);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = () => {
    setNotification({
      type: 'success',
      message: 'Rating submitted successfully!'
    });
    refreshData();
  };

  const handleRatingCancel = () => {
    setRatingJob(null);
    setRatingUser(null);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Welcome back, {currentUser?.username || currentUser?.email}</h1>
          <p>Manage your {activeMode === 'client' ? 'jobs and requests' : 'freelancer activities'}</p>
        </div>
        
        {/* Mode Switcher */}
        <div className="mode-switcher">
          <button
            className={`mode-button ${activeMode === 'client' ? 'active' : ''}`}
            onClick={() => setActiveMode('client')}
          >
            <span className="mode-icon">👤</span>
            <span>Client Mode</span>
          </button>
          <button
            className={`mode-button ${activeMode === 'freelancer' ? 'active' : ''}`}
            onClick={() => setActiveMode('freelancer')}
          >
            <span className="mode-icon">🔧</span>
            <span>Freelancer Mode</span>
          </button>
        </div>
        
        {/* Chat Button */}
        <div className="dashboard-actions">
          <ChatButton
            clientId={currentUser?.id}
            freelancerId={currentUser?.id}
            jobId="dashboard"
            jobTitle="Dashboard Chat"
            variant="primary"
            className="dashboard-chat-btn"
          >
            💬 Messages
          </ChatButton>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close" 
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Mode-specific Content */}
      {activeMode === 'client' ? (
                 <ClientDashboard 
           data={clientData} 
           activeTab={activeTab} 
           setActiveTab={setActiveTab}
           getStatusBadge={getStatusBadge}
           onEditJob={handleEditJob}
           onDeleteJob={handleDeleteJob}
           onRateUser={handleRateUser}
         />
      ) : (
                 <>
           <FreelancerDashboard 
            data={freelancerData} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            getStatusBadge={getStatusBadge} 
            currentUser={currentUser} 
            onRefresh={refreshData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onRateUser={handleRateUser}
            reviewsTab={reviewsTab}
            setReviewsTab={setReviewsTab}
          />
        </>
      )}

      {/* Edit Job Modal */}
      {showEditModal && editingJob && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Job</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingJob(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <EditJobForm 
                job={editingJob} 
                onSubmit={handleUpdateJob}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingJob(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

             {/* Delete Job Confirmation Modal */}
       {showDeleteModal && (
         <div className="modal-overlay">
           <div className="modal">
             <div className="modal-header">
               <h3>Delete Job</h3>
               <button 
                 className="modal-close"
                 onClick={() => {
                   setShowDeleteModal(false);
                   setDeletingJobId(null);
                 }}
               >
                 ×
               </button>
             </div>
             <div className="modal-body">
               <p>Are you sure you want to delete this job? This action cannot be undone.</p>
               <p><strong>Job Title:</strong> {clientData.jobs.find(j => j.id === deletingJobId)?.title}</p>
             </div>
             <div className="modal-footer">
               <button 
                 className="btn btn-outline"
                 onClick={() => {
                   setShowDeleteModal(false);
                   setDeletingJobId(null);
                 }}
               >
                 Cancel
               </button>
               <button 
                 className="btn btn-outline"
                 onClick={confirmDeleteJob}
                 style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
               >
                 Delete Job
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Rating Modal */}
       {showRatingModal && ratingJob && ratingUser && (
         <RatingModal
           isOpen={showRatingModal}
           onClose={() => setShowRatingModal(false)}
           jobId={ratingJob.id}
           reviewedUserId={ratingUser.id}
           reviewedUserName={ratingUser.username || ratingUser.email}
           onSubmit={handleRatingSubmit}
           onCancel={handleRatingCancel}
         />
       )}
     </div>
   );
 };

// Client Dashboard Component
const ClientDashboard = ({ data, activeTab, setActiveTab, getStatusBadge, onEditJob, onDeleteJob, onRateUser }) => {
  console.log('ClientDashboard render with data:', data);
  
  return (
    <>
      {/* Client Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{data.stats.totalJobs || 0}</div>
            <div className="stat-label">Total Jobs Posted</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{data.stats.activeJobs || 0}</div>
            <div className="stat-label">Active Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{data.stats.completedJobs || 0}</div>
            <div className="stat-label">Completed Jobs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{data.stats.totalApplications || 0}</div>
            <div className="stat-label">Total Applications</div>
          </div>
        </div>
      </div>

      {/* Client Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          My Jobs
        </button>
        <button
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Applications
        </button>
      </div>

      {/* Client Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Quick Actions</h3>
                                 <div className="quick-actions">
                   <Link to="/post-job" className="quick-action">
                     <span className="action-icon">📝</span>
                     <span>Post New Job</span>
                   </Link>
                 </div>
              </div>
              
              <div className="overview-card">
                <h3>Recent Activity</h3>
                <div className="recent-activity">
                  {data.jobs.slice(0, 3).map(job => (
                    <div key={job.id} className="activity-item">
                      <div className="activity-icon">📝</div>
                      <div className="activity-content">
                        <p>Job "{job.title}" {getStatusBadge(job.status)}</p>
                        <small>{new Date(job.created_at).toLocaleDateString()}</small>
                      </div>
                    </div>
                  ))}
                  {data.jobs.length === 0 && (
                    <p className="no-activity">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <div className="section-header">
              <h2>My Posted Jobs</h2>
              <p>Manage and track your job postings</p>
            </div>
            
            {data.jobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No jobs posted yet</h3>
                <p>Start by posting your first job to find the perfect freelancer.</p>
                <Link to="/post-job" className="btn btn-primary">Post Your First Job</Link>
              </div>
            ) : (
              <div className="job-list">
                {data.jobs.map(job => (
                  <div key={job.id} className="job-item">
                    <div className="job-header">
                      <h3 className="job-title">{job.title}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="job-description">{job.description}</p>
                    <div className="job-meta">
                      <span>📍 {job.location}</span>
                      <span>💰 Negotiable</span>
                      <span>📅 {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                                         <div className="job-actions">
                       <Link to={`/job/${job.id}`} className="btn btn-outline">
                         View Details
                       </Link>
                                    <button 
                className="btn btn-secondary"
                onClick={() => onEditJob(job)}
              >
                Edit Job
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => setActiveTab('applications')}
              >
                View Applications
              </button>
              {job.status === 'completed' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    // Find the accepted freelancer for this job
                    const acceptedApp = data.applications?.find(app => 
                      app.job_id === job.id && app.status === 'accepted'
                    );
                    if (acceptedApp) {
                      onRateUser(job, {
                        id: acceptedApp.freelancer_id,
                        username: acceptedApp.freelancer_email,
                        email: acceptedApp.freelancer_email
                      });
                    }
                  }}
                >
                  Rate Freelancer
                </button>
              )}
              <button 
                className="btn btn-outline"
                onClick={() => onDeleteJob(job.id)}
                style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
              >
                Delete
              </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="applications-section">
            <div className="section-header">
              <h2>Job Applications</h2>
              <p>Review applications from freelancers for your posted jobs</p>
            </div>
            
            
            
            {data.applications && data.applications.length > 0 ? (
              <div className="applications-list">
                {data.applications.map(app => (
                  <div key={app.id} className="application-card">
                    <div className="application-header">
                      <h3>{app.job_title || 'Job Application'}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="application-details">
                      <p><strong>Freelancer:</strong> {app.freelancer_email || 'Unknown'}</p>
                      <p><strong>Proposed Rate:</strong> R{app.proposed_rate || 'Negotiable'}</p>
                      <p><strong>Applied:</strong> {new Date(app.created_at).toLocaleDateString()}</p>
                      {app.message && (
                        <p><strong>Message:</strong> {app.message}</p>
                      )}
                    </div>
                    <div className="application-actions">
                      <Link to={`/job/${app.job_id}`} className="btn btn-outline">
                        View Job Details
                      </Link>
                      {app.status === 'pending' && (
                        <button className="btn btn-primary">
                          Select Freelancer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No applications yet</h3>
                <p>Applications will appear here once freelancers start applying to your jobs.</p>
                                 <div className="empty-state-actions">
                   <Link to="/post-job" className="btn btn-primary">
                     Post a New Job
                   </Link>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Freelancer Dashboard Component
const FreelancerDashboard = ({ data, activeTab, setActiveTab, getStatusBadge, currentUser, onRefresh, searchTerm, setSearchTerm, filterStatus, setFilterStatus, onRateUser, reviewsTab, setReviewsTab }) => {
  
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicationData, setApplicationData] = useState({
    proposed_rate: ''
  });

  const handleApplyToJob = (jobId) => {
    setSelectedJobId(jobId);
    setShowApplicationModal(true);
  };

  const submitApplication = async () => {
    try {
      await axios.post(`/api/jobs/${selectedJobId}/apply`, {
        proposed_rate: parseFloat(applicationData.proposed_rate)
      });
      alert('Application submitted successfully!');
      setShowApplicationModal(false);
      setApplicationData({ proposed_rate: '' });
      onRefresh(); // Refresh the data
    } catch (error) {
      alert('Failed to apply to job. Please try again.');
      console.error('Application error:', error);
    }
  };
  
  return (
    <>
             {/* Freelancer Stats */}
       <div className="dashboard-stats">
         
                 <div className="stats-grid">
           <div className="stat-card">
             <div className="stat-icon">📋</div>
             <div className="stat-content">
               <div className="stat-number">{data.stats.applicationsSent || 0}</div>
               <div className="stat-label">Applications Sent</div>
             </div>
           </div>
           <div className="stat-card">
             <div className="stat-icon">✅</div>
             <div className="stat-content">
               <div className="stat-number">{data.stats.jobsCompleted || 0}</div>
               <div className="stat-label">Jobs Completed</div>
             </div>
           </div>
                                               <div className="stat-card">
               <div className="stat-icon">⭐</div>
               <div className="stat-content">
                                 <div className="stat-number">
                  {typeof data.stats.rating === 'number' && !isNaN(data.stats.rating) 
                    ? data.stats.rating.toFixed(1) 
                    : 'N/A'}
                </div>
                 <div className="stat-label">Average Rating</div>
               </div>
             </div>
           <div className="stat-card">
             <div className="stat-icon">💰</div>
             <div className="stat-content">
               <div className="stat-number">R{(data.stats.totalEarnings || 0).toLocaleString()}</div>
               <div className="stat-label">Total Earnings</div>
             </div>
           </div>
           
         </div>
      </div>

      {/* Freelancer Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Available Jobs
        </button>
        <button
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          My Applications
        </button>
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
                 <button
           className={`tab-button ${activeTab === 'edit-profile' ? 'active' : ''}`}
           onClick={() => setActiveTab('edit-profile')}
         >
           Edit Profile
         </button>
         <button
           className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
           onClick={() => setActiveTab('reviews')}
         >
           My Reviews
         </button>
      </div>

      {/* Freelancer Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button 
                    className="quick-action"
                    onClick={() => setActiveTab('jobs')}
                  >
                    <span className="action-icon">🔍</span>
                    <span>Browse Jobs</span>
                  </button>
                  <button 
                    className="quick-action"
                    onClick={() => setActiveTab('profile')}
                  >
                    <span className="action-icon">👤</span>
                    <span>Update Profile</span>
                  </button>
                </div>
              </div>
              
              <div className="overview-card">
                <h3>Earnings Overview</h3>
                <div className="earnings-breakdown">
                  <div className="earnings-item">
                    <span className="earnings-label">Total Earnings:</span>
                    <span className="earnings-amount">R{(data.stats.totalEarnings || 0).toLocaleString()}</span>
                  </div>
                  <div className="earnings-item">
                    <span className="earnings-label">Completed Jobs:</span>
                    <span className="earnings-count">{data.stats.jobsCompleted || 0}</span>
                  </div>
                  {data.stats.jobsCompleted > 0 && (
                    <div className="earnings-item">
                      <span className="earnings-label">Average per Job:</span>
                      <span className="earnings-amount">R{Math.round((data.stats.totalEarnings || 0) / data.stats.jobsCompleted).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="earnings-item">
                    <span className="earnings-label">Pending Applications:</span>
                    <span className="earnings-count">{data.stats.pendingApplications || 0}</span>
                  </div>
                  
                  <div className="earnings-item">
                    <span className="earnings-label">Rejected Applications:</span>
                    <span className="earnings-count">{data.stats.rejectedApplications || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="overview-card">
                <h3>Recent Activity</h3>
                <div className="recent-activity">
                  {data.applications.slice(0, 3).map(app => (
                    <div key={app.id} className="activity-item">
                      <div className="activity-icon">📝</div>
                      <div className="activity-content">
                        <p>Applied to "{app.job_title}" {getStatusBadge(app.status)}</p>
                        <small>{new Date(app.created_at).toLocaleDateString()}</small>
                      </div>
                    </div>
                  ))}
                  {data.applications.length === 0 && (
                    <p className="no-activity">No recent applications</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <div className="section-header">
              <h2>Available Jobs</h2>
              <p>Browse and apply to available jobs</p>
            </div>
            
            {/* Search and Filter */}
            <div className="search-filter-section">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search jobs by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-box">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Jobs</option>
                  <option value="posted">Posted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            {data.approvedJobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No jobs available</h3>
                <p>Check back later for new job opportunities.</p>
              </div>
            ) : (
              <div className="job-list">
                {data.approvedJobs
                  .filter(job => {
                    const matchesSearch = searchTerm === '' || 
                      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      job.description.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
                    return matchesSearch && matchesFilter;
                  })
                  .map(job => (
                    <div key={job.id} className="job-item">
                      <div className="job-header">
                        <h3 className="job-title">{job.title}</h3>
                        <span className="job-budget">R{job.budget || 'Negotiable'}</span>
                      </div>
                      <p className="job-description">{job.description}</p>
                      <div className="job-meta">
                        <span>📍 {job.location}</span>
                        <span>👤 {job.client_email}</span>
                        <span>📅 {new Date(job.created_at).toLocaleDateString()}</span>
                        <span className={`status-badge status-${job.status}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="job-actions">
                        <Link to={`/job/${job.id}`} className="btn btn-outline">
                          View Details
                        </Link>
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleApplyToJob(job.id)}
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

                 {activeTab === 'applications' && (
           <div className="applications-section">
                                                       <div className="section-header">
                 <h2>My Applications</h2>
                 <p>Track your job applications and their current status</p>
               </div>
             
                           {data.myApplications && data.myApplications.length > 0 ? (
                <div className="applications-list">
                                     {data.myApplications.map(app => (
                     <div key={app.id} className="application-card">
                       <div className="application-header">
                         <h3>{app.job_title}</h3>
                         <div className="status-group">
                           <span className="status-label">Application:</span>
                           {getStatusBadge(app.status)}
                         </div>
                       </div>
                                            <div className="application-details">
                         <p><strong>Client:</strong> {app.client_email}</p>
                         <p><strong>Proposed Rate:</strong> R{app.proposed_rate || 'Negotiable'}</p>
                         <p><strong>Applied:</strong> {new Date(app.created_at).toLocaleDateString()}</p>
                         {app.job_completion_date && (
                           <p><strong>Completed:</strong> {new Date(app.job_completion_date).toLocaleDateString()}</p>
                         )}
                         {app.message && (
                           <p><strong>Message:</strong> {app.message}</p>
                         )}
                       </div>
                       <div className="application-actions">
                         <Link to={`/job/${app.job_id}`} className="btn btn-outline">
                           View Job Details
                         </Link>
                         {app.status === 'accepted' && (
                           <button 
                             className="btn btn-primary"
                             onClick={() => {
                               // Get the client info from the application data
                               onRateUser({
                                 id: app.job_id,
                                 title: app.job_title || 'Completed Job'
                               }, {
                                 id: app.client_id,
                                 username: app.client_email,
                                 email: app.client_email
                               });
                             }}
                           >
                             Rate Client
                           </button>
                         )}

                       </div>
                     </div>
                   ))}
                 </div>
             ) : (
               <div className="empty-state">
                 <div className="empty-state-icon">📋</div>
                 <h3>No applications yet</h3>
                 <p>Start applying to jobs to see your applications here.</p>
                 <button 
                   className="btn btn-primary"
                   onClick={() => setActiveTab('jobs')}
                 >
                   Browse Jobs
                 </button>
               </div>
             )}
           </div>
         )}

        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>My Profile</h2>
              <p>Manage your freelancer profile</p>
            </div>
            
            {data.profile ? (
              <div className="profile-card">
                <div className="profile-header">
                  <h3>Profile Information</h3>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setActiveTab('edit-profile')}
                  >
                    Edit Profile
                  </button>
                </div>
                <div className="profile-content">
                  <div className="profile-field">
                    <label>Bio:</label>
                    <p>{data.profile.bio}</p>
                  </div>
                  <div className="profile-field">
                    <label>Experience:</label>
                    <p>{data.profile.experience_years} years</p>
                  </div>
                  <div className="profile-field">
                    <label>Service Areas:</label>
                    <p>{data.profile.service_areas?.join(', ') || 'None specified'}</p>
                  </div>
                  <div className="profile-field">
                    <label>Hourly Rate:</label>
                    <p>R{data.profile.hourly_rate_min} - R{data.profile.hourly_rate_max}</p>
                  </div>
                  <div className="profile-field">
                    <label>Coverage Areas:</label>
                    <p>{data.profile.coverage_areas?.join(', ') || 'None specified'}</p>
                  </div>
                  {data.profile.certifications && data.profile.certifications.length > 0 && (
                    <div className="profile-field">
                      <label>Certifications:</label>
                      <p>{data.profile.certifications.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <h3>No profile yet</h3>
                <p>Create your freelancer profile to start applying to jobs.</p>
                <Link to="/become-freelancer" className="btn btn-primary">
                  Create Profile
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'edit-profile' && (
          <div className="edit-profile-section">
            <div className="section-header">
              <h2>Edit Profile</h2>
              <p>Update your freelancer profile information</p>
            </div>
            
            {data.profile ? (
              <div className="profile-form">
                <div className="form-group">
                  <label>Bio:</label>
                  <textarea 
                    className="form-control"
                    placeholder="Tell clients about yourself and your experience..."
                    defaultValue={data.profile.bio}
                  />
                </div>
                <div className="form-group">
                  <label>Experience (years):</label>
                  <input 
                    type="number" 
                    className="form-control"
                    defaultValue={data.profile.experience_years}
                  />
                </div>
                <div className="form-group">
                  <label>Service Areas (comma-separated):</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g., Web Development, Mobile Apps, UI/UX Design"
                    defaultValue={data.profile.service_areas?.join(', ')}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Min Hourly Rate (R):</label>
                    <input 
                      type="number" 
                      className="form-control"
                      defaultValue={data.profile.hourly_rate_min}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Hourly Rate (R):</label>
                    <input 
                      type="number" 
                      className="form-control"
                      defaultValue={data.profile.hourly_rate_max}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Coverage Areas (comma-separated):</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g., Johannesburg, Cape Town, Durban"
                    defaultValue={data.profile.coverage_areas?.join(', ')}
                  />
                </div>
                <div className="form-group">
                  <label>Certifications (comma-separated):</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g., AWS Certified, Google Cloud, Microsoft Azure"
                    defaultValue={data.profile.certifications?.join(', ')}
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary">Save Changes</button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setActiveTab('profile')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <h3>No profile to edit</h3>
                <p>You need to create a profile first.</p>
                <Link to="/become-freelancer" className="btn btn-primary">
                  Create Profile
                </Link>
              </div>
            )}
          </div>
        )}

                 {activeTab === 'reviews' && (
           <div className="reviews-section">
             <div className="section-header">
               <h2>My Reviews</h2>
               <p>View reviews you've given and received</p>
             </div>
             
                           <div className="reviews-tabs">
                <button 
                  className={`review-tab ${(reviewsTab || 'given') === 'given' ? 'active' : ''}`}
                  onClick={() => setReviewsTab && setReviewsTab('given')}
                >
                  Reviews Given
                </button>
                <button 
                  className={`review-tab ${(reviewsTab || 'given') === 'received' ? 'active' : ''}`}
                  onClick={() => setReviewsTab && setReviewsTab('received')}
                >
                  Reviews Received
                </button>
              </div>
              
              <div className="reviews-content">
                <ReviewsTab 
                  type={reviewsTab || 'given'} 
                  currentUser={currentUser}
                />
              </div>
           </div>
         )}

         {/* Application Modal */}
         {showApplicationModal && (
           <div className="modal-overlay">
             <div className="modal">
               <div className="modal-header">
                 <h3>Apply to Job</h3>
                 <button 
                   className="modal-close"
                   onClick={() => setShowApplicationModal(false)}
                 >
                   ×
                 </button>
               </div>
               <div className="modal-body">
                 <div className="form-group">
                   <label>Proposed Rate (R):</label>
                   <input
                     type="number"
                     className="form-control"
                     placeholder="Enter your proposed rate"
                     value={applicationData.proposed_rate}
                     onChange={(e) => setApplicationData({
                       ...applicationData,
                       proposed_rate: e.target.value
                     })}
                   />
                 </div>

               </div>
               <div className="modal-footer">
                 <button 
                   className="btn btn-outline"
                   onClick={() => setShowApplicationModal(false)}
                 >
                   Cancel
                 </button>
                 <button 
                   className="btn btn-primary"
                   onClick={submitApplication}
                   disabled={!applicationData.proposed_rate}
                 >
                   Submit Application
                 </button>
               </div>
             </div>
           </div>
         )}
       </div>
     </>
   );
 };

// Reviews Tab Component
const ReviewsTab = ({ type, currentUser }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [type]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ratings/history');
      setReviews(response.data[type] || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⭐</div>
        <h3>No {type} reviews yet</h3>
        <p>You haven't {type === 'given' ? 'given any' : 'received any'} reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="reviews-list">
      {reviews.map(review => (
        <div key={review.id} className="review-item">
          <div className="review-header">
            <div className="review-rating">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  className={`star ${i < review.rating ? 'filled' : 'empty'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="review-date">
              {new Date(review.timestamp).toLocaleDateString()}
            </div>
          </div>
          {review.comment && (
            <div className="review-comment">
              {review.comment}
            </div>
          )}
          <div className="review-job">
            <strong>Job:</strong> {review.job?.title || 'Unknown Job'}
          </div>
          <div className="review-user">
            <strong>{type === 'given' ? 'Rated:' : 'From:'}</strong> {type === 'given' ? review.reviewed?.username || review.reviewed?.email : review.reviewer?.username || review.reviewer?.email}
          </div>
        </div>
      ))}
    </div>
  );
};

// Edit Job Form Component
const EditJobForm = ({ job, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: job.title || '',
    description: job.description || '',
    location: job.location || '',
    budget: job.budget || '',
    timeline: job.timeline || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...job,
      ...formData
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="edit-job-form">
      <div className="form-group">
        <label>Job Title:</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="form-control"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Description:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-control"
          rows="4"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Location:</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="form-control"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Budget (R):</label>
        <input
          type="number"
          name="budget"
          value={formData.budget}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter budget amount"
        />
      </div>
      
      <div className="form-group">
        <label>Timeline:</label>
        <input
          type="text"
          name="timeline"
          value={formData.timeline}
          onChange={handleChange}
          className="form-control"
          placeholder="e.g., ASAP, Next week, etc."
        />
      </div>
      
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Update Job
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default UserDashboard;
