const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

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
