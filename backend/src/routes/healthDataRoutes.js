const express = require('express');
const { getLabResults, createLabResult } = require('../controllers/healthDataController');

const router = express.Router();

router.get('/lab-results/:userId', getLabResults);
router.post('/lab-results', createLabResult);

module.exports = router;
