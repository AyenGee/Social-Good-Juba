import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/jobs');
      setJobs(response.data.jobs || []);
    } catch (error) {
      setError('Failed to fetch jobs');
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesLocation = filterLocation === 'all' || 
      job.location.toLowerCase().includes(filterLocation.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const uniqueLocations = [...new Set(jobs.map(job => job.location))].filter(Boolean);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading available jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Error Loading Jobs</h2>
        <p>{error}</p>
        <button onClick={fetchJobs} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div className="job-search-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>Browse Available Jobs</h1>
          <p>Find the perfect job opportunity from our verified clients</p>
        </div>

        {/* Search and Filter Section */}
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
              <option value="all">All Statuses</option>
              <option value="posted">Posted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="filter-box">
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>Showing {filteredJobs.length} of {jobs.length} jobs</p>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No jobs found</h3>
            <p>Try adjusting your search criteria or check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <h3 className="job-title">{job.title}</h3>
                  <span className={`status-badge status-${job.status}`}>
                    {job.status}
                  </span>
                </div>
                
                <p className="job-description">
                  {job.description.length > 150 
                    ? `${job.description.substring(0, 150)}...` 
                    : job.description
                  }
                </p>
                
                <div className="job-meta">
                  <span className="meta-item">
                    <span className="meta-icon">📍</span>
                    {job.location}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">⏰</span>
                    {job.timeline || 'Not specified'}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">📅</span>
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="job-actions">
                  <Link to={`/job/${job.id}`} className="btn btn-primary">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="cta-section">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Sign up to apply for jobs and start earning</p>
            <div className="cta-actions">
              <Link to="/login" className="btn btn-primary btn-lg">
                Sign Up Now
              </Link>
              <Link to="/become-freelancer" className="btn btn-outline btn-lg">
                Become a Freelancer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
