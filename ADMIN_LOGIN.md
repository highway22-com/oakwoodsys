# Admin Login System

## Overview

This application includes an admin login system with authentication stored in a file-based JSON database. The system supports three default users: `admin`, `luis`, and `jason`.

## Default Credentials

All users have the same default password:

- **Username**: `admin`, `luis`, or `jason`
- **Password**: `password123`

**⚠️ Important**: Change these passwords in production!

## Access

Navigate to `/admin/login` to access the login page.

## Architecture

### Frontend (Angular)

- **Component**: `src/pages/login/login.ts`
- **Route**: `/admin/login`
- **Features**:
  - Form validation
  - Loading states
  - Error handling
  - Token storage in localStorage

### Backend (Netlify Function)

- **Function**: `.netlify/functions/auth/index.mjs`
- **Storage**: File-based JSON (`/tmp/admin-data/users.json` on Netlify, `.netlify/data/users.json` locally)
- **Features**:
  - User authentication
  - Token generation
  - CORS support

## Database Structure

The users are stored in a JSON file with the following structure:

```json
[
  {
    "id": 1,
    "username": "admin",
    "password": "<hashed_password>",
    "created_at": "2025-12-30T..."
  },
  {
    "id": 2,
    "username": "luis",
    "password": "<hashed_password>",
    "created_at": "2025-12-30T..."
  },
  {
    "id": 3,
    "username": "jason",
    "password": "<hashed_password>",
    "created_at": "2025-12-30T..."
  }
]
```

## Security Notes

1. **Password Hashing**: Currently uses base64 encoding (simple). In production, use bcrypt or similar.
2. **Token Generation**: Uses base64-encoded JSON. In production, use JWT.
3. **Storage**: File-based storage is suitable for development. For production, consider:
   - Supabase
   - PlanetScale
   - MongoDB Atlas
   - AWS DynamoDB

## Local Development

1. The users file will be created automatically at `.netlify/data/users.json` on first login attempt.
2. The function can be tested locally using Netlify CLI:

   ```bash
   netlify dev
   ```

## Production Considerations

1. Use environment variables for sensitive data
2. Implement proper password hashing (bcrypt)
3. Use JWT for token generation
4. Consider using a managed database service
5. Implement rate limiting
6. Add HTTPS enforcement
7. Implement session management
