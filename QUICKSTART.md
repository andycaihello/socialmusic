# Quick Start Guide

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed
- Git (optional)

## Setup Instructions

### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Database is already initialized, but if you need to reset:
# rm -rf instance migrations
# flask db init
# flask db migrate -m "Initial migration"
# flask db upgrade

# Start the server
python run.py
```

Backend will be running at: **http://localhost:5000**

### 2. Frontend Setup (3 minutes)

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Dependencies are already installed, but if needed:
# npm install

# Start the development server
npm run dev
```

Frontend will be running at: **http://localhost:5173**

### 3. Test the Application

1. Open your browser to **http://localhost:5173**
2. Click **"Register now"**
3. Fill in the registration form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click **"Register"**
5. You'll be automatically logged in and redirected to the home page
6. You should see: "Welcome to SocialMusic" with your user info

### 4. Test Login

1. Click logout (when implemented) or clear localStorage in browser DevTools
2. Go to **http://localhost:5173/login**
3. Login with:
   - Email or Username: `test@example.com` or `testuser`
   - Password: `password123`
4. You'll be redirected to the home page

## Using the Start Scripts

### Backend
```bash
cd backend
./start.sh
```

### Frontend
```bash
cd frontend
./start.sh
```

## API Testing with curl

### Register a user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
```

### Get current user (replace TOKEN with your access_token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Health check
```bash
curl http://localhost:5000/health
```

## Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
# Change port in backend/run.py or set environment variable
export PORT=5001
python run.py
```

**Database errors:**
```bash
# Reset database
rm -rf instance
flask db upgrade
```

**Module not found:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# Vite will automatically use next available port
# Or specify port in vite.config.js
```

**Dependencies issues:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API connection errors:**
- Make sure backend is running on port 5000
- Check `.env` file has correct `VITE_API_URL`
- Check browser console for CORS errors

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=sqlite:///socialmusic.db
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=86400
JWT_REFRESH_TOKEN_EXPIRES=604800
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=dev-flask-secret-key
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## Development Tips

### Backend
- SQLAlchemy query logging is enabled in development mode
- Check `backend/instance/socialmusic.db` for the database file
- Use Flask shell for database operations: `flask shell`

### Frontend
- React DevTools extension recommended
- Redux DevTools extension recommended
- Hot Module Replacement (HMR) is enabled
- Check browser console for errors

## Next Steps

After confirming Phase 1 works:
1. Implement Phase 2: User profile management
2. Implement Phase 3: Music and social features
3. Implement Phase 4: Interaction features
4. Implement Phase 5: Behavior logging
5. Implement Phase 6: Recommendations
6. Implement Phase 7: Optimization and deployment

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Check PHASE1_SUMMARY.md for implementation details
3. Review the plan document (prompt.txt)

## Success Indicators

✅ Backend starts without errors
✅ Frontend starts without errors
✅ Can register a new user
✅ Can login with credentials
✅ Protected routes redirect to login when not authenticated
✅ Home page shows user information when logged in
✅ Token refresh works automatically (test by waiting 24h or manually expiring token)

Enjoy building your social music platform! 🎵
