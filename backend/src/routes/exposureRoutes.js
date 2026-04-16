const express = require('express');
const { getExposureLogs, createExposureLog } = require('../controllers/exposureController');

const router = express.Router();

router.get('/', getExposureLogs);
router.post('/', createExposureLog);

module.exports = router;
