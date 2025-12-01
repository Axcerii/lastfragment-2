import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173';

async function testAuth() {
    const timestamp = Date.now();
    const login = `testuser_${timestamp}`;
    const password = 'Password123!';

    console.log(`Attempting to register user: ${login}`);

    // Register
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password, passwordConfirm: password })
    });

    const regData = await regRes.json();
    console.log('Registration response:', regData);
    console.log('Registration headers:', regRes.headers.raw());

    // Login
    console.log(`Attempting to login user: ${login}`);
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
    });

    const loginData = await loginRes.json();
    console.log('Login response:', loginData);

    const cookies = loginRes.headers.get('set-cookie');
    if (cookies) {
        console.log('SUCCESS: Set-Cookie header found:', cookies);
    } else {
        console.log('FAILURE: No Set-Cookie header found.');
    }
}

testAuth().catch(console.error);
