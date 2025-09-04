import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChatButton from '../components/ChatButton';
import './JobDetails.css';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
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
      const [jobResponse, applicationsResponse] = await Promise.all([
        axios.get(`/api/jobs/${id}`),
        axios.get(`/api/jobs/${id}/applications`)
      ]);
      setJob(jobResponse.data);
      setApplications(applicationsResponse.data);
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
      fetchJobDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to apply');
    }
  };

  const handleApplicationAction = async (applicationId, action) => {
    try {
      await axios.post(`/api/jobs/${id}/applications/${applicationId}/${action}`);
      alert(`Application ${action}ed successfully!`);
      fetchJobDetails(); // Refresh to show updated status
    } catch (error) {
      setError(error.response?.data?.error || `Failed to ${action} application`);
    }
  };

  const handleCompleteJob = async () => {
    if (window.confirm('Are you sure you want to mark this job as complete? This action cannot be undone.')) {
    try {
      await axios.post(`/api/jobs/${id}/complete`);
        alert('Job marked as complete successfully!');
        fetchJobDetails(); // Refresh to show updated status
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to complete job');
    }
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
    <div className="job-details-simple">
      {/* Breadcrumb */}
      <nav className="breadcrumb-nav">
        <Link to="/dashboard" className="breadcrumb-link">
          <span className="breadcrumb-icon">🏠</span>
          Dashboard
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Job Details</span>
      </nav>

      {/* Main Job Card */}
      <div className="job-card">
        {/* Job Header */}
      <div className="job-header">
          <h1 className="job-title">{job.title}</h1>
          <div className="job-status">
            <span className={`status-badge ${statusConfig.className}`}>
              <span className="status-icon">{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Job Info */}
        <div className="job-info">
          <div className="info-item">
            <span className="info-label">📍 Location:</span>
            <span className="info-value">{job.location}</span>
          </div>
          <div className="info-item">
            <span className="info-label">📅 Posted:</span>
            <span className="info-value">{new Date(job.created_at).toLocaleDateString()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">⏱️ Timeline:</span>
            <span className="info-value">{job.timeline || 'Not specified'}</span>
          </div>
      </div>

        {/* Job Description */}
        <div className="job-description-section">
          <h3>Description</h3>
          <p>{job.description}</p>
        </div>

        {/* Applications Section - Only visible to job owners (clients) */}
        {applications.length > 0 && isJobOwner && (
          <div className="applications-section">
            <h3>Freelancers Who Applied ({applications.length})</h3>
            <div className="applications-list">
              {applications.map((application) => (
                <div key={application.id} className="application-card">
                  <div className="application-header">
                    <div className="freelancer-info">
                      <div className="freelancer-avatar">
                        {application.freelancer?.username?.charAt(0).toUpperCase() || 'F'}
                      </div>
                      <div className="freelancer-details">
                        <h4 className="freelancer-name">
                          {application.freelancer?.username || 'Anonymous Freelancer'}
                        </h4>
                        <p className="application-date">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="application-rate">
                      <span className="rate-label">Proposed Rate:</span>
                      <span className="rate-value">R{application.proposed_rate}</span>
                    </div>
                  </div>
                  {application.message && (
                    <div className="application-message">
                      <p>{application.message}</p>
                    </div>
                  )}
                  <div className="application-status">
                    <span className={`status-badge ${application.status === 'accepted' ? 'status-accepted' : application.status === 'rejected' ? 'status-rejected' : 'status-pending'}`}>
                      {application.status === 'accepted' ? '✅ Accepted' : 
                       application.status === 'rejected' ? '❌ Rejected' : 
                       '⏳ Pending'}
                    </span>
                  </div>

                  {/* Client Action Buttons */}
                  {isJobOwner && job.status === 'posted' && application.status === 'pending' && (
                    <div className="application-actions">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleApplicationAction(application.id, 'approve')}
                      >
                        <span className="btn-icon">✅</span>
                        Approve
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleApplicationAction(application.id, 'reject')}
                      >
                        <span className="btn-icon">❌</span>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="job-actions">
          {/* Chat Button */}
          {currentUser && (
            <ChatButton
              clientId={job.client_id}
              freelancerId={currentUser.id}
              jobId={job.id}
              jobTitle={job.title}
              variant="primary"
              className="chat-btn"
            >
              <span className="btn-icon">💬</span>
              Chat about this Job
            </ChatButton>
          )}

          {/* Apply Button (for freelancers) */}
          {currentUser && !isJobOwner && job.status === 'posted' && !hasApplied && (
            <button 
              className="btn btn-outline"
              onClick={() => setShowApplicationForm(true)}
            >
              <span className="btn-icon">📋</span>
              Apply Now
            </button>
          )}

          {/* Complete Job Button (for job owners) */}
          {currentUser && isJobOwner && job.status === 'in_progress' && (
            <button 
              className="btn btn-success"
              onClick={handleCompleteJob}
            >
              <span className="btn-icon">✅</span>
              Mark as Complete
            </button>
          )}

          {/* Back to Dashboard */}
          <Link to="/dashboard" className="btn btn-outline">
            <span className="btn-icon">←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* Application Form */}
        {showApplicationForm && (
          <div className="application-form-section">
            <h3>Apply for this Job</h3>
            <form onSubmit={handleApply} className="application-form">
              <div className="form-group">
                <label>Your Proposed Rate (R)</label>
                <input
                  type="number"
                  className="form-input"
                  value={applicationData.proposed_rate}
                  onChange={(e) => setApplicationData({ proposed_rate: e.target.value })}
                  placeholder="Enter your rate"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
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
          </div>
        )}

        {/* Already Applied Message */}
        {hasApplied && (
          <div className="applied-message">
            <span className="applied-icon">✅</span>
            <p>You have already applied to this job.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
