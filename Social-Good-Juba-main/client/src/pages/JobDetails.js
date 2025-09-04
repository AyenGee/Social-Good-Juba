import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './JobDetails.css';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applicationData, setApplicationData] = useState({
    proposed_rate: ''
  });
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`/api/jobs/${id}`);
      setJob(response.data);
    } catch (error) {
      setError('Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/jobs/${id}/apply`, applicationData);
      alert('Application submitted successfully!');
      setShowApplicationForm(false);
      fetchJobDetails(); // Refresh job details
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to apply');
    }
  };

  const handleSelectFreelancer = async (freelancerId) => {
    try {
      await axios.post(`/api/jobs/${id}/select-freelancer/${freelancerId}`);
      alert('Freelancer selected successfully!');
      fetchJobDetails(); // Refresh job details
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to select freelancer');
    }
  };

  const handleCompleteJob = async () => {
    try {
      await axios.post(`/api/jobs/${id}/complete`);
      alert('Job marked as complete!');
      fetchJobDetails(); // Refresh job details
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to complete job');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      posted: { label: 'Open for Applications', className: 'status-open', icon: '📋' },
      in_progress: { label: 'In Progress', className: 'status-progress', icon: '⚡' },
      completed: { label: 'Completed', className: 'status-completed', icon: '✅' },
      cancelled: { label: 'Cancelled', className: 'status-cancelled', icon: '❌' },
      pending: { label: 'Pending Review', className: 'status-pending', icon: '⏳' }
    };
    return configs[status] || { label: status, className: 'status-default', icon: '📝' };
  };

  if (loading) {
    return (
      <div className="job-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-details-error">
        <div className="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-details-not-found">
        <div className="not-found-icon">🔍</div>
        <h2>Job Not Found</h2>
        <p>The job you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const hasApplied = job.applications?.some(app => app.freelancer_id === currentUser?.id);
  const isJobOwner = job.client_id === currentUser?.id;
  const statusConfig = getStatusConfig(job.status);

  return (
    <div className="job-details-container">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-nav">
        <Link to="/dashboard" className="breadcrumb-link">
          <span className="breadcrumb-icon">🏠</span>
          Dashboard
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Job Details</span>
      </nav>

      {/* Main Job Header */}
      <div className="job-header-section">
        <div className="job-header-content">
          <div className="job-title-section">
            <h1 className="job-title">{job.title}</h1>
            <div className="job-status-wrapper">
              <span className={`job-status-badge ${statusConfig.className}`}>
                <span className="status-icon">{statusConfig.icon}</span>
                {statusConfig.label}
              </span>
            </div>
          </div>
          
          <div className="job-meta-grid">
            <div className="meta-item">
              <span className="meta-icon">📍</span>
              <div className="meta-content">
                <span className="meta-label">Location</span>
                <span className="meta-value">{job.location}</span>
              </div>
            </div>
            
            <div className="meta-item">
              <span className="meta-icon">💰</span>
              <div className="meta-content">
                <span className="meta-label">Budget</span>
                <span className="meta-value">R{job.budget || 'Negotiable'}</span>
              </div>
            </div>
            
            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <div className="meta-content">
                <span className="meta-label">Posted</span>
                <span className="meta-value">{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="meta-item">
              <span className="meta-icon">⏱️</span>
              <div className="meta-content">
                <span className="meta-label">Timeline</span>
                <span className="meta-value">{job.timeline || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Content Grid */}
      <div className="job-content-grid">
        {/* Main Content Column */}
        <div className="job-main-content">
          {/* Description Section */}
          <div className="content-card">
            <div className="card-header">
              <span className="card-icon">📝</span>
              <h2>Job Description</h2>
            </div>
            <div className="card-content">
              <p className="job-description">{job.description}</p>
            </div>
          </div>

          {/* Application Form Section */}
          {currentUser && job.status === 'posted' && !hasApplied && (
            <div className="content-card">
              <div className="card-header">
                <span className="card-icon">🚀</span>
                <h2>Apply for this Job</h2>
              </div>
              <div className="card-content">
                {!showApplicationForm ? (
                  <div className="apply-prompt">
                    <p>Interested in this job? Submit your application with your proposed rate.</p>
                    <button 
                      className="btn btn-primary btn-large"
                      onClick={() => setShowApplicationForm(true)}
                    >
                      <span className="btn-icon">📋</span>
                      Apply Now
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="application-form">
                    <div className="form-group">
                      <label className="form-label">Your Proposed Rate (R)</label>
                      <div className="input-wrapper">
                        <span className="input-prefix">R</span>
                        <input
                          type="number"
                          className="form-input"
                          value={applicationData.proposed_rate}
                          onChange={(e) => setApplicationData({ proposed_rate: e.target.value })}
                          placeholder="Enter your rate"
                          required
                        />
                      </div>
                      <small className="form-help">Enter your hourly rate or project rate</small>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        <span className="btn-icon">📤</span>
                        Submit Application
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        onClick={() => setShowApplicationForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Already Applied Section */}
          {hasApplied && (
            <div className="content-card">
              <div className="card-header">
                <span className="card-icon">✅</span>
                <h2>Application Status</h2>
              </div>
              <div className="card-content">
                <div className="success-message">
                  <div className="success-icon">🎉</div>
                  <div className="success-content">
                    <h3>Application Submitted!</h3>
                    <p>You have already applied to this job. We'll notify you when the client reviews your application.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Job Management Section (for job owners) */}
          {isJobOwner && job.status === 'in_progress' && (
            <div className="content-card">
              <div className="card-header">
                <span className="card-icon">⚙️</span>
                <h2>Job Management</h2>
              </div>
              <div className="card-content">
                <div className="management-actions">
                  <button 
                    className="btn btn-success btn-large"
                    onClick={handleCompleteJob}
                  >
                    <span className="btn-icon">✅</span>
                    Mark Job as Complete
                  </button>
                  <p className="action-help">Mark this job as complete when the work is finished</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="job-sidebar">
          {/* Quick Actions */}
          <div className="sidebar-card">
            <div className="card-header">
              <span className="card-icon">⚡</span>
              <h3>Quick Actions</h3>
            </div>
            <div className="card-content">
              <div className="quick-actions">
                <Link to="/dashboard" className="quick-action-btn">
                  <span className="action-icon">📊</span>
                  <span>View Dashboard</span>
                </Link>
                <Link to="/jobs" className="quick-action-btn">
                  <span className="action-icon">🔍</span>
                  <span>Browse More Jobs</span>
                </Link>
                {isJobOwner && (
                  <Link to="/post-job" className="quick-action-btn">
                    <span className="action-icon">📝</span>
                    <span>Post New Job</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Job Statistics */}
          <div className="sidebar-card">
            <div className="card-header">
              <span className="card-icon">📊</span>
              <h3>Job Statistics</h3>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">{job.applications?.length || 0}</span>
                  <span className="stat-label">Applications</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{job.status === 'posted' ? 'Active' : job.status}</span>
                  <span className="stat-label">Status</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Section (for job owners) */}
      {isJobOwner && job.applications && job.applications.length > 0 && (
        <div className="applications-section">
          <div className="section-header">
            <h2>Applications ({job.applications.length})</h2>
            <p>Review applications from freelancers</p>
          </div>
          
          <div className="applications-grid">
            {job.applications.map(application => (
              <div key={application.id} className="application-card">
                <div className="application-header">
                  <div className="applicant-info">
                    <div className="applicant-avatar">👤</div>
                    <div className="applicant-details">
                      <h4 className="applicant-name">{application.freelancer?.email || 'Unknown Freelancer'}</h4>
                      <span className="application-date">
                        Applied {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="application-status">
                    <span className={`status-badge status-${application.status}`}>
                      {application.status}
                    </span>
                  </div>
                </div>
                
                <div className="application-content">
                  <div className="rate-info">
                    <span className="rate-label">Proposed Rate:</span>
                    <span className="rate-amount">R{application.proposed_rate}</span>
                  </div>
                  
                  {application.message && (
                    <div className="application-message">
                      <span className="message-label">Message:</span>
                      <p>{application.message}</p>
                    </div>
                  )}
                </div>
                
                <div className="application-actions">
                  {application.status === 'pending' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => handleSelectFreelancer(application.freelancer_id)}
                    >
                      <span className="btn-icon">✅</span>
                      Select Freelancer
                    </button>
                  )}
                  <button className="btn btn-outline">
                    <span className="btn-icon">👁️</span>
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
