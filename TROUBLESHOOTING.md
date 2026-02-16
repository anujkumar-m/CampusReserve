# Troubleshooting Login Issues

## Quick Checks

### 1. Verify Both Servers Are Running

**Backend** (should show):
```
Server running in development mode on port 5000
MongoDB Connected: [your-cluster].mongodb.net
```

**Frontend** (should show):
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 2. Check Browser Console

1. Open browser to `http://localhost:5173`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for any red error messages

### 3. Common Issues & Solutions

#### Issue: "Network Error" or "Failed to fetch"

**Solution**: CORS issue or backend not running
- Make sure backend is running on port 5000
- Check backend `.env` has: `FRONTEND_URL=http://localhost:5173`
- Restart backend server

#### Issue: "Invalid credentials"

**Solution**: Database not seeded
```bash
cd backend
npm run seed
```

#### Issue: Environment variable not loading

**Solution**: Restart frontend server
```bash
# Stop frontend (Ctrl+C)
# Start again
npm run dev
```

### 4. Manual API Test

Open browser console (F12) and paste:

```javascript
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('API Error:', err));
```

**Expected**: `{success: true, message: "Server is running"}`

### 5. Test Login Directly

In browser console:

```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@college.edu',
    password: 'password123'
  })
})
  .then(res => res.json())
  .then(data => console.log('Login Response:', data))
  .catch(err => console.error('Login Error:', err));
```

**Expected**: 
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "Dr. Admin User",
    "email": "admin@college.edu",
    "role": "admin"
  }
}
```

### 6. Check Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Try to login
4. Look for `/api/auth/login` request
5. Click on it to see:
   - **Status Code**: Should be 200 (success) or 401 (wrong password)
   - **Response**: Check the error message
   - **Request Payload**: Verify email/password are sent correctly

### 7. Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "User not found" | Database not seeded | Run `npm run seed` in backend |
| "Invalid credentials" | Wrong password | Use `password123` |
| "Network Error" | Backend not running | Start backend server |
| "CORS error" | CORS misconfiguration | Check backend CORS settings |

### 8. Verify Database Has Users

In backend terminal, you should have seen after running `npm run seed`:

```
✅ Database seeded successfully!

Test Users:
Admin: admin@college.edu / password123
Faculty: sarah@college.edu / password123
Student: alex@student.edu / password123
Department: cs@college.edu / password123
Club: techclub@college.edu / password123
```

If you didn't see this, run the seed command again.

### 9. Check Frontend Environment

In browser console:
```javascript
console.log(import.meta.env.VITE_API_URL);
```

**Expected**: `http://localhost:5000/api`

If it shows `undefined`, restart the frontend server.

### 10. Full Reset (Last Resort)

```bash
# Stop both servers (Ctrl+C)

# Backend
cd backend
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

## Still Not Working?

Please provide:
1. **Browser console errors** (F12 → Console tab)
2. **Network tab details** (F12 → Network → click on failed request)
3. **Backend terminal output** (any errors?)
4. **Exact error message** shown on the login page
