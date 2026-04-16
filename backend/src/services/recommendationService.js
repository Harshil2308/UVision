const { pool } = require('../config/db');
const { runPythonScript } = require('../utils/pythonRunner');

async function getUserForRecommendation(userId) {
  const [rows] = await pool.query(
    `SELECT id, name, skin_type, lifestyle
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  if (!rows.length) {
    throw new Error('User not found');
  }

  return rows[0];
}

async function getLatestUvIndex() {
  const [rows] = await pool.query(
    `SELECT uv_index
     FROM weather_uv_data
     ORDER BY recorded_at DESC
     LIMIT 1`
  );

  return rows.length ? Number(rows[0].uv_index) : 5.0;
}

async function calculateAndStoreRecommendation(userId, options = {}) {
  const { exposureDuration = null, uvIndexOverride = null, skinTypeOverride = null, lifestyleOverride = null } = options;
  const user = await getUserForRecommendation(userId);
  const uvIndex = uvIndexOverride !== null && uvIndexOverride !== undefined
    ? Number(uvIndexOverride)
    : await getLatestUvIndex();

  const result = await runPythonScript('python/ai/recommendation_engine.py', {
    uv_index: uvIndex,
    skin_type: skinTypeOverride || user.skin_type,
    lifestyle: lifestyleOverride || user.lifestyle,
    exposure_duration: exposureDuration
  });

  const [estimationInsert] = await pool.query(
    `INSERT INTO vitamin_d_estimation (user_id, uv_index, exposure_time, estimated_vitamin_d, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [userId, result.uv_index, result.exposure_duration, result.estimated_vitamin_d]
  );

  const [recommendationInsert] = await pool.query(
    `INSERT INTO recommendations
     (user_id, recommended_time_start, recommended_time_end, duration_minutes, expected_vitamin_d, risk_level, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      userId,
      result.recommended_time_start,
      result.recommended_time_end,
      result.safe_duration,
      result.expected_vitamin_d,
      result.risk_level
    ]
  );

  return {
    user,
    calculation: result,
    estimationId: estimationInsert.insertId,
    recommendationId: recommendationInsert.insertId
  };
}

module.exports = {
  calculateAndStoreRecommendation
};
