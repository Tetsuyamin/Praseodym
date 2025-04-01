const express = require('express');
const router = express.Router();
const { searchContent } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

// 検索API
router.get('/', protect, searchContent);

module.exports = router;