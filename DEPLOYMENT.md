# Deployment Guide

## Backend on Render

1. Create a Render Web Service from this repository.
2. Set the root directory to `backend`.
3. Use this build command:

```bash
npm ci
```

4. Use this start command:

```bash
npm run migrate && npm start
```

5. Add these environment variables in Render:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret
BACKEND_URL=https://your-render-backend-url
```

The migration command creates the attendance tables before the server starts.

## Frontend on Vercel

1. Deploy this repository on Vercel.
2. The included `vercel.json` builds the React app from `frontend`.
3. Add this Vercel environment variable:

```bash
REACT_APP_API_URL=https://your-render-backend-url/api
```

## Local Docker

```bash
docker compose up --build
```

The backend container runs migrations before starting the API.
