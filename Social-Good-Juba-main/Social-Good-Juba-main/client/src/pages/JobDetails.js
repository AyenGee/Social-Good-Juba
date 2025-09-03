import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applicationData, setApplicationData] = useState({
    proposed_rate: ''
  });
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
      fetchJobDetails(); // Refresh job details
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to apply');
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (error) return <div className="error">{error}</div>;
  if (!job) return <div>Job not found</div>;

  const hasApplied = job.applications?.some(app => app.freelancer_id === currentUser?.id);
  const isJobOwner = job.client_id === currentUser?.id;

  return (
    <div className="job-details">
      <div className="job-header">
        <h1>{job.title}</h1>
        <span className={`status-badge status-${job.status}`}>{job.status}</span>
      </div>

      <div className="job-content">
        <div className="job-section">
          <h3>Description</h3>
          <p>{job.description}</p>
        </div>

        <div className="job-section">
          <h3>Details</h3>
          <div className="job-meta">
            <div><strong>Location:</strong> {job.location}</div>
            <div><strong>Timeline:</strong> {job.timeline || 'Not specified'}</div>
            <div><strong>Posted:</strong> {new Date(job.created_at).toLocaleDateString()}</div>
            <div><strong>Status:</strong> {job.status}</div>
          </div>
        </div>

        {currentUser?.role === 'freelancer' && job.status === 'posted' && !hasApplied && (
          <div className="job-section">
            <h3>Apply for this Job</h3>
            <form onSubmit={handleApply} className="form">
              <div className="form-group">
                <label className="form-label">Your Proposed Rate (R)</label>
                <input
                  type="number"
                  className="form-input"
                  value={applicationData.proposed_rate}
                  onChange={(e) => setApplicationData({ proposed_rate: e.target.value })}
                  placeholder="Enter your rate"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Submit Application</button>
            </form>
          </div>
        )}

        {hasApplied && (
          <div className="job-section">
            <div className="alert alert-success">You have already applied to this job</div>
          </div>
        )}

        {isJobOwner && job.applications && job.applications.length > 0 && (
          <div className="job-section">
            <h3>Applications ({job.applications.length})</h3>
            <div className="applications-list">
              {job.applications.map(application => (
                <div key={application.id} className="application-card">
                  <h4>{application.freelancer?.email}</h4>
                  <p><strong>Proposed Rate:</strong> R{application.proposed_rate}</p>
                  <p><strong>Status:</strong> {application.status}</p>
                  {application.status === 'pending' && (
                    <button className="btn btn-success">Select Freelancer</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
