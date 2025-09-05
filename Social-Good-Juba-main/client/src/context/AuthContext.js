import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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
      axios.get('/api/profile')
        .then(response => {
          // Normalize shape: backend returns { user, freelancer_profile }
          const data = response.data;
          const normalizedUser = data?.user || data || null;
          setCurrentUser(normalizedUser);
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
    // Normalize potential shapes
    const normalizedUser = user?.user || user || null;
    setCurrentUser(normalizedUser);
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
