import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Import components
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobPost from './pages/JobPost';
import JobDetails from './pages/JobDetails';
import FreelancerApplication from './pages/FreelancerApplication';
import AdminDashboard from './pages/AdminDashboard';

// Import context
import { AuthProvider } from './context/AuthContext';

// Import styles
import './App.css';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/post-job" element={<JobPost />} />
                <Route path="/job/:id" element={<JobDetails />} />
                <Route path="/become-freelancer" element={<FreelancerApplication />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
