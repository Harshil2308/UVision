# Backend Setup

This folder contains the first Node.js backend scaffold for UVision.

## What Is Included

- Express server
- MySQL connection pool
- Health check route
- Basic auth routes
- UV data routes
- Exposure log routes
- Recommendation route
- Python-powered AI recommendation calculation
- Python UV serial/simulation ingestion support

## Folder Structure

```text
backend/
|-- server.js
`-- src/
    |-- config/
    |   `-- db.js
    |-- controllers/
    |   |-- adminController.js
    |   |-- authController.js
    |   |-- exposureController.js
    |   |-- healthDataController.js
    |   |-- healthController.js
    |   |-- recommendationController.js
    |   |-- userController.js
    |   `-- uvController.js
    `-- routes/
        |-- adminRoutes.js
        |-- authRoutes.js
        |-- exposureRoutes.js
        |-- healthDataRoutes.js
        |-- healthRoutes.js
        |-- recommendationRoutes.js
        |-- userRoutes.js
        `-- uvRoutes.js
```

## Demo Login Passwords

- `aarav@example.com` -> `Aarav@123`
- `neha@example.com` -> `Neha@123`
- `rohan@example.com` -> `Rohan@123`

## Important Note

- Passwords are currently stored as plain text for this project stage.
- If you already imported the old seed data, run the seed file again or update the `users` table passwords manually.

## Main API Routes

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/users/:userId`
- `PUT /api/users/:userId`
- `GET /api/uv/latest`
- `GET /api/uv/history?limit=50`
- `GET /api/exposure?userId=1`
- `POST /api/exposure`
- `GET /api/recommendations/latest/1`
- `GET /api/health-data/lab-results/:userId`
- `POST /api/health-data/lab-results`
- `GET /api/admin/summary`
- `GET /api/admin/users`
- `GET /api/admin/uv-logs?limit=10`
- `POST /api/admin/recalculate`
- `POST /api/recommendations/calculate/:userId`
