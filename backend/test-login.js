// Test the login API endpoint
const https = require('http');

const data = JSON.stringify({
    email: 'admin@college.edu',
    password: 'password123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Testing login API...\n');

const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', JSON.parse(responseData));

        if (res.statusCode === 200) {
            console.log('\n✅ Login API is working correctly!');
        } else {
            console.log('\n❌ Login failed. Check the response above.');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error connecting to API:', error.message);
    console.log('\nMake sure the backend server is running on port 5000');
});

req.write(data);
req.end();
