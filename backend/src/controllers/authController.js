const { pool } = require('../config/db');

async function signup(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      skin_type,
      lifestyle
    } = req.body;

    if (!name || !email || !password || !age || !gender || !skin_type || !lifestyle) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, age, gender, skin_type, lifestyle)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, password, age, gender, skin_type, lifestyle]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const [users] = await pool.query(
      'SELECT id, name, email, password, skin_type, lifestyle FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        skin_type: user.skin_type,
        lifestyle: user.lifestyle
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  login
};
