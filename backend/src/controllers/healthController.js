const { testDatabaseConnection } = require('../config/db');

async function getHealthStatus(req, res) {
  try {
    await testDatabaseConnection();
    res.json({
      success: true,
      message: 'Backend and database connection are working',
      services: {
        api: 'online',
        database: 'connected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      services: {
        api: 'online',
        database: 'disconnected'
      },
      error: error.message
    });
  }
}

module.exports = {
  getHealthStatus
};
