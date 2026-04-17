const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./src/config/db');

dotenv.config();

const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const uvRoutes = require('./src/routes/uvRoutes');
const exposureRoutes = require('./src/routes/exposureRoutes');
const recommendationRoutes = require('./src/routes/recommendationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const healthDataRoutes = require('./src/routes/healthDataRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'UVision backend is running 🚀',
    version: '1.0.0',
    status: 'ACTIVE',
    timestamp: new Date(),
    endpoints: {
      health: '/api/health',
      auth: [
        '/api/auth/signup',
        '/api/auth/login'
      ],
      user: '/api/users/:userId',
      uv: [
        '/api/uv/latest',
        '/api/uv/history'
      ],
      exposure: '/api/exposure',
      recommendations: [
        '/api/recommendations/latest/:userId',
        '/api/recommendations/calculate/:userId'
      ],
      healthData: '/api/health-data/lab-results/:userId',
      admin: '/api/admin/summary'
      ,
      ml: [
        '/api/predict',
        '/api/predict/latest'
      ]
    }
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/uv', uvRoutes);
app.use('/api/exposure', exposureRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health-data', healthDataRoutes);
app.use('/api/admin', adminRoutes);

app.post('/api/predict', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    res.json(data);

  } catch (err) {
    console.error("ML API Error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get('/api/predict/latest', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        location_name,
        region,
        last_updated,
        temperature_celsius,
        humidity,
        wind_kph,
        pressure_mb,
        cloud,
        feels_like_celsius,
        visibility_km
      FROM indianweatherrepository
      ORDER BY last_updated_epoch DESC
      LIMIT 1
    `);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'No ML source data found in indianweatherrepository'
      });
    }

    const latest = rows[0];

    const mlResponse = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temperature: Number(latest.temperature_celsius),
        humidity: Number(latest.humidity),
        wind_kph: Number(latest.wind_kph),
        pressure: Number(latest.pressure_mb),
        cloud: Number(latest.cloud),
        feels_like: Number(latest.feels_like_celsius),
        visibility: Number(latest.visibility_km)
      })
    });

    const prediction = await mlResponse.json();

    if (!mlResponse.ok) {
      return res.status(500).json({
        success: false,
        message: prediction?.error || 'ML service failed to generate prediction'
      });
    }

    res.json({
      success: true,
      data: {
        location_name: latest.location_name,
        region: latest.region,
        last_updated: latest.last_updated,
        uv_prediction: prediction.uv_prediction
      }
    });
  } catch (err) {
    console.error('Latest ML prediction error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`UVision backend running on http://localhost:${PORT}`);
});
