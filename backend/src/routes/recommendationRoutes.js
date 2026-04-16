const express = require('express');
const { getLatestRecommendation, calculateRecommendation } = require('../controllers/recommendationController');

const router = express.Router();

router.get('/latest/:userId', getLatestRecommendation);
router.post('/calculate/:userId', calculateRecommendation);

module.exports = router;
