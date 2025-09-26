# Login Troubleshooting Guide

## Current Status
✅ **Backend is working correctly**
- Server is running on port 5002
- Login endpoint is functional
- Registration endpoint is functional
- JWT tokens are being generated correctly
- Database connection is working

## Test Credentials
- **Email:** demo@example.com
- **Password:** demo123456

## Backend Test Results
```bash
# Registration test
curl -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123456","firstName":"Demo","lastName":"User"}'

# Login test
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123456"}'
```

Both tests return successful responses with valid JWT tokens.

## Frontend Issues to Check

### 1. Environment Variables
Check if the frontend is using the correct API URL:
- Development: `http://localhost:5002`
- Production: `https://untangle-production.up.railway.app`

### 2. CORS Issues
The backend has CORS configured to allow all origins, but check browser console for CORS errors.

### 3. Network Requests
Check browser DevTools → Network tab for:
- Failed requests to `/api/auth/login`
- 401/403 errors
- CORS preflight failures

### 4. Console Errors
Check browser DevTools → Console for:
- JavaScript errors
- Axios errors
- Authentication context errors

### 5. Local Storage
Check if tokens are being stored:
- Open DevTools → Application → Local Storage
- Look for `token` key

## Common Issues & Solutions

### Issue 1: "Invalid credentials" error
**Cause:** Wrong email/password or user doesn't exist
**Solution:** Use the test credentials above or register a new user

### Issue 2: Network error
**Cause:** Backend not running or wrong API URL
**Solution:** 
1. Ensure backend is running: `npm run dev` in project root
2. Check API_BASE_URL in client/src/config.js

### Issue 3: CORS error
**Cause:** Cross-origin request blocked
**Solution:** Backend CORS is configured to allow all origins, but check if there are specific browser restrictions

### Issue 4: Token not being stored
**Cause:** Local storage issues or authentication context problems
**Solution:** Check AuthContext implementation and localStorage usage

## Debug Steps

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Try to login**
4. **Check the login request:**
   - Is it being sent to the correct URL?
   - What's the response status?
   - What's the response body?

5. **Check Console tab for errors**

6. **Check Application tab → Local Storage for token**

## Quick Fix Commands

```bash
# Start backend (if not running)
cd /Users/priyas/Lyfe
npm run dev

# Start frontend (if not running)
cd /Users/priyas/Lyfe/client
npm start

# Test backend directly
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123456"}'
```

## Next Steps
1. Check browser console for specific error messages
2. Verify the frontend is making requests to the correct API URL
3. Check if there are any JavaScript errors preventing the login form from working
4. Test with the provided credentials: demo@example.com / demo123456
