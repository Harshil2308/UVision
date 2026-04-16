const { pool } = require('../config/db');

async function getLatestUv(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, uv_value, uv_index, recorded_at FROM weather_uv_data ORDER BY recorded_at DESC LIMIT 1'
    );

    res.json({
      success: true,
      data: rows[0] || null
    });
  } catch (error) {
    next(error);
  }
}

async function getUvHistory(req, res, next) {
  try {
    const limit = Number(req.query.limit || 50);
    const [rows] = await pool.query(
      'SELECT id, uv_value, uv_index, recorded_at FROM weather_uv_data ORDER BY recorded_at DESC LIMIT ?',
      [limit]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLatestUv,
  getUvHistory
};
