const { pool } = require('../config/db');

async function getUserProfile(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.query(
      `SELECT id, name, email, age, gender, skin_type, lifestyle, vitamin_d_level, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserProfile(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const {
      name,
      email,
      age,
      gender,
      skin_type,
      lifestyle,
      vitamin_d_level
    } = req.body;

    await pool.query(
      `UPDATE users
       SET name = ?, email = ?, age = ?, gender = ?, skin_type = ?, lifestyle = ?, vitamin_d_level = ?
       WHERE id = ?`,
      [name, email, age, gender, skin_type, lifestyle, vitamin_d_level || null, userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile
};
