import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/PopularJobs.css';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Connect with Top Freelancers
            <span className="text-gradient"> in South Africa</span>
          </h1>
          <p className="hero-subtitle">
            Find the perfect freelancer for your project or showcase your skills to clients worldwide. 
            Join our growing community of professionals and businesses.
          </p>
          <div className="hero-actions">
            {!currentUser ? (
              <>
                <Link to="/login" className="btn btn-primary btn-xl">
                  Get Started Today
                </Link>
                <Link to="/learn" className="btn btn-outline btn-xl">
                  Learn How It Works
                </Link>
                <Link to="/jobs" className="btn btn-secondary btn-xl">
                  Browse Jobs
                </Link>
                <Link to="/plans" className="btn btn-tertiary btn-xl">
                  View Plans
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-xl">
                  Go to Dashboard
                </Link>
                <Link to="/learn" className="btn btn-outline btn-xl">
                  Learn & Grow
                </Link>
                <Link to="/post-job" className="btn btn-secondary btn-xl">
                  Post a Job
                </Link>
                <Link to="/plans" className="btn btn-tertiary btn-xl">
                  View Plans
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Juba Platform?</h2>
            <p className="section-description">
              We provide everything you need to succeed in the freelance marketplace
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="feature-title">Easy Job Posting</h3>
              <p className="feature-description">
                Post your project requirements in minutes with our streamlined job creation process.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="feature-title">Quality Freelancers</h3>
              <p className="feature-description">
                Access a curated pool of verified professionals with proven track records.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="feature-title">Secure Payments</h3>
              <p className="feature-description">
                Safe and secure payment processing with escrow protection for both parties.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3 className="feature-title">Fast Delivery</h3>
              <p className="feature-description">
                Quick turnaround times with clear deadlines and milestone tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Jobs Section */}
      <section className="popular-jobs-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Jobs</h2>
            <p className="section-description">
              High-demand opportunities for skilled professionals
            </p>
          </div>
          
          <div className="popular-jobs-grid">
            <div className="job-card">
              <div className="job-icon">🔧</div>
              <h3 className="job-title">Plumbing Services</h3>
              <p className="job-description">Installation, repairs, and maintenance of water systems</p>
              <p className="job-demand">High Demand</p>
            </div>
            
            <div className="job-card">
              <div className="job-icon">🪚</div>
              <h3 className="job-title">Carpentry & Woodwork</h3>
              <p className="job-description">Custom furniture, repairs, and construction work</p>
              <p className="job-demand">High Demand</p>
            </div>
            
            <div className="job-card">
              <div className="job-icon">🚗</div>
              <h3 className="job-title">Car Detailing</h3>
              <p className="job-description">Professional cleaning and maintenance services</p>
              <p className="job-demand">Growing Market</p>
            </div>
            
            <div className="job-card">
              <div className="job-icon">🏠</div>
              <h3 className="job-title">House Painting</h3>
              <p className="job-description">Interior and exterior painting services</p>
              <p className="job-demand">Steady Demand</p>
            </div>
            
            <div className="job-card">
              <div className="job-icon">⚡</div>
              <h3 className="job-title">Electrical Work</h3>
              <p className="job-description">Wiring, installations, and electrical repairs</p>
              <p className="job-demand">High Demand</p>
            </div>
            
            <div className="job-card">
              <div className="job-icon">🌿</div>
              <h3 className="job-title">Gardening & Landscaping</h3>
              <p className="job-description">Garden design, maintenance, and landscaping</p>
              <p className="job-demand">Seasonal Demand</p>
            </div>
            
            <div className="job-card">
              <div className="job-icon">🧹</div>
              <h3 className="job-title">Cleaning Services</h3>
              <p className="job-description">House cleaning, office cleaning, and maintenance</p>
              <p className="job-demand">Consistent Demand</p>
            </div>
            
            <div className="job-card">
              <div className="job-icon">📱</div>
              <h3 className="job-title">Phone Repairs</h3>
              <p className="job-description">Mobile device repairs and maintenance</p>
              <p className="job-demand">Growing Market</p>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-description">
              Join thousands of freelancers and clients who are already using Juba Platform
            </p>
            <div className="cta-actions">
              {!currentUser ? (
                <>
                  <Link to="/login" className="btn btn-primary btn-xl">
                    Sign Up Now
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-xl">
                    Learn More
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="btn btn-primary btn-xl">
                    Go to Dashboard
                  </Link>
                  <Link to="/jobs" className="btn btn-outline btn-xl">
                    Browse Jobs
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
