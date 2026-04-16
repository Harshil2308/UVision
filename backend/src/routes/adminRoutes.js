const express = require('express');
const {
  getAdminSummary,
  getAdminUsers,
  getRecentUvLogs,
  triggerRecalculation
} = require('../controllers/adminController');

const router = express.Router();

router.get('/summary', getAdminSummary);
router.get('/users', getAdminUsers);
router.get('/uv-logs', getRecentUvLogs);
router.post('/recalculate', triggerRecalculation);

module.exports = router;
