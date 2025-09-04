// client/src/pages/Login.js - Updated with better error handling
import React, { useState } from 'react';
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
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.token && response.data.user) {
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again or check your Google OAuth configuration.');
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