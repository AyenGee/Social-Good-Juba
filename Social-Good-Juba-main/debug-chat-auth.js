// Debug Chat Authentication Issues
// Run this in your browser console to check token status

console.log('🔍 Debugging Chat Authentication...');

// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
console.log('Current User:', currentUser);

// Check token storage
const jubaToken = localStorage.getItem('juba_token');
const regularToken = localStorage.getItem('token');
console.log('Juba Token:', jubaToken ? '✅ Found' : '❌ Missing');
console.log('Regular Token:', regularToken ? '✅ Found' : '❌ Missing');

// Check token format
if (jubaToken) {
    try {
        const tokenParts = jubaToken.split('.');
        if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Token Payload:', payload);
            console.log('Token Expires:', new Date(payload.exp * 1000));
            console.log('Token Valid:', payload.exp * 1000 > Date.now() ? '✅ Yes' : '❌ Expired');
        } else {
            console.log('❌ Invalid token format');
        }
    } catch (error) {
        console.log('❌ Error parsing token:', error);
    }
}

// Check if user is authenticated in AuthContext
if (window.AuthContext) {
    console.log('AuthContext available');
} else {
    console.log('❌ AuthContext not available');
}

// Test API call
async function testChatAPI() {
    if (!jubaToken) {
        console.log('❌ No token available for testing');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/chat/conversations', {
            headers: {
                'Authorization': `Bearer ${jubaToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', response.headers);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Call Successful:', data);
        } else {
            const errorData = await response.text();
            console.log('❌ API Call Failed:', errorData);
        }
    } catch (error) {
        console.log('❌ Network Error:', error);
    }
}

// Run test if token exists
if (jubaToken) {
    console.log('🧪 Testing Chat API...');
    testChatAPI();
} else {
    console.log('⚠️  No token found. Please log in first.');
}

console.log('🔍 Debug Complete. Check the output above for issues.');

