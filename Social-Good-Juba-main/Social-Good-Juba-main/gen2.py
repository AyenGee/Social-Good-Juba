import os
import json

def create_file(path, content):
    # Get the directory part of the path
    directory = os.path.dirname(path)
    # Only create directories if there is a directory path
    if directory:
        os.makedirs(directory, exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)

def generate_juba_codebase():
    # AuthContext.js
    auth_context = """import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('juba_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user profile
      axios.get('/api/users/profile')
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(error => {
          console.error('Auth check failed:', error);
          localStorage.removeItem('juba_token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, user) => {
    localStorage.setItem('juba_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('juba_token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
"""
    create_file("client/src/context/AuthContext.js", auth_context)
    
    # Header component
    header_component = """import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">Juba</Link>
        <nav className="nav">
          {currentUser ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              {currentUser.role === 'client' && (
                <Link to="/post-job" className="nav-link">Post Job</Link>
              )}
              {currentUser.role === 'client' && !currentUser.freelancer_profile && (
                <Link to="/become-freelancer" className="nav-link">Become a Freelancer</Link>
              )}
              {currentUser.admin_status && (
                <Link to="/admin" className="nav-link">Admin</Link>
              )}
              <span className="nav-link">Welcome, {currentUser.email}</span>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
"""
    create_file("client/src/components/Header.js", header_component)
    
    # Home page
    home_page = """import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home">
      <div className="hero-section">
        <h1>Welcome to Juba</h1>
        <p>Find trusted professionals for all your odd jobs</p>
        {!currentUser ? (
          <div>
            <Link to="/login" className="btn btn-primary">Get Started</Link>
          </div>
        ) : (
          <div>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>How Juba Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>1. Post a Job</h3>
            <p>Describe the work you need done and set your budget</p>
          </div>
          <div className="feature-card">
            <h3>2. Get Offers</h3>
            <p>Freelancers will send you quotes for your job</p>
          </div>
          <div className="feature-card">
            <h3>3. Choose a Freelancer</h3>
            <p>Review profiles and select the best fit for your job</p>
          </div>
          <div className="feature-card">
            <h3>4. Get it Done</h3>
            <p>Complete the job and make secure payment</p>
          </div>
        </div>
      </div>

      <div className="categories-section">
        <h2>Popular Categories</h2>
        <div className="categories-grid">
          <div className="category-card">Plumbing</div>
          <div className="category-card">Electrical</div>
          <div className="category-card">Painting</div>
          <div className="category-card">Cleaning</div>
          <div className="category-card">Gardening</div>
          <div className="category-card">Moving Help</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
"""
    create_file("client/src/pages/Home.js", home_page)
    
    # Login page
    login_page = """import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/users/auth/google', {
        token: credentialResponse.credential,
        phone: formData.phone,
        address: formData.address
      });

      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="form-container">
      <div className="form">
        <h2>Login to Juba</h2>
        {error && <div className="form-error">{error}</div>}
        
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            name="phone"
            className="form-input"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Enter your phone number"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea
            name="address"
            className="form-textarea"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter your residential address"
            required
          />
        </div>

        <div className="form-group">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="rectangular"
            size="large"
            text="signin_with"
            disabled={!formData.phone || !formData.address || loading}
          />
        </div>

        {loading && <div className="spinner"></div>}
      </div>
    </div>
  );
};

export default Login;
"""
    create_file("client/src/pages/Login.js", login_page)
    
    # Dashboard page
    dashboard_page = """import React, { useState, useEffect } from 'react';
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
"""
    create_file("client/src/pages/Dashboard.js", dashboard_page)
    
    # JobPost page
    jobpost_page = """import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const JobPost = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    timeline: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/jobs', formData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.role !== 'client') {
    return (
      <div className="form-container">
        <div className="form">
          <h2>Access Denied</h2>
          <p>Only clients can post jobs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form">
        <h2>Post a New Job</h2>
        {error && <div className="form-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Need a plumber to fix leaky faucet"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Description</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the job in detail..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              name="location"
              className="form-input"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Where does the job need to be done?"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Timeline</label>
            <input
              type="text"
              name="timeline"
              className="form-input"
              value={formData.timeline}
              onChange={handleInputChange}
              placeholder="e.g., Within 2 days, Next week, etc."
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobPost;
"""
    create_file("client/src/pages/JobPost.js", jobpost_page)
    
    # JobDetails page
    jobdetails_page = """import React, { useState, useEffect } from 'react';
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
"""
    create_file("client/src/pages/JobDetails.js", jobdetails_page)
    
    # FreelancerApplication page
    freelancer_application_page = """import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FreelancerApplication = () => {
  const [formData, setFormData] = useState({
    bio: '',
    experience_years: '',
    service_areas: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    certifications: '',
    coverage_areas: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert comma-separated strings to arrays
      const applicationData = {
        ...formData,
        service_areas: formData.service_areas.split(',').map(s => s.trim()),
        certifications: formData.certifications.split(',').map(s => s.trim()),
        coverage_areas: formData.coverage_areas.split(',').map(s => s.trim()),
        experience_years: parseInt(formData.experience_years),
        hourly_rate_min: parseFloat(formData.hourly_rate_min),
        hourly_rate_max: parseFloat(formData.hourly_rate_max)
      };

      await axios.post('/api/users/become-freelancer', applicationData);
      alert('Application submitted successfully! It will be reviewed by our team.');
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.role === 'freelancer') {
    return (
      <div className="form-container">
        <div className="form">
          <h2>Already a Freelancer</h2>
          <p>You are already registered as a freelancer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form">
        <h2>Become a Juba Freelancer</h2>
        {error && <div className="form-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Professional Bio</label>
            <textarea
              name="bio"
              className="form-textarea"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about your skills and experience..."
              required
              rows="4"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input
              type="number"
              name="experience_years"
              className="form-input"
              value={formData.experience_years}
              onChange={handleInputChange}
              placeholder="e.g., 5"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Service Areas (comma-separated)</label>
            <input
              type="text"
              name="service_areas"
              className="form-input"
              value={formData.service_areas}
              onChange={handleInputChange}
              placeholder="e.g., Plumbing, Electrical, Painting"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hourly Rate Range</label>
            <div className="rate-range">
              <input
                type="number"
                name="hourly_rate_min"
                className="form-input"
                value={formData.hourly_rate_min}
                onChange={handleInputChange}
                placeholder="Min"
                required
              />
              <span>to</span>
              <input
                type="number"
                name="hourly_rate_max"
                className="form-input"
                value={formData.hourly_rate_max}
                onChange={handleInputChange}
                placeholder="Max"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Certifications (comma-separated)</label>
            <input
              type="text"
              name="certifications"
              className="form-input"
              value={formData.certifications}
              onChange={handleInputChange}
              placeholder="e.g., Certified Electrician, Plumbing License"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Coverage Areas (comma-separated)</label>
            <input
              type="text"
              name="coverage_areas"
              className="form-input"
              value={formData.coverage_areas}
              onChange={handleInputChange}
              placeholder="e.g., Johannesburg, Pretoria, Sandton"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FreelancerApplication;
"""
    create_file("client/src/pages/FreelancerApplication.js", freelancer_application_page)
    
    # AdminDashboard page
    admin_dashboard_page = """import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.admin_status) {
      fetchAdminData();
    }
  }, [currentUser]);

  const fetchAdminData = async () => {
    try {
      const [usersRes, jobsRes] = await Promise.all([
        axios.get('/api/users/admin/users'),
        axios.get('/api/jobs/admin/jobs')
      ]);
      
      setUsers(usersRes.data);
      setJobs(jobsRes.data.jobs);
      
      // Calculate basic stats
      setStats({
        totalUsers: usersRes.data.length,
        totalJobs: jobsRes.data.jobs.length,
        activeJobs: jobsRes.data.jobs.filter(job => job.status === 'posted').length,
        pendingApplications: usersRes.data.filter(user => 
          user.role === 'freelancer' && user.freelancer_profile?.approval_status === 'pending'
        ).length
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser?.admin_status) {
    return (
      <div className="form-container">
        <div className="form">
          <h2>Access Denied</h2>
          <p>Admin access required.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalJobs}</div>
          <div className="stat-label">Total Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.activeJobs}</div>
          <div className="stat-label">Active Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pendingApplications}</div>
          <div className="stat-label">Pending Applications</div>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-section">
          <h2>Users</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {user.role === 'freelancer' && user.freelancer_profile ? (
                        <span className={`status-badge status-${user.freelancer_profile.approval_status}`}>
                          {user.freelancer_profile.approval_status}
                        </span>
                      ) : (
                        <span className="status-badge status-approved">Active</span>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h2>Recent Jobs</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 10).map(job => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.client?.email}</td>
                    <td>
                      <span className={`status-badge status-${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{new Date(job.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
"""
    create_file("client/src/pages/AdminDashboard.js", admin_dashboard_page)
if __name__ == "__main__":
    generate_juba_codebase()