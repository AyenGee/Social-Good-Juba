import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserJobs();
  }, []);

  const fetchUserJobs = async () => {
    try {
      let endpoint = '/api/jobs';
      if (currentUser.role === 'freelancer') {
        endpoint += '?status=posted';
      }
      
      const response = await axios.get(endpoint);
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        {currentUser.role === 'client' && (
          <Link to="/post-job" className="btn btn-primary">Post New Job</Link>
        )}
      </div>

      <div className="dashboard-content">
        {currentUser.role === 'client' ? (
          <>
            <h2>Your Jobs</h2>
            {jobs.length === 0 ? (
              <div className="empty-state">
                <p>You haven't posted any jobs yet.</p>
                <Link to="/post-job" className="btn btn-primary">Post Your First Job</Link>
              </div>
            ) : (
              <div className="job-list">
                {jobs.map(job => (
                  <div key={job.id} className="job-item">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-description">{job.description}</p>
                    <div className="job-meta">
                      <span>Status: {job.status}</span>
                      <span>Location: {job.location}</span>
                      <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    <Link to={`/job/${job.id}`} className="btn btn-secondary">View Details</Link>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2>Available Jobs</h2>
            {jobs.length === 0 ? (
              <div className="empty-state">
                <p>No jobs available at the moment.</p>
              </div>
            ) : (
              <div className="job-list">
                {jobs.map(job => (
                  <div key={job.id} className="job-item">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-description">{job.description}</p>
                    <div className="job-meta">
                      <span>Location: {job.location}</span>
                      <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                      <span>Client: {job.client?.email}</span>
                    </div>
                    <Link to={`/job/${job.id}`} className="btn btn-primary">Apply Now</Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
