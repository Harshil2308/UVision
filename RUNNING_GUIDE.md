# UVision Running Guide

This guide explains exactly what you need to do right now to run and test the current project on your laptop.

It is written for the current project state:

- frontend is built
- backend is built
- MySQL is connected
- Python AI logic is added
- Python UV ingestion is added
- Dataset-based ML training is added
- Arduino support is prepared

Follow the steps in order.

## 1. Current Project Status

Right now, this project can do all of the following:

- Run a frontend in the browser
- Run a Node.js backend
- Connect the backend to MySQL
- Read and write app data from MySQL
- Run AI recommendation logic through Python
- Train an ML model using stored dataset data
- Run a Flask model prediction API
- Insert UV readings through Python simulation mode
- Support real Arduino USB serial input when you are ready

## 2. Before You Start

Make sure these are installed on your laptop:

- Node.js
- npm
- Python
- MySQL Server

You should already be inside this folder:

```text
c:\Users\harsh\Desktop\learn code\UVision
```

## 3. Open The Project Folder

Open PowerShell in:

```text
c:\Users\harsh\Desktop\learn code\UVision
```

You can verify by running:

```powershell
pwd
```

It should show the UVision project folder.

## 4. Check That Node.js And Python Are Installed

Run:

```powershell
node -v
npm -v
python --version
```

Expected result:

- Node.js should show a version
- npm should show a version
- Python should show a version

If any of these fail, install that tool first before continuing.

## 5. Check Your Environment File

Open:

[.env](</c:/Users/harsh/Desktop/learn code/UVision/.env>)

