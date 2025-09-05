import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChatButton from '../components/ChatButton';
import ReportButton from '../components/ReportButton';
import RatingDisplay from '../components/RatingDisplay';
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
    console.log('JobDetails component mounted with ID:', id);
    if (id) {
      fetchJobDetails();
    } else {
      console.error('No job ID provided');
      setError('No job ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      console.log('Fetching job details for ID:', id);
      const [jobResponse, applicationsResponse] = await Promise.all([
        axios.get(`/api/jobs/${id}`),
        axios.get(`/api/jobs/${id}/applications`)
      ]);
      console.log('Job response:', jobResponse.data);
      console.log('Applications response:', applicationsResponse.data);
      setJob(jobResponse.data);
      setApplications(applicationsResponse.data);
    } catch (error) {
      console.error('Job details fetch error:', error);
      setError('Failed to fetch job details: ' + (error.response?.data?.error || error.message));
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
      in_progress: { label: 'In Progress - Freelancer Working', className: 'status-progress', icon: '⚡' },
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

  // Helper function removed - using direct access to profile data

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
          <div className="info-item">
            <span className="info-label">📊 Job Status:</span>
            <span className="info-value" style={{fontWeight: 'bold', color: job.status === 'in_progress' ? '#28a745' : '#6c757d'}}>
              {job.status} {job.status === 'in_progress' ? '✅' : '❌'}
            </span>
          </div>
          
          {/* Client Rating Display - Show for freelancers viewing job details */}
          {!isJobOwner && job.client_id && (
            <div className="info-item client-rating-item">
              <span className="info-label">👤 Client Rating:</span>
              <div className="info-value">
                <RatingDisplay userId={job.client_id} className="client-rating" />
              </div>
            </div>
          )}
      </div>

        {/* Job Description */}
        <div className="job-description-section">
          <h3>Description</h3>
          <p>{job.description}</p>
        </div>

        {/* Accepted Freelancer Section - Show when job is in progress */}
        {job.status === 'in_progress' && applications.length > 0 && (
          <div className="accepted-freelancer-section">
            <h3>👷 Freelancer Working on This Job</h3>
            {applications
              .filter(app => app.status === 'accepted')
              .map((application) => (
                <div key={application.id} className="accepted-freelancer-card">
                  <div className="freelancer-info">
                    <div className="freelancer-avatar-large">
                      {application.freelancer?.username?.charAt(0).toUpperCase() || 'F'}
                    </div>
                    <div className="freelancer-details">
                      <h4 className="freelancer-name">
                        {application.freelancer?.username || 'Anonymous Freelancer'}
                      </h4>
                      <p className="freelancer-rate">
                        <span className="rate-label">Agreed Rate:</span>
                        <span className="rate-value">R{application.proposed_rate}</span>
                      </p>
                      {/* Freelancer Rating Display for Accepted Freelancer */}
                      <div className="freelancer-rating">
                        <RatingDisplay userId={application.freelancer_id} className="accepted-freelancer-rating" />
                      </div>
                      <p className="freelancer-status">
                        <span className="status-badge status-accepted">✅ Accepted & Working</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

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
                        {/* Freelancer Rating Display */}
                        <div className="freelancer-rating">
                          <RatingDisplay userId={application.freelancer_id} className="application-rating" />
                        </div>
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
                  {/* Freelancer profile extras for job owner */}
                  {isJobOwner && (
                    <div className="freelancer-extra">
                      {/* Debug info - remove this later */}
                      {console.log('Application data:', application)}
                      {console.log('Freelancer profile:', application.freelancer?.profile)}
                      <div className="extra-row"><strong>Experience:</strong> {application.freelancer?.profile?.experience_years ?? 'N/A'} years</div>
                      <div className="extra-row"><strong>Services:</strong> {(application.freelancer?.profile?.service_areas || []).join(', ') || 'N/A'}</div>
                      <div className="extra-row"><strong>Languages:</strong> {(application.freelancer?.profile?.languages_spoken || []).join(', ') || 'N/A'}</div>
                      {application.freelancer?.profile?.bio && (
                        <div className="extra-row"><strong>Bio:</strong> {application.freelancer.profile.bio}</div>
                      )}
                      {application.freelancer?.profile?.transportation_available && (
                        <div className="extra-row"><strong>Transportation:</strong> ✅ Available</div>
                      )}
                      {application.freelancer?.profile?.insurance_coverage && (
                        <div className="extra-row"><strong>Insurance:</strong> ✅ Covered</div>
                      )}
                      {application.freelancer?.profile?.certifications && application.freelancer.profile.certifications.length > 0 && (
                        <div className="extra-row"><strong>Certifications:</strong> {application.freelancer.profile.certifications.join(', ')}</div>
                      )}
                      {application.freelancer?.profile?.documents?.cv && (
                        <div className="extra-row">
                          <strong>CV:</strong> <a href={application.freelancer.profile.documents.cv.url} target="_blank" rel="noopener noreferrer">View CV</a>
                        </div>
                      )}
                      {typeof application.freelancer?.ratingAvg === 'number' && (
                        <div className="extra-row"><strong>Rating:</strong> {application.freelancer.ratingAvg} ⭐ ({application.freelancer.ratingCount || 0})</div>
                      )}
                      {application.freelancer?.verification_status && (
                        <div className="extra-row"><strong>Status:</strong> ✅ Verified</div>
                      )}
                      <div className="extra-row actions-row">
                        <ChatButton
                          clientId={job.client_id}
                          freelancerId={application.freelancer?.id}
                          jobId={job.id}
                          jobTitle={job.title}
                          variant="secondary"
                        >
                          💬 Message Applicant
                        </ChatButton>
                        <ReportButton
                          userId={application.freelancer_id}
                          jobId={id}
                          userType="freelancer"
                        />
                      </div>
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

          {/* Debug: Why Complete Button Not Showing */}
          <div style={{background: '#fff3cd', padding: '10px', margin: '10px 0', border: '1px solid #ffeaa7', borderRadius: '5px'}}>
            <strong>🔍 Complete Button Debug:</strong><br/>
            Current User: {currentUser?.id ? '✅ Logged in' : '❌ Not logged in'}<br/>
            Is Job Owner: {isJobOwner ? '✅ Yes' : '❌ No'}<br/>
            Job Status: {job.status} {job.status === 'in_progress' ? '✅' : '❌'}<br/>
            Should Show Button: {currentUser && isJobOwner && job.status === 'in_progress' ? '✅ YES' : '❌ NO'}<br/>
            {isJobOwner && job.status !== 'in_progress' && (
              <button 
                onClick={async () => {
                  try {
                    await axios.patch(`/api/jobs/${id}`, { status: 'in_progress' });
                    alert('Job status updated to in_progress!');
                    fetchJobDetails();
                  } catch (error) {
                    alert('Failed to update job status: ' + error.message);
                  }
                }}
                style={{background: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginTop: '5px'}}
              >
                🔧 Force Set to In Progress (TEST)
              </button>
            )}
          </div>

          {/* Complete Job Button (for job owners) */}
          {currentUser && isJobOwner && job.status === 'in_progress' && (
            <div className="complete-job-section">
              <div className="complete-job-notice">
                <span className="notice-icon">🎉</span>
                <p>Great! You have a freelancer working on this job. When the work is finished, mark it as complete.</p>
              </div>
              <button 
                className="btn btn-success btn-complete"
                onClick={handleCompleteJob}
              >
                <span className="btn-icon">✅</span>
                Mark Job as Complete
              </button>
            </div>
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
