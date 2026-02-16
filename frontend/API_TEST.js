// Quick API Test Script
// Run this in your browser console (F12) when on http://localhost:5173

console.log('Testing API connection...');

// Test 1: Check if API is reachable
fetch('http://localhost:5000/api/health')
    .then(res => res.json())
    .then(data => console.log('✅ API Health Check:', data))
    .catch(err => console.error('❌ API Health Check Failed:', err));

// Test 2: Try login
fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'admin@college.edu',
        password: 'password123'
    })
})
    .then(res => res.json())
    .then(data => console.log('✅ Login Test:', data))
    .catch(err => console.error('❌ Login Test Failed:', err));

// Test 3: Check environment variable
console.log('Frontend API URL:', import.meta.env.VITE_API_URL);
