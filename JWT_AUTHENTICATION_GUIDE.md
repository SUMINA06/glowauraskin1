# JWT Authentication Implementation Summary

## Overview
This document summarizes the complete implementation of JWT-based authentication for the GlowAura Skin admin panel.

## Changes Made

### Backend Changes

#### 1. **New File: `config/jwt.js`**
- Implements JWT token generation and verification
- Provides `generateToken()`, `verifyToken()`, `authMiddleware`, and `adminMiddleware` functions
- Uses environment variables for JWT_SECRET and JWT_EXPIRY
- Default JWT expiry: 7 days

#### 2. **Updated: `model/User.js`**
- Added `bcrypt` integration for password hashing
- New methods:
  - `hashPassword()` - Hash passwords with bcrypt
  - `comparePassword()` - Compare plaintext password with hash
  - `findByUsername()` - Find user by username
  - `findByEmailOrUsername()` - Find user by email or username

#### 3. **Updated: `controller/userController.js`**
- `createUser()` - Now hashes passwords before storing
- `createAdminUser()` - Now hashes passwords before storing
- `loginUser()` - Uses bcrypt comparison and generates JWT token
- `adminLogin()` - Completely replaced hardcoded credentials with database + bcrypt + JWT
  - Now queries database for admin users
  - Validates password using bcrypt
  - Returns JWT token on successful login
- NEW `verifyAdminToken()` - Verifies and returns admin user info from token

#### 4. **Updated: `routes/userRoutes.js`**
- Added JWT middleware imports
- New route: `GET /users/admin/verify` - Verify admin token (protected)
- Updated adminLogin to use new database-based authentication

#### 5. **Updated: `server.js`**
- Added "Authorization" to CORS allowed headers for JWT token transmission

#### 6. **New File: `seed.js`**
- Utility script to create an admin user in the database
- Run with: `node seed.js`
- Creates: admin@nepmart.com / admin / Admin@123

### Frontend Changes

#### 1. **Updated: `api/client.js`**
- Created `axiosInstance` with request/response interceptors
- Request interceptor: Automatically adds JWT token to all requests
- Response interceptor: Handles 401 errors and redirects to login on token expiration
- New functions:
  - `getAdminToken()` - Retrieve JWT token from localStorage
  - `saveAdminToken()` - Save JWT token to localStorage
  - `verifyAdminToken()` - Verify token with backend
- All API endpoints updated to use `axiosInstance` instead of `axios`

#### 2. **Updated: `admin/components/ProtectedRoute.jsx`**
- Now verifies JWT token with backend on mount
- Loading state during verification
- Automatically redirects to login if token is invalid or expired
- Clears localStorage on failed verification

#### 3. **Updated: `admin/components/login.jsx`**
- Removed fallback to hardcoded credentials
- Now uses admin login endpoint exclusively
- Stores JWT token in `localStorage.adminToken`
- Stores user info in `localStorage.adminUser`
- Simplified error handling

#### 4. **Updated: `admin/components/AdminLayout.jsx`**
- Logout now clears both `adminToken` and `adminUser` from localStorage

## Environment Variables

### Backend (Create `.env` file if needed)
```
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=7d
```

## Database Schema Changes

### Users Table
The existing users table now supports:
- `password` (VARCHAR 255) - Stores bcrypt hashed passwords
- `role` (ENUM 'user', 'admin') - User role
- `is_admin` (BOOLEAN) - Legacy admin flag

## Authentication Flow

### Login Process
1. User enters email/username and password
2. Frontend sends POST to `/api/users/admin/login`
3. Backend queries database for user by email/username
4. Backend verifies password using bcrypt
5. Backend generates JWT token (valid for 7 days)
6. Frontend stores token in `localStorage.adminToken`
7. Frontend redirects to dashboard

### Route Protection
1. When accessing protected routes, ProtectedRoute component mounts
2. Reads JWT token from localStorage
3. Sends GET request to `/api/users/admin/verify` with token
4. Backend verifies token and returns user info
5. If valid, allows access; if invalid, redirects to login
6. Token stays in memory; auto-verified on page refresh

### API Requests
1. All requests through apiClient include JWT in Authorization header
2. Format: `Authorization: Bearer {token}`
3. Backend middleware verifies token on protected routes
4. If token expired (401 response), axios interceptor clears localStorage and redirects

### Logout
1. User clicks logout button
2. Frontend clears both token and user data from localStorage
3. Redirects to login page
4. Next API request will have no Authorization header

## Testing

### Creating Test Admin User
Run the seed script:
```bash
cd backend
node seed.js
```

Test credentials:
- Email: `admin@nepmart.com`
- Username: `admin`
- Password: `Admin@123`

### Testing Persistent Login
1. Log in with admin credentials
2. Refresh the page
3. You should stay logged in (token verified on mount)
4. JWT token remains valid for 7 days

### Testing Token Expiration
1. Admin token expires after 7 days
2. Next API request returns 401
3. Axios interceptor clears token and redirects to login

### Testing Logout
1. Log in successfully
2. Click logout button
3. Verify redirected to login page
4. Try accessing admin dashboard - should redirect to login

## Security Features

1. ✅ Passwords hashed with bcrypt (10 salt rounds)
2. ✅ JWT tokens signed with secret key
3. ✅ Tokens stored in localStorage (XSS vulnerability - consider upgrading)
4. ✅ Authorization header for token transmission
5. ✅ Token expiration (7 days)
6. ✅ Role-based access control (admin role required)
7. ✅ No hardcoded credentials
8. ✅ CORS properly configured

## Future Improvements (Optional)

1. **HttpOnly Cookies** - Store JWT in HttpOnly cookies instead of localStorage (more secure against XSS)
2. **Refresh Tokens** - Implement refresh token rotation for better security
3. **Rate Limiting** - Add rate limiting to login endpoint
4. **Session Management** - Track active sessions in database
5. **Audit Logging** - Log all admin actions
6. **2FA** - Add two-factor authentication

## Packages Added

- `bcrypt@^5.x.x` - Password hashing
- `jsonwebtoken@^9.x.x` - JWT token generation and verification

## Removing Hardcoded Credentials

All hardcoded admin credentials have been removed:
- ❌ `ADMIN_USERNAME` environment variable usage removed
- ❌ `ADMIN_EMAIL` environment variable usage removed
- ❌ `ADMIN_PASSWORD` environment variable usage removed
- ✅ All replaced with database-driven authentication

## Migration Guide

If you have existing admin users in the database:
1. Make sure they have `role = 'admin'` and `is_admin = TRUE`
2. Their passwords need to be hashed with bcrypt before login will work
3. You can rehash existing passwords by running a migration script

## Support & Troubleshooting

### "Login failed" Error
- Check if admin user exists in database: `SELECT * FROM users WHERE role='admin'`
- Verify password is correct
- Check console for detailed error messages

### Token Verification Failed
- Token may have expired
- Logout and log back in
- Check JWT_SECRET in environment matches backend

### CORS Error on Admin Verify
- Ensure backend server is running
- Check CORS headers include "Authorization"
- Verify token is being sent correctly

## Notes

- Default JWT expiry is 7 days, adjust JWT_EXPIRY environment variable to change
- Password hashing uses 10 salt rounds (secure but computationally expensive)
- Token stored in localStorage is accessible to JavaScript (XSS vulnerability)
- Consider HTTPS in production for token transmission
