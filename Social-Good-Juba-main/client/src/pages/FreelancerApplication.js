import React, { useState } from 'react';
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

  if (!currentUser) {
    return (
      <div className="form-container">
        <div className="form">
          <h2>Access Denied</h2>
          <p>You must be logged in to create a freelancer profile.</p>
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
