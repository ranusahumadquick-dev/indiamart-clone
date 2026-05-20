const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Registration endpoint working'
  });
});

router.post('/login', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Login endpoint working'
  });
});

module.exports = router;