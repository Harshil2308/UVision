const { pool } = require('../config/db');
const { calculateAndStoreRecommendation } = require('../services/recommendationService');

async function getLatestRecommendation(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.query(
      `SELECT id, user_id, recommended_time_start, recommended_time_end,
              duration_minutes, expected_vitamin_d, risk_level, created_at
       FROM recommendations
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      data: rows[0] || null
    });
  } catch (error) {
    next(error);
  }
}

async function calculateRecommendation(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const result = await calculateAndStoreRecommendation(userId, {
      exposureDuration: req.body?.exposure_duration || null,
      uvIndexOverride: req.body?.uv_index_override ?? null,
      skinTypeOverride: req.body?.skin_type_override || null,
      lifestyleOverride: req.body?.lifestyle_override || null
    });

    res.json({
      success: true,
      message: 'Recommendation recalculated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLatestRecommendation,
  calculateRecommendation
};
