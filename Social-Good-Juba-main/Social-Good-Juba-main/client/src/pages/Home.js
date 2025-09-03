import React from 'react';
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
