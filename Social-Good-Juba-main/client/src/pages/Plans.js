import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../components/Plans.css';

const Plans = () => {
  const { currentUser } = useAuth();

  return (
    <div className="plans-page">
      {/* Hero Section */}
      <section className="plans-hero">
        <div className="container">
          <div className="plans-hero-content">
            <h1 className="plans-hero-title">Choose Your Success Plan</h1>
            <p className="plans-hero-subtitle">
              Select the perfect plan to accelerate your freelance journey and unlock your full potential
            </p>
            <div className="plans-hero-actions">
              <Link to="/dashboard" className="btn btn-outline btn-lg">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="plans-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Plans We Offer</h2>
            <p className="section-description">
              Choose the perfect plan to accelerate your freelance success
            </p>
          </div>
          
          <div className="plans-grid">
            <div className="plan-card plan-free">
              <div className="plan-header">
                <h3 className="plan-name">Free Plan</h3>
                <div className="plan-price">
                  <span className="price-amount">R0</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="plan-description">Perfect for getting started</p>
              </div>
              
              <div className="plan-features">
                <div className="plan-feature">
                  <span className="feature-icon">✓</span>
                  <span>Access to job marketplace</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">✓</span>
                  <span>Basic profile creation</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">✓</span>
                  <span>Job application system</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">✓</span>
                  <span>Basic messaging</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">✓</span>
                  <span>Community support</span>
                </div>
              </div>
              
              <div className="plan-cta">
                <span className="current-plan-badge">Current Plan</span>
              </div>
            </div>

            <div className="plan-card plan-pro">
              <div className="plan-header">
                <div className="plan-badge">Most Popular</div>
                <h3 className="plan-name">Pro Plan</h3>
                <div className="plan-price">
                  <span className="price-amount">R30</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="plan-description">Priority access & skill matching</p>
              </div>
              
              <div className="plan-features">
                <div className="plan-feature">
                  <span className="feature-icon">✓</span>
                  <span>Everything in Free Plan</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">⚡</span>
                  <span>Priority job notifications</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">🎯</span>
                  <span>Skill-based job matching</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">📊</span>
                  <span>Advanced analytics dashboard</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">💼</span>
                  <span>Featured profile placement</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">🔒</span>
                  <span>Priority customer support</span>
                </div>
              </div>
              
              <div className="plan-cta">
                <Link to="/login" className="btn btn-primary btn-lg">
                  Upgrade to Pro
                </Link>
              </div>
            </div>

            <div className="plan-card plan-ultra">
              <div className="plan-header">
                <div className="plan-badge">Premium</div>
                <h3 className="plan-name">Ultra Plan</h3>
                <div className="plan-price">
                  <span className="price-amount">R60</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="plan-description">Maximum exposure & outreach</p>
              </div>
              
              <div className="plan-features">
                <div className="plan-feature">
                  <span className="feature-icon">✓</span>
                  <span>Everything in Pro Plan</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">🚀</span>
                  <span>Unlimited client outreach</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">⭐</span>
                  <span>Premium profile verification</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">📈</span>
                  <span>Advanced marketing tools</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">🎁</span>
                  <span>Exclusive job opportunities</span>
                </div>
                <div className="plan-feature">
                  <span className="feature-icon">👑</span>
                  <span>VIP customer support</span>
                </div>
              </div>
              
              <div className="plan-cta">
                <Link to="/login" className="btn btn-primary btn-lg">
                  Upgrade to Ultra
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="plans-faq">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-description">
              Everything you need to know about our plans
            </p>
          </div>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-question">Can I change my plan anytime?</h3>
              <p className="faq-answer">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div className="faq-item">
              <h3 className="faq-question">What payment methods do you accept?</h3>
              <p className="faq-answer">
                We accept all major credit cards, debit cards, and mobile money payments.
              </p>
            </div>
            
            <div className="faq-item">
              <h3 className="faq-question">Is there a free trial for paid plans?</h3>
              <p className="faq-answer">
                Yes, we offer a 7-day free trial for both Pro and Ultra plans.
              </p>
            </div>
            
            <div className="faq-item">
              <h3 className="faq-question">Can I cancel my subscription?</h3>
              <p className="faq-answer">
                Absolutely! You can cancel your subscription at any time with no cancellation fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="plans-cta">
        <div className="container">
          <div className="plans-cta-content">
            <h2 className="plans-cta-title">Ready to Take Your Freelance Career to the Next Level?</h2>
            <p className="plans-cta-description">
              Join thousands of successful freelancers who have already upgraded their plans
            </p>
            <div className="plans-cta-actions">
              {!currentUser ? (
                <>
                  <Link to="/login" className="btn btn-primary btn-xl">
                    Get Started Today
                  </Link>
                  <Link to="/" className="btn btn-outline btn-xl">
                    Back to Home
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="btn btn-primary btn-xl">
                    Go to Dashboard
                  </Link>
                  <Link to="/" className="btn btn-outline btn-xl">
                    Back to Home
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

export default Plans;






