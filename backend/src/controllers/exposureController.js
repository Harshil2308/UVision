const { pool } = require('../config/db');

async function getExposureLogs(req, res, next) {
  try {
    const userId = Number(req.query.userId || 1);
    const [rows] = await pool.query(
      `SELECT id, user_id, exposure_date, start_time, end_time, duration_minutes,
              body_area_exposed, sunscreen_used, vitamin_d_generated
       FROM exposure_log
       WHERE user_id = ?
       ORDER BY exposure_date DESC, start_time DESC`,
      [userId]
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

async function createExposureLog(req, res, next) {
  try {
    const {
      user_id,
      exposure_date,
      start_time,
      end_time,
      duration_minutes,
      body_area_exposed,
      sunscreen_used,
      vitamin_d_generated
    } = req.body;

    if (!user_id || !exposure_date || !start_time || !end_time || !duration_minutes || !body_area_exposed) {
      return res.status(400).json({
        success: false,
        message: 'Missing required exposure log fields'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO exposure_log
       (user_id, exposure_date, start_time, end_time, duration_minutes, body_area_exposed, sunscreen_used, vitamin_d_generated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        exposure_date,
        start_time,
        end_time,
        duration_minutes,
        body_area_exposed,
        Boolean(sunscreen_used),
        vitamin_d_generated || 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Exposure log created successfully',
      exposureLogId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getExposureLogs,
  createExposureLog
};
