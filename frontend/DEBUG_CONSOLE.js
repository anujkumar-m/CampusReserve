// Add this to your browser console to debug the API connection
// Press F12 in your browser, go to Console tab, and paste this:

console.log('=== API DEBUG INFO ===');
console.log('1. Environment Variable:', import.meta.env.VITE_API_URL);
console.log('2. Expected:', 'http://localhost:5000/api');

// Test direct API call
console.log('\n3. Testing API connection...');
fetch('http://localhost:5000/api/health')
    .then(res => res.json())
    .then(data => {
        console.log('✅ API Health Check Success:', data);

        // Now test login
        console.log('\n4. Testing login...');
        return fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@college.edu',
                password: 'password123'
            })
        });
    })
    .then(res => res.json())
    .then(data => {
        console.log('✅ Login Test Success:', data);
        if (data.success) {
            console.log('\n🎉 Backend is working! The issue is in the frontend.');
            console.log('Solution: Restart the frontend server (Ctrl+C then npm run dev)');
        }
    })
    .catch(err => {
        console.error('❌ Error:', err);
        console.log('\nPossible issues:');
        console.log('- Backend not running on port 5000');
        console.log('- CORS issue');
        console.log('- Network problem');
    });
