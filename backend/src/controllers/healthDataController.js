const { pool } = require('../config/db');

async function getLabResults(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.query(
      `SELECT id, user_id, test_date, vitamin_d_value, notes, created_at
       FROM vitamin_d_lab_results
       WHERE user_id = ?
       ORDER BY test_date ASC`,
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

async function createLabResult(req, res, next) {
  try {
    const { user_id, test_date, vitamin_d_value, notes } = req.body;

    if (!user_id || !test_date || vitamin_d_value === undefined || vitamin_d_value === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required lab result fields'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO vitamin_d_lab_results (user_id, test_date, vitamin_d_value, notes)
       VALUES (?, ?, ?, ?)`,
      [user_id, test_date, vitamin_d_value, notes || null]
    );

    await pool.query(
      `UPDATE users
       SET vitamin_d_level = ?
       WHERE id = ?`,
      [vitamin_d_value, user_id]
    );

    res.status(201).json({
      success: true,
      message: 'Lab result saved successfully',
      labResultId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLabResults,
  createLabResult
};
