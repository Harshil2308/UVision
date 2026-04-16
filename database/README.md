# Database Setup

This folder contains the MySQL database setup for the UVision project.

## Files

- `schema.sql`: Creates the database, tables, indexes, and helpful views
- `seed.sql`: Inserts demo data for UI testing and backend development

## Tables Included

- `users`
- `weather_uv_data`
- `exposure_log`
- `vitamin_d_estimation`
- `recommendations`

## Design Notes

- `users.email` is unique to support login
- Passwords are currently stored as plain text strings for this project stage
- UV readings are stored in `weather_uv_data`
- User sunlight sessions are stored in `exposure_log`
- AI or rule-based output is stored in `vitamin_d_estimation`
- Personalized suggestion windows are stored in `recommendations`

## Helpful Views

- `latest_uv_reading`: returns the newest UV reading
- `user_latest_recommendation`: returns the latest recommendation per user

## How To Use

1. Create the database objects:

```sql
SOURCE database/schema.sql;
```

2. Insert demo data:

```sql
SOURCE database/seed.sql;
```

## Suggested Next Integration

- Connect Node.js to `uvision_db`
- Use `weather_uv_data` for dashboard live cards and charts
- Use `exposure_log` for tracker history
- Use `recommendations` for personalized dashboard guidance
