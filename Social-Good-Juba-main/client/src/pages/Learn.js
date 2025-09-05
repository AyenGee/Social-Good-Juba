import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Learn.css';

const Learn = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [completedLessons, setCompletedLessons] = useState(new Set());

  const markLessonComplete = (lessonId) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };

  const learningSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      description: 'Learn the basics of using Juba Platform',
      lessons: [
        {
          id: 'platform-overview',
          title: 'Platform Overview',
          duration: '5 min',
          type: 'video',
          description: 'Introduction to Juba Platform and how it works',
          content: 'Welcome to Juba Platform! This video will show you how our platform connects clients with skilled freelancers in South Sudan.',
          videoUrl: '/juba-intro-video.mp4'
        },
        {
          id: 'creating-account',
          title: 'Creating Your Account',
          duration: '3 min',
          type: 'tutorial',
          description: 'Step-by-step guide to creating your account',
          content: 'Learn how to sign up for Juba Platform using your Google account or email address.',
          steps: [
            'Click the "Sign In" button',
            'Choose "Sign in with Google" or enter your email',
            'Complete your profile information',
            'Verify your phone number',
            'You\'re ready to start!'
          ]
        },
        {
          id: 'profile-setup',
          title: 'Setting Up Your Profile',
          duration: '7 min',
          type: 'tutorial',
          description: 'How to create a professional profile',
          content: 'Your profile is your first impression. Learn how to make it stand out.',
          steps: [
            'Add a clear profile picture',
            'Write a compelling bio',
            'List your skills and experience',
            'Set your service areas',
            'Add your contact information'
          ]
        }
      ]
    },
    {
      id: 'for-clients',
      title: 'For Clients',
      icon: '👤',
      description: 'How to hire freelancers and post jobs',
      lessons: [
        {
          id: 'posting-jobs',
          title: 'How to Post a Job',
          duration: '8 min',
          type: 'video',
          description: 'Learn how to create effective job postings',
          content: 'Creating a good job posting helps you find the right freelancer quickly.',
          videoUrl: '/juba-intro-video.mp4'
        },
        {
          id: 'choosing-freelancers',
          title: 'Choosing the Right Freelancer',
          duration: '6 min',
          type: 'guide',
          description: 'Tips for selecting the best freelancer for your project',
          content: 'Learn how to evaluate freelancer profiles and applications.',
          tips: [
            'Check their ratings and reviews',
            'Look at their portfolio and experience',
            'Read their proposals carefully',
            'Ask questions before hiring',
            'Start with smaller projects to test fit'
          ]
        },
        {
          id: 'managing-projects',
          title: 'Managing Your Projects',
          duration: '10 min',
          type: 'tutorial',
          description: 'How to communicate and manage projects effectively',
          content: 'Good project management leads to successful outcomes.',
          steps: [
            'Set clear expectations from the start',
            'Use the chat feature to communicate',
            'Provide feedback regularly',
            'Pay on time',
            'Leave honest reviews'
          ]
        }
      ]
    },
    {
      id: 'for-freelancers',
      title: 'For Freelancers',
      icon: '🔧',
      description: 'How to find work and grow your business',
      lessons: [
        {
          id: 'becoming-freelancer',
          title: 'Becoming a Freelancer',
          duration: '5 min',
          type: 'tutorial',
          description: 'How to apply to become a freelancer on the platform',
          content: 'Learn the requirements and process for becoming a freelancer.',
          steps: [
            'Complete your profile',
            'Click "Become a Freelancer"',
            'Fill out the application form',
            'Wait for admin approval',
            'Start applying to jobs!'
          ]
        },
        {
          id: 'finding-jobs',
          title: 'Finding and Applying to Jobs',
          duration: '12 min',
          type: 'video',
          description: 'How to find relevant jobs and write winning proposals',
          content: 'Learn how to search for jobs and write proposals that get you hired.',
          videoUrl: '/juba-intro-video.mp4'
        },
        {
          id: 'pricing-services',
          title: 'Pricing Your Services',
          duration: '8 min',
          type: 'guide',
          description: 'How to set competitive and fair prices',
          content: 'Pricing your services correctly is key to success.',
          tips: [
            'Research market rates in your area',
            'Consider your experience level',
            'Factor in your costs and time',
            'Start competitive, increase over time',
            'Be flexible but know your worth'
          ]
        }
      ]
    },
    {
      id: 'scaling-business',
      title: 'Scaling Your Business',
      icon: '📈',
      description: 'Growing your freelance business',
      lessons: [
        {
          id: 'building-reputation',
          title: 'Building Your Reputation',
          duration: '10 min',
          type: 'guide',
          description: 'How to build trust and get repeat clients',
          content: 'A good reputation is your most valuable asset.',
          tips: [
            'Always deliver quality work',
            'Meet deadlines consistently',
            'Communicate clearly and promptly',
            'Ask for reviews after completing jobs',
            'Build long-term relationships with clients'
          ]
        },
        {
          id: 'expanding-services',
          title: 'Expanding Your Services',
          duration: '7 min',
          type: 'tutorial',
          description: 'How to add new services and increase income',
          content: 'Learn how to diversify your offerings and increase your earning potential.',
          steps: [
            'Identify skills you can learn',
            'Take online courses or training',
            'Practice new skills on small projects',
            'Update your profile with new services',
            'Market your expanded capabilities'
          ]
        },
        {
          id: 'time-management',
          title: 'Time Management for Freelancers',
          duration: '9 min',
          type: 'video',
          description: 'How to manage multiple projects and deadlines',
          content: 'Effective time management helps you take on more work and earn more.',
          videoUrl: '/juba-intro-video.mp4'
        }
      ]
    },
    {
      id: 'marketing-advertising',
      title: 'Marketing & Advertising',
      icon: '📢',
      description: 'How to promote your services and find clients',
      lessons: [
        {
          id: 'online-marketing',
          title: 'Online Marketing Basics',
          duration: '15 min',
          type: 'video',
          description: 'Introduction to digital marketing for freelancers',
          content: 'Learn the basics of promoting your services online.',
          videoUrl: '/juba-intro-video.mp4'
        },
        {
          id: 'social-media',
          title: 'Using Social Media',
          duration: '12 min',
          type: 'guide',
          description: 'How to use social media to find clients',
          content: 'Social media can be a powerful tool for finding new clients.',
          tips: [
            'Create professional profiles on LinkedIn and Facebook',
            'Share examples of your work',
            'Engage with potential clients',
            'Join relevant groups and communities',
            'Be consistent with your posting'
          ]
        },
        {
          id: 'word-of-mouth',
          title: 'Word of Mouth Marketing',
          duration: '6 min',
          type: 'tutorial',
          description: 'How to get referrals and recommendations',
          content: 'Happy clients are your best marketing tool.',
          steps: [
            'Always exceed client expectations',
            'Ask satisfied clients for referrals',
            'Offer referral incentives',
            'Network with other freelancers',
            'Attend local business events'
          ]
        }
      ]
    },
    {
      id: 'financial-management',
      title: 'Financial Management',
      icon: '💰',
      description: 'Managing money and building financial security',
      lessons: [
        {
          id: 'budgeting',
          title: 'Basic Budgeting',
          duration: '10 min',
          type: 'guide',
          description: 'How to manage your income and expenses',
          content: 'Good budgeting helps you build financial security.',
          tips: [
            'Track all your income and expenses',
            'Set aside money for taxes',
            'Create an emergency fund',
            'Save for equipment and training',
            'Plan for slow periods'
          ]
        },
        {
          id: 'pricing-strategies',
          title: 'Pricing Strategies',
          duration: '8 min',
          type: 'video',
          description: 'Advanced pricing techniques for freelancers',
          content: 'Learn different pricing models and when to use them.',
          videoUrl: '/juba-intro-video.mp4'
        },
        {
          id: 'tax-basics',
          title: 'Tax Basics for Freelancers',
          duration: '12 min',
          type: 'guide',
          description: 'Understanding taxes and keeping records',
          content: 'Important tax information for freelancers in South Sudan.',
          tips: [
            'Keep detailed records of all income',
            'Save receipts for business expenses',
            'Set aside money for taxes',
            'Consider hiring an accountant',
            'Understand local tax requirements'
          ]
        }
      ]
    }
  ];

  const getCurrentSection = () => {
    return learningSections.find(section => section.id === activeSection);
  };

  const getProgressPercentage = (sectionId) => {
    const section = learningSections.find(s => s.id === sectionId);
    if (!section) return 0;
    
    const completedInSection = section.lessons.filter(lesson => 
      completedLessons.has(lesson.id)
    ).length;
    
    return Math.round((completedInSection / section.lessons.length) * 100);
  };

  return (
    <div className="learn-page">
      {/* Header */}
      <div className="learn-header">
        <div className="learn-header-content">
          <h1>Learn & Grow</h1>
          <p>Master the skills you need to succeed on Juba Platform</p>
          <div className="learn-stats">
            <div className="stat">
              <span className="stat-number">{learningSections.length}</span>
              <span className="stat-label">Learning Sections</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {learningSections.reduce((total, section) => total + section.lessons.length, 0)}
              </span>
              <span className="stat-label">Lessons</span>
            </div>
            <div className="stat">
              <span className="stat-number">{completedLessons.size}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="learn-container">
        {/* Sidebar */}
        <div className="learn-sidebar">
          <div className="sidebar-header">
            <h3>Learning Path</h3>
            <p>Choose a topic to start learning</p>
          </div>
          
          <div className="sidebar-sections">
            {learningSections.map(section => (
              <div 
                key={section.id}
                className={`sidebar-section ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="section-icon">{section.icon}</div>
                <div className="section-info">
                  <h4>{section.title}</h4>
                  <p>{section.description}</p>
                  <div className="section-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${getProgressPercentage(section.id)}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {getProgressPercentage(section.id)}% Complete
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="learn-content">
          <div className="content-header">
            <div className="content-title">
              <span className="section-icon">{getCurrentSection()?.icon}</span>
              <div>
                <h2>{getCurrentSection()?.title}</h2>
                <p>{getCurrentSection()?.description}</p>
              </div>
            </div>
            <div className="content-progress">
              <span>{getProgressPercentage(activeSection)}% Complete</span>
            </div>
          </div>

          <div className="lessons-list">
            {getCurrentSection()?.lessons.map((lesson, index) => (
              <div key={lesson.id} className="lesson-card">
                <div className="lesson-header">
                  <div className="lesson-number">{index + 1}</div>
                  <div className="lesson-info">
                    <h3>{lesson.title}</h3>
                    <div className="lesson-meta">
                      <span className="lesson-duration">{lesson.duration}</span>
                      <span className="lesson-type">{lesson.type}</span>
                    </div>
                  </div>
                  <div className="lesson-actions">
                    {completedLessons.has(lesson.id) ? (
                      <span className="completed-badge">✅ Completed</span>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => markLessonComplete(lesson.id)}
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="lesson-content">
                  <p className="lesson-description">{lesson.description}</p>
                  
                  {lesson.type === 'video' && lesson.videoUrl && (
                    <div className="video-container">
                      <video
                        controls
                        width="100%"
                        height="400"
                        poster="/video-poster.jpg"
                      >
                        <source src={lesson.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  
                  {lesson.type === 'tutorial' && lesson.steps && (
                    <div className="tutorial-steps">
                      <h4>Steps:</h4>
                      <ol>
                        {lesson.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  {lesson.type === 'guide' && lesson.tips && (
                    <div className="guide-tips">
                      <h4>Tips:</h4>
                      <ul>
                        {lesson.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="lesson-text">
                    <p>{lesson.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="learn-quick-actions">
        <div className="quick-actions-container">
          <h3>Ready to Get Started?</h3>
          <div className="quick-actions-buttons">
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
            <Link to="/post-job" className="btn btn-outline">
              Post a Job
            </Link>
            <Link to="/jobs" className="btn btn-outline">
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;
