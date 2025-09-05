import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [isFreelancer, setIsFreelancer] = useState(false);
  
  // File upload states
  const [cvFile, setCvFile] = useState(null);
  const [policeFile, setPoliceFile] = useState(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingPolice, setUploadingPolice] = useState(false);
  const [uploadErrors, setUploadErrors] = useState({});

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    education_level: '',
    employment_status: '',
    profile_picture_url: '',
    bio: '',
    experience_years: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    service_areas: [],
    languages_spoken: [],
    transportation_available: false,
    insurance_coverage: false
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserProfile(data.user);
      setFreelancerProfile(data.freelancer_profile);
      setIsFreelancer(data.user.role === 'freelancer');

      // Populate form with existing data
      setFormData({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        phone: data.user.phone || '',
        address: data.user.address || '',
        date_of_birth: data.user.date_of_birth || '',
        gender: data.user.gender || '',
        education_level: data.user.education_level || '',
        employment_status: data.user.employment_status || '',
        profile_picture_url: data.user.profile_picture_url || '',
        bio: data.freelancer_profile?.bio || '',
        experience_years: data.freelancer_profile?.experience_years || '',
        hourly_rate_min: data.freelancer_profile?.hourly_rate_min || '',
        hourly_rate_max: data.freelancer_profile?.hourly_rate_max || '',
        service_areas: data.freelancer_profile?.service_areas || [],
        languages_spoken: data.freelancer_profile?.languages_spoken || [],
        transportation_available: data.freelancer_profile?.transportation_available || false,
        insurance_coverage: data.freelancer_profile?.insurance_coverage || false
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Error loading profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file, type) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (!file) return null;
    
    if (file.size > maxSize) {
      return `${type} file size must be less than 5MB`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return `${type} must be a PDF, JPG, JPEG, or PNG file`;
    }
    
    return null;
  };

  const uploadDocument = async (file, documentType) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);

    const token = localStorage.getItem('token');
    const response = await fetch('/api/profile/upload-document', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();
  };

  const handleFileUpload = async (file, documentType, setUploading) => {
    const fileError = validateFile(file, documentType.toUpperCase());
    if (fileError) {
      setUploadErrors(prev => ({ ...prev, [documentType]: fileError }));
      return;
    }

    try {
      setUploading(true);
      setUploadErrors(prev => ({ ...prev, [documentType]: null }));

      await uploadDocument(file, documentType);
      
      // Refresh profile data
      await fetchUserProfile();
      
      // Clear file input
      if (documentType === 'cv') {
        setCvFile(null);
        document.getElementById('cv_upload').value = '';
      } else {
        setPoliceFile(null);
        document.getElementById('police_upload').value = '';
      }

      alert(`${documentType.toUpperCase()} uploaded successfully!`);
    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error);
      setUploadErrors(prev => ({ ...prev, [documentType]: error.message }));
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (name, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [name]: array
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      alert('Profile updated successfully!');
      await fetchUserProfile(); // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                placeholder="Enter your first name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="+211 123 456 789"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              required
              placeholder="Enter your full address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="education_level">Education Level</label>
              <select
                id="education_level"
                name="education_level"
                value={formData.education_level}
                onChange={handleInputChange}
              >
                <option value="">Select Education Level</option>
                <option value="high_school">High School</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="employment_status">Employment Status</label>
              <select
                id="employment_status"
                name="employment_status"
                value={formData.employment_status}
                onChange={handleInputChange}
              >
                <option value="">Select Employment Status</option>
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="self_employed">Self Employed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Freelancer-specific Section */}
        {isFreelancer && (
          <>
            <div className="form-section">
              <h2>Professional Information</h2>
              
              <div className="form-group">
                <label htmlFor="bio">Professional Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe your professional experience, skills, and what makes you unique as a freelancer..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience_years">Years of Experience</label>
                <input
                  type="number"
                  id="experience_years"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  placeholder="e.g., 5"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hourly_rate_min">Minimum Hourly Rate (SSP)</label>
                  <input
                    type="number"
                    id="hourly_rate_min"
                    name="hourly_rate_min"
                    value={formData.hourly_rate_min}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 50.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hourly_rate_max">Maximum Hourly Rate (SSP)</label>
                  <input
                    type="number"
                    id="hourly_rate_max"
                    name="hourly_rate_max"
                    value={formData.hourly_rate_max}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 150.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="service_areas">Service Areas (comma-separated)</label>
                <input
                  type="text"
                  id="service_areas"
                  name="service_areas"
                  value={formData.service_areas.join(', ')}
                  onChange={(e) => handleArrayChange('service_areas', e.target.value)}
                  placeholder="e.g., Web Development, Graphic Design, Writing, Translation"
                />
                <small className="form-text">Enter multiple services separated by commas</small>
              </div>

              <div className="form-group">
                <label htmlFor="languages_spoken">Languages Spoken (comma-separated)</label>
                <input
                  type="text"
                  id="languages_spoken"
                  name="languages_spoken"
                  value={formData.languages_spoken.join(', ')}
                  onChange={(e) => handleArrayChange('languages_spoken', e.target.value)}
                  placeholder="e.g., English, Arabic, French, Dinka"
                />
                <small className="form-text">Enter multiple languages separated by commas</small>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="transportation_available"
                      checked={formData.transportation_available}
                      onChange={handleInputChange}
                    />
                    I have transportation available
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="insurance_coverage"
                      checked={formData.insurance_coverage}
                      onChange={handleInputChange}
                    />
                    I have insurance coverage
                  </label>
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="form-section">
              <h2>Document Upload</h2>
              
              <div className="form-group">
                <label htmlFor="cv_upload">Upload CV/Resume (PDF, JPG, PNG - Max 5MB)</label>
                <input
                  type="file"
                  id="cv_upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCvFile(e.target.files[0])}
                  disabled={uploadingCV}
                />
                {cvFile && (
                  <div className="file-info">
                    <span>Selected: {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => handleFileUpload(cvFile, 'cv', setUploadingCV)}
                      disabled={uploadingCV}
                      className="btn-upload"
                    >
                      {uploadingCV ? 'Uploading...' : 'Upload CV'}
                    </button>
                  </div>
                )}
                {uploadErrors.cv && (
                  <div className="error-message">{uploadErrors.cv}</div>
                )}
                {freelancerProfile?.documents?.cv && (
                  <div className="existing-file">
                    <span>CV uploaded on {new Date(freelancerProfile.documents.cv.uploaded_at).toLocaleDateString()}</span>
                    <a 
                      href={freelancerProfile.documents.cv.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      View Current CV
                    </a>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="police_upload">Upload Police Clearance (PDF, JPG, PNG - Max 5MB)</label>
                <input
                  type="file"
                  id="police_upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setPoliceFile(e.target.files[0])}
                  disabled={uploadingPolice}
                />
                {policeFile && (
                  <div className="file-info">
                    <span>Selected: {policeFile.name} ({(policeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => handleFileUpload(policeFile, 'police_clearance', setUploadingPolice)}
                      disabled={uploadingPolice}
                      className="btn-upload"
                    >
                      {uploadingPolice ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </div>
                )}
                {uploadErrors.police_clearance && (
                  <div className="error-message">{uploadErrors.police_clearance}</div>
                )}
                {freelancerProfile?.documents?.police_clearance && (
                  <div className="existing-file">
                    <span>Police clearance uploaded on {new Date(freelancerProfile.documents.police_clearance.uploaded_at).toLocaleDateString()}</span>
                    <a 
                      href={freelancerProfile.documents.police_clearance.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      View Current Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Profile Summary Section */}
        <div className="form-section">
          <h2>Profile Summary</h2>
          <div className="profile-summary">
            <div className="summary-item">
              <strong>Name:</strong> {formData.first_name} {formData.last_name}
            </div>
            <div className="summary-item">
              <strong>Email:</strong> {userProfile?.email}
            </div>
            <div className="summary-item">
              <strong>Role:</strong> {isFreelancer ? 'Freelancer' : 'Client'}
            </div>
            {isFreelancer && (
              <>
                <div className="summary-item">
                  <strong>Experience:</strong> {formData.experience_years} years
                </div>
                <div className="summary-item">
                  <strong>Rate Range:</strong> {formData.hourly_rate_min} - {formData.hourly_rate_max} SSP/hour
                </div>
                <div className="summary-item">
                  <strong>Services:</strong> {formData.service_areas.join(', ') || 'Not specified'}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving || uploadingCV || uploadingPolice} className="btn-primary">
            {saving ? 'Updating Profile...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;