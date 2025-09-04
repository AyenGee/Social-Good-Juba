import React, { useState } from 'react';
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

  if (!currentUser) {
    return (
      <div className="form-container">
        <div className="form">
          <h2>Access Denied</h2>
          <p>You must be logged in to post jobs.</p>
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