Make sure it contains values like this:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=uvision_db
PYTHON_CMD=python
UV_SERIAL_PORT=COM3
UV_BAUD_RATE=9600
UV_READ_INTERVAL=5
```

Important:

- `DB_PASSWORD` must be your real MySQL password
- `DB_NAME` should stay `uvision_db`
- `UV_SERIAL_PORT` can stay `COM3` for now and can be changed later if Arduino uses another port

## 6. Make Sure MySQL Is Running

If you installed MySQL as a Windows service:

1. Open `Services`
2. Find `MySQL80` or similar
3. Make sure it is running

Or in PowerShell:

```powershell
Get-Service *mysql*
```

Expected result:

- the MySQL service should show as `Running`

If MySQL is not running, start it before continuing.

## 7. Install Node.js Project Dependencies

From the project root, run:

```powershell
npm install
```

Expected result:

- dependencies install without errors

You already installed them earlier, but running this again is safe if needed.

## 8. Install Python Dependencies

Run:

```powershell
pip install -r python/requirements.txt
```

This installs:

- `mysql-connector-python`
- `pyserial`

For ML training and inference you will also need:

- `pandas`
- `scikit-learn`
- `joblib`
- `flask`

These are needed for:

- Python direct MySQL insertion
- Arduino USB serial reading

## 9. Load Or Reload The Database

If this is a fresh setup or you want to reset the project data, load:

- [database/schema.sql](</c:/Users/harsh/Desktop/learn code/UVision/database/schema.sql>)
- [database/seed.sql](</c:/Users/harsh/Desktop/learn code/UVision/database/seed.sql>)

If `mysql` command is available on your laptop, run:

```powershell
mysql -u root -p
```

Then inside MySQL:

```sql
SOURCE c:/Users/harsh/Desktop/learn code/UVision/database/schema.sql;
SOURCE c:/Users/harsh/Desktop/learn code/UVision/database/seed.sql;
USE uvision_db;
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM weather_uv_data;
```

Expected result:

- tables should exist
- demo users should be present
- UV records should be present

If `mysql` command is not recognized, you can:

- use MySQL Workbench
- use MySQL Command Line Client
- or keep using the app since the backend can still connect directly through `.env`

## 10. Start The Backend

Run:

```powershell
npm start
```

Expected result:

```text
UVision backend running on http://localhost:4000
```

Keep this terminal open.

Do not close it while testing the app.

## 11. Test That Backend And MySQL Are Connected

Open these URLs in your browser:

```text
http://localhost:4000/
http://localhost:4000/api/health
```

Expected result for `/api/health`:

- `success: true`
- `api: online`
- `database: connected`

If database shows disconnected:

1. recheck `.env`
2. confirm MySQL is running
3. confirm `DB_USER`, `DB_PASSWORD`, and `DB_NAME`

## 12. Start The Frontend

Open another PowerShell terminal in the same project folder.

Run:

```powershell
python -m http.server 5500
```

Expected result:

- local frontend server starts on port `5500`

Then open:

```text
http://localhost:5500
```

## 13. Login To The App

Open:

```text
http://localhost:5500/pages/auth.html
```

Use one of these demo accounts:

- `aarav@example.com` / `Aarav@123`
- `neha@example.com` / `Neha@123`
- `rohan@example.com` / `Rohan@123`

Expected result:

- login success message
- redirect to dashboard

## 14. What To Test In The Browser Right Now

After login, test these pages:

### Dashboard

Open:

```text
http://localhost:5500/pages/dashboard.html
```

Check:

- current UV is visible
- recommendation summary is visible
- exposure history loads
- charts render

### Profile

Open:

```text
http://localhost:5500/pages/profile.html
```

Check:

- profile loads from backend
- you can edit and save fields

### Tracker

Open:

```text
http://localhost:5500/pages/tracker.html
```

Check:

- submit a manual exposure log
- save should succeed
- daily summary should update

### Health

Open:

```text
http://localhost:5500/pages/health.html
```

Check:

- lab history loads
- chart renders
- saving a new lab value works

### Admin

Open:

```text
http://localhost:5500/pages/admin.html
```

Check:

- user count loads
- UV log count loads
- recent UV logs load
- recalculation button works

### AI Recommendation

Open:

```text
http://localhost:5500/pages/ai-recommendation.html
```

Check:

- enter UV index and exposure duration
- click `Run Prediction`
- result should be returned
- result should also be stored in database through backend

## 15. API Routes You Can Test Manually

If you want to verify APIs one by one, test these:

```text
GET  http://localhost:4000/api/health
GET  http://localhost:4000/api/uv/latest
GET  http://localhost:4000/api/uv/history?limit=5
GET  http://localhost:4000/api/users/1
GET  http://localhost:4000/api/exposure?userId=1
GET  http://localhost:4000/api/health-data/lab-results/1
GET  http://localhost:4000/api/admin/summary
GET  http://localhost:4000/api/admin/users
GET  http://localhost:4000/api/admin/uv-logs?limit=5
GET  http://localhost:4000/api/recommendations/latest/1
POST http://localhost:4000/api/recommendations/calculate/1
POST http://localhost:4000/api/admin/recalculate
```

## 16. Dataset-Based ML Model Training

The project now includes a separate ML flow in:

- [python/ml/train_model.py](</c:/Users/harsh/Desktop/learn code/UVision/python/ml/train_model.py>)
- [python/ml/app.py](</c:/Users/harsh/Desktop/learn code/UVision/python/ml/app.py>)

Current code behavior:

1. A dataset is loaded into MySQL
2. Training script reads from the MySQL table:
   - `indianweatherrepository`
3. The target column is:
   - `uv_index`
4. The model uses these feature columns:
   - `temperature_celsius`
   - `humidity`
   - `wind_kph`
   - `pressure_mb`
   - `cloud`
   - `feels_like_celsius`
   - `visibility_km`
5. Model used:
   - `RandomForestRegressor`
6. Saved model file:
   - `uv_model.pkl`

### How To Train The ML Model

After your dataset is loaded into MySQL table `indianweatherrepository`, run:

```powershell
python python/ml/train_model.py
```

Expected result:

- model training completes
- R2 Score and MAE are printed
- `uv_model.pkl` is created

### How To Run The Flask ML Prediction API

Run:

```powershell
python python/ml/app.py
```

Expected result:

- Flask server starts on port `5000`

Then test:

```text
http://localhost:5000/
```

### Current ML Prediction Input Fields

The Flask prediction API expects JSON with:

- `temperature`
- `humidity`
- `wind_kph`
- `pressure`
- `cloud`
- `feels_like`
- `visibility`

## 17. Run Python UV Ingestion Without Arduino

Before using real hardware, test the UV pipeline in simulation mode.

Run:

```powershell
python python/iot/uv_serial_reader.py --mode simulate --max-reads 5
```

Or:

```powershell
npm run uv:simulate
```

Expected result:

- Python prints simulated UV values
- new rows are inserted into `weather_uv_data`
- dashboard and `/api/uv/latest` should show updated data

This is the safest first test before connecting Arduino.

## 18. When To Connect Arduino To Your Laptop

Connect the Arduino only when all of these are already working:

1. MySQL is running
2. backend is running
3. frontend can load
4. simulation mode worked at least once

Do not connect Arduino as your first test.

First confirm the software stack works without hardware.

## 19. What To Do Right Before Connecting Arduino

Before plugging in Arduino:

1. Make sure your Arduino sketch is ready
2. Make sure it sends UV sensor values using `Serial.println(...)`
3. Make sure the baud rate in the sketch matches `.env`
4. Make sure you know which COM port it will use

Current project default:

- Port: `COM3`
- Baud: `9600`

If your Arduino uses another COM port, update:

[.env](</c:/Users/harsh/Desktop/learn code/UVision/.env>)

or pass it directly in the command later.

## 20. How To Test Arduino With Serial Monitor First

After plugging Arduino into the laptop:

1. Open Arduino IDE
2. Select the correct board
3. Select the correct COM port
4. Upload the sketch
5. Open Serial Monitor
6. Confirm numbers are being printed continuously

Expected result:

- you should see UV sensor values coming in line by line

If you do not see values here, do not continue to the Python serial reader yet.
Fix the Arduino sketch or wiring first.

## 21. Important: Close Serial Monitor Before Running Python Serial Reader

Only one program can use the COM port at a time.

That means:

- if Arduino Serial Monitor is open, Python cannot read the port
- if Python is reading the port, Arduino Serial Monitor should be closed

So the order is:

1. Open Serial Monitor
2. Confirm values
3. Close Serial Monitor
4. Run Python serial reader

## 22. How To Run Real Arduino UV Ingestion

Once Arduino is plugged in, sketch uploaded, and Serial Monitor test passed:

Run:

```powershell
python python/iot/uv_serial_reader.py --mode serial --port COM3 --baud 9600
```

If your Arduino uses another COM port, replace `COM3`.

Expected result:

- Python prints incoming serial readings
- each reading is inserted into `weather_uv_data`
- `/api/uv/latest` updates
- dashboard live UV updates

## 23. What To Check If Arduino Serial Mode Fails

If serial mode does not work, check these one by one:

1. Arduino is properly connected by USB
2. USB cable supports data, not charging only
3. Correct COM port is selected
4. Baud rate matches the Arduino sketch
5. Serial Monitor is closed
6. UV sensor values are actually being printed by the sketch
7. `pyserial` is installed

## 24. Recommended Full Test Order Right Now

This is the best exact order for you to follow now:

1. Open project folder in PowerShell
2. Run `node -v`, `npm -v`, `python --version`
3. Confirm `.env` is correct
4. Make sure MySQL is running
5. Run `npm install`
6. Run `pip install -r python/requirements.txt`
7. Load schema and seed if needed
8. Run `npm start`
9. Open `http://localhost:4000/api/health`
10. Run `python -m http.server 5500`
11. Open `http://localhost:5500/pages/auth.html`
12. Log in with a demo user
13. Test dashboard, tracker, health, profile, admin, and AI pages
14. Load dataset into MySQL table `indianweatherrepository`
15. Train the ML model with `python python/ml/train_model.py`
16. Run Flask ML API if you want model-based prediction testing
17. Run UV simulation mode
18. Confirm UV data updates in API and dashboard
19. Only then plug in Arduino
20. Upload Arduino sketch
21. Check Serial Monitor
22. Close Serial Monitor
23. Run real serial ingestion

