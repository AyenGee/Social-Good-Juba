import React from 'react';
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
