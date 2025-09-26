# Untangle Platform

A comprehensive lifestyle management platform with backend, web, and mobile applications.

## Project Structure

```
untangle-platform/
├── backend/          # Node.js/Express API server
├── web/             # React web application  
├── mobile/          # Expo React Native mobile app
├── shared/          # Shared types, utilities, constants
├── docs/            # Documentation
└── package.json     # Root package.json for scripts
```

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run setup
   ```

2. **Start all services in development:**
   ```bash
   npm run dev
   ```

3. **Start individual services:**
   ```bash
   npm run dev:backend    # Backend API (port 5000)
   npm run dev:web        # Web app (port 3000)
   npm run dev:mobile     # Mobile web (port 8081)
   ```

## Individual Services

### Backend (Lyfe API)
- **Location:** `backend/`
- **Tech:** Node.js, Express, MongoDB, JWT
- **Port:** 5000
- **Commands:**
  ```bash
  cd backend
  npm install
  npm run dev
  ```

### Web Application
- **Location:** `web/`
- **Tech:** React, Tailwind CSS, React Query
- **Port:** 3000
- **Commands:**
  ```bash
  cd web
  npm install
  npm run dev
  ```

### Mobile Application
- **Location:** `mobile/`
- **Tech:** Expo React Native, TypeScript
- **Commands:**
  ```bash
  cd mobile
  npm install
  npm run web      # Web version
  npm run ios      # iOS simulator
  npm run android  # Android emulator
  ```

## Shared Resources

- **Types:** `shared/types/` - TypeScript interfaces
- **API:** `shared/api/` - Shared API utilities
- **Constants:** `shared/constants/` - Shared constants

## Development Workflow

1. **Backend changes:** Modify `backend/` code
2. **Web changes:** Modify `web/` code  
3. **Mobile changes:** Modify `mobile/` code
4. **Shared changes:** Modify `shared/` code (affects all apps)

## Environment Setup

### Backend Environment
Create `backend/.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/untangle
JWT_SECRET=your-super-secret-jwt-key-here
```

### Mobile Environment
Update `mobile/app.json` → `expo.extra.apiBaseUrl` to point to your backend URL.

## CORS Configuration

The backend needs CORS configured for web/mobile access:

```javascript
// In backend/server/index.js
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Deployment

- **Backend:** Deploy to Railway, Heroku, or similar
- **Web:** Deploy to Vercel, Netlify, or similar  
- **Mobile:** Build with Expo and publish to app stores

## Contributing

1. Make changes in respective directories
2. Test locally with `npm run dev`
3. Commit changes with descriptive messages
4. Push to main branch

## Troubleshooting

- **CORS errors:** Ensure backend CORS is configured
- **Port conflicts:** Check if ports 3000, 5000, 8081 are available
- **Dependencies:** Run `npm run install:all` to reinstall everything
