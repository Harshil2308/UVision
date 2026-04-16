const express = require('express');
const { getLatestUv, getUvHistory } = require('../controllers/uvController');

const router = express.Router();

router.get('/latest', getLatestUv);
router.get('/history', getUvHistory);

module.exports = router;
