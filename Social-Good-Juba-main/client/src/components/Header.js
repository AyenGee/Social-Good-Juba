import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ChatWindow from './ChatWindow';
import NotificationBell from './NotificationBell';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          Juba Platform
        </Link>

        <div className="navbar-actions">
          {currentUser && (
            <>
              <NotificationBell />
              <button 
                className="chat-button" 
                onClick={() => setIsChatOpen(true)}
                title="Open Messages"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="chat-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>
            </>
          )}
          
          {currentUser ? (
            <div className="user-menu-container">
              <button className="user-menu-trigger" onClick={toggleDropdown}>
                <div className="user-avatar">
                  {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">
                  {currentUser.username || currentUser.email}
                </span>
                <svg className="chevron-down" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <div className="user-info">
                      <div className="user-avatar-large">
                        {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="user-email">{currentUser.username || currentUser.email}</div>
                        <div className="user-role">User</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="user-menu-items">
                    <Link to="/dashboard" className="user-menu-item" onClick={closeMenu}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Dashboard
                    </Link>
                    
                    <Link to="/notifications" className="user-menu-item" onClick={closeMenu}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17h8l-2.586-2.586a2 2 0 00-2.828 0L4.828 17z" />
                      </svg>
                      Notifications
                    </Link>
                    
                    {currentUser.isAdmin && (
                      <Link to="/admin" className="user-menu-item" onClick={closeMenu}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                    
                    <div className="user-menu-divider"></div>
                    
                    <button className="user-menu-item text-red-600" onClick={handleLogout}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">
                Sign In
              </Link>
              <Link to="/login" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}

          <button className="mobile-menu-button md:hidden" onClick={toggleMenu}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu open">
          <div className="mobile-menu-header">
            <span className="mobile-menu-title">Menu</span>
            <button className="mobile-menu-close" onClick={toggleMenu}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mobile-menu-items">
            {currentUser && (
              <>
                <Link to="/dashboard" className="mobile-menu-item" onClick={closeMenu}>
                  Dashboard
                </Link>
                <div className="mobile-menu-divider"></div>
                <div className="mobile-menu-user">
                  <div className="mobile-user-info">
                    <div className="mobile-user-avatar">
                      {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="mobile-user-email">{currentUser.username || currentUser.email}</div>
                      <div className="mobile-user-role">User</div>
                    </div>
                  </div>
                  <button className="mobile-logout-btn" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={toggleMenu} />
      )}

      {/* Chat Window */}
      <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </nav>
  );
};

export default Header;
