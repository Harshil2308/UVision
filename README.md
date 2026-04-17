# Sunlight Exposure & Vitamin D Recommendation System

This project is being built step by step as a full-stack web application that combines:

- IoT UV sensor data from Arduino over USB
- A MySQL relational database
- Python-based vitamin D estimation and recommendation logic
- A web dashboard for personalized recommendations

## Current Phase

Phase 1 frontend is complete.
Phase 2 database design has now been added.

Included in this phase:

- Landing page
- Login and signup UI
- Dashboard UI
- Profile page
- Exposure tracker page
- AI recommendation page
- Health tracking page
- Admin panel page
- MySQL schema
- Seed data
- Database setup guide
- Node.js backend scaffold
- MySQL connection configuration
- Initial REST API routes
- Frontend to backend API integration for auth, dashboard, and exposure tracker
- Profile, health, and admin pages connected to backend APIs
- Python UV ingestion scripts
- Python AI recommendation engine
- Dataset-based ML model training pipeline
- Flask ML prediction API
- Shared styling and JavaScript
- Progress tracker
- Detailed run instructions

## Planned Stack

- Frontend: HTML, CSS, Bootstrap, JavaScript
- Backend: Node.js
- Database: MySQL
- IoT Middleware: Python with `pyserial`
- AI Module: Python, scikit-learn, Flask

## Project Structure

```text
UVision/
|-- index.html
|-- pages/
|   |-- dashboard.html
|   |-- auth.html
|   |-- profile.html
|   |-- tracker.html
|   |-- ai-recommendation.html
|   |-- health.html
|   `-- admin.html
|-- assets/
|   |-- css/
|   |   `-- styles.css
|   `-- js/
|       `-- app.js
|-- database/
|   |-- schema.sql
|   |-- seed.sql
|   `-- README.md
|-- backend/
|   |-- server.js
|   |-- README.md
|   `-- src/
|       |-- config/
|       |   `-- db.js
|       |-- controllers/
|       `-- routes/
|-- package.json
|-- .env.example
|-- python/
|   |-- ai/
|   |   `-- recommendation_engine.py
|   |-- iot/
|   |   `-- uv_serial_reader.py
|   |-- ml/
|   |   |-- app.py
|   |   |-- train_model.py
|   |   `-- export_india_uv_training_data.py
|   `-- requirements.txt
|-- dataset/
|-- progress.txt
`-- RUNNING_GUIDE.md
```

## Notes

- The current frontend still uses mock data in the browser, but the MySQL schema is now ready.
- A Node.js backend scaffold has now been added and is ready to connect to your local MySQL setup.
- In the next steps, we can connect the frontend pages to this API, then add the Python UV reader.
- The UI is designed to match the project theme: sunlight, health, alerts, and analytics.

## MySQL Connection On Your Laptop

To use the database locally on Windows:

1. Install MySQL Server if it is not already installed.
2. Make sure the MySQL service is running.
3. Open PowerShell or Command Prompt.
4. Connect using:

```powershell
mysql -u root -p
```

5. Enter your MySQL password when prompted.
6. Run the schema:

```sql
SOURCE c:/Users/harsh/Desktop/learn code/UVision/database/schema.sql;
```

7. Run the seed data:

```sql
SOURCE c:/Users/harsh/Desktop/learn code/UVision/database/seed.sql;
```

8. Check the database:

```sql
USE uvision_db;
SHOW TABLES;
SELECT * FROM users;
```

If the `mysql` command is not recognized, open MySQL Command Line Client or add MySQL `bin` to your system PATH.

## Backend Run Summary

1. Create `.env` from `.env.example`
2. Update MySQL username and password
3. Run `npm install`
4. Start backend with `npm start`
5. Test `http://localhost:4000/api/health`

## Frontend API Integration

The frontend now connects to the backend for:

- Login and signup
- Dashboard UV data
- Latest recommendation data
- Exposure history
- Manual exposure log submission
- Profile load and update
- Health lab result save and trend display
- Admin summary, users, UV logs, and recalculation trigger
- AI recommendation calculation through a Python module

If the backend is not running, the dashboard falls back to demo values so the UI still loads.

## Dataset-Based ML Model

The project now also includes a dataset-based ML pipeline for UV prediction.

Current ML files:

- [python/ml/train_model.py](</c:/Users/harsh/Desktop/learn code/UVision/python/ml/train_model.py>)
- [python/ml/app.py](</c:/Users/harsh/Desktop/learn code/UVision/python/ml/app.py>)

Current ML training flow in code:

1. A CSV dataset is prepared and loaded into MySQL
2. Training data is read from the MySQL table `indianweatherrepository`
3. Features used for training are:
   - `temperature_celsius`
   - `humidity`
   - `wind_kph`
   - `pressure_mb`
   - `cloud`
   - `feels_like_celsius`
   - `visibility_km`
4. Target column is:
   - `uv_index`
5. The model is trained using `RandomForestRegressor`
6. The trained model is saved as `uv_model.pkl`
7. [python/ml/app.py](</c:/Users/harsh/Desktop/learn code/UVision/python/ml/app.py>) exposes a Flask prediction API

This means the project now supports both:

- rule-based recommendation logic for exposure recommendations
- dataset-trained ML prediction for UV estimation

## Demo Login Credentials

After importing `database/seed.sql`, you can use:

- `aarav@example.com` with password `Aarav@123`
- `neha@example.com` with password `Neha@123`
- `rohan@example.com` with password `Rohan@123`

Passwords are currently stored as plain text in the database for the current project stage.

## Next Recommended Step

Run and verify the Python-driven live data flow:

1. Run UV ingestion in simulation mode and confirm DB inserts
2. Test `POST /api/recommendations/calculate/:userId`
3. Connect Arduino serial mode on the correct COM port
4. Connect the trained ML model output with the main application flow
