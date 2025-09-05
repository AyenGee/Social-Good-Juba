import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import JobPost from './pages/JobPost';
import AdminDashboard from './pages/AdminDashboard';
import TestDatabase from './pages/TestDatabase';
import JobSearch from './pages/JobSearch';
import JobDetails from './pages/JobDetails';
import Plans from './pages/Plans';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import FreelancerApplication from './pages/FreelancerApplication';
// Import context
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';

// Import components
import Header from './components/Header';

// Import styles
import './App.css';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <Router>
              <div className="App">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/post-job" element={<JobPost />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/test-db" element={<TestDatabase />} />
                    <Route path="/jobs" element={<JobSearch />} />
                    <Route path="/job/:id" element={<JobDetails />} />
                    <Route path="/plans" element={<Plans />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/become-freelancer" element={<FreelancerApplication />} />
                  </Routes>
                </main>
              </div>
            </Router>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