## 25. Files Most Important Right Now

These are the files you are most likely to use at this stage:

- [index.html](</c:/Users/harsh/Desktop/learn code/UVision/index.html>)
- [assets/js/app.js](</c:/Users/harsh/Desktop/learn code/UVision/assets/js/app.js>)
- [backend/server.js](</c:/Users/harsh/Desktop/learn code/UVision/backend/server.js>)
- [backend/src/config/db.js](</c:/Users/harsh/Desktop/learn code/UVision/backend/src/config/db.js>)
- [python/iot/uv_serial_reader.py](</c:/Users/harsh/Desktop/learn code/UVision/python/iot/uv_serial_reader.py>)
- [python/ai/recommendation_engine.py](</c:/Users/harsh/Desktop/learn code/UVision/python/ai/recommendation_engine.py>)
- [python/ml/train_model.py](</c:/Users/harsh/Desktop/learn code/UVision/python/ml/train_model.py>)
- [python/ml/app.py](</c:/Users/harsh/Desktop/learn code/UVision/python/ml/app.py>)
- [database/schema.sql](</c:/Users/harsh/Desktop/learn code/UVision/database/schema.sql>)
- [database/seed.sql](</c:/Users/harsh/Desktop/learn code/UVision/database/seed.sql>)
- [.env](</c:/Users/harsh/Desktop/learn code/UVision/.env>)

## 26. Current Known Good State

The current verified working flow is:

- backend connects to MySQL
- seeded users load
- profile, health, admin, dashboard, tracker, and AI pages use backend APIs
- AI recalculation works through Python
- UV simulation mode inserts readings into MySQL
- dataset-based ML training files are present in the project

The only major step left for live hardware validation is:

- real Arduino serial input over USB

## 27. Important Notes

- Passwords are currently stored as plain text for this project stage
- UV simulation mode is the best first test
- Real Arduino testing should be done only after the app works without hardware
- Keep backend terminal open while testing frontend
- Keep frontend local server terminal open while browsing pages
