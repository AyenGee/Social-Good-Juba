import React, { useState } from 'react';
import axios from 'axios';

const TestDatabase = () => {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/jobs/debug/database');
      setDebugData(response.data);
      console.log('Debug data:', response.data);
    } catch (err) {
      setError(err.response?.data || err.message);
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testAvailableJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/jobs/available-jobs');
      console.log('Available jobs response:', response.data);
      alert(`Available jobs: ${response.data.jobs?.length || 0}`);
    } catch (err) {
      setError(err.response?.data || err.message);
      console.error('Available jobs test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Database Test Page</h1>
      <p>Use this page to test database connectivity and see what data is available.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testDatabase}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>
        
        <button 
          onClick={testAvailableJobs}
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Available Jobs'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {debugData && (
        <div>
          <h2>Database Status</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>Users Table</h3>
            <p><strong>Count:</strong> {debugData.users.count}</p>
            <p><strong>Error:</strong> {debugData.users.error || 'None'}</p>
            {debugData.users.data.length > 0 && (
              <div>
                <strong>Sample Users:</strong>
                <ul>
                  {debugData.users.data.map(user => (
                    <li key={user.id}>
                      {user.email} (Role: {user.role}, Admin: {user.admin_status ? 'Yes' : 'No'})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Jobs Table</h3>
            <p><strong>Count:</strong> {debugData.jobs.count}</p>
            <p><strong>Error:</strong> {debugData.jobs.error || 'None'}</p>
            {debugData.jobs.data.length > 0 && (
              <div>
                <strong>Sample Jobs:</strong>
                <ul>
                  {debugData.jobs.data.map(job => (
                    <li key={job.id}>
                      {job.title} - {job.status} - {job.location}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Freelancer Profiles Table</h3>
            <p><strong>Count:</strong> {debugData.freelancerProfiles.count}</p>
            <p><strong>Error:</strong> {debugData.freelancerProfiles.error || 'None'}</p>
            {debugData.freelancerProfiles.data.length > 0 && (
              <div>
                <strong>Sample Profiles:</strong>
                <ul>
                  {debugData.freelancerProfiles.data.map(profile => (
                    <li key={profile.id}>
                      User ID: {profile.user_id} - Experience: {profile.experience_years} years
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Timestamp</h3>
            <p>{debugData.timestamp}</p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>Next Steps:</h3>
        <ol>
          <li>Click "Test Database Connection" to see what's in your database</li>
          <li>If no jobs exist, run the <code>quick-fix-jobs.sql</code> script in Supabase</li>
          <li>Click "Test Available Jobs" to verify the jobs endpoint works</li>
          <li>Check the browser console for detailed server logs</li>
        </ol>
      </div>
    </div>
  );
};

export default TestDatabase;
