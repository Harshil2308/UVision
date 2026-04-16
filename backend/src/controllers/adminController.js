const { pool } = require('../config/db');
const { calculateAndStoreRecommendation } = require('../services/recommendationService');

function getVitaminStatus(value) {
  const numeric = Number(value || 0);
  if (numeric >= 30) {
    return 'Healthy';
  }
  if (numeric >= 20) {
    return 'Needs follow-up';
  }
  return 'Deficient';
}

async function getAdminSummary(req, res, next) {
  try {
    const [[userCountRow], [uvLogsRow], [latestRecommendationRow]] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total_users FROM users'),
      pool.query('SELECT COUNT(*) AS total_uv_logs FROM weather_uv_data'),
      pool.query('SELECT MAX(created_at) AS last_recommendation_time FROM recommendations')
    ]);

    res.json({
      success: true,
      data: {
        total_users: userCountRow[0].total_users,
        total_uv_logs: uvLogsRow[0].total_uv_logs,
        last_recommendation_time: latestRecommendationRow[0].last_recommendation_time
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminUsers(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, skin_type, lifestyle, vitamin_d_level
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        status: getVitaminStatus(row.vitamin_d_level)
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getRecentUvLogs(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const [rows] = await pool.query(
      `SELECT id, uv_value, uv_index, recorded_at
       FROM weather_uv_data
       ORDER BY recorded_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

async function triggerRecalculation(req, res, next) {
  try {
    const [users] = await pool.query('SELECT id FROM users ORDER BY id ASC');
    const results = [];

    for (const user of users) {
      const result = await calculateAndStoreRecommendation(user.id, {});
      results.push({
        userId: user.id,
        riskLevel: result.calculation.risk_level,
        expectedVitaminD: result.calculation.expected_vitamin_d
      });
    }

    res.json({
      success: true,
      message: 'AI recalculation completed successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminSummary,
  getAdminUsers,
  getRecentUvLogs,
  triggerRecalculation
};
