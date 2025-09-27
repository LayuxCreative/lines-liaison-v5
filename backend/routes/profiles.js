const express = require('express');
const supabaseService = require('../services/supabaseService');

const router = express.Router();

// GET /api/profiles
router.get('/', async (req, res, next) => {
  try {
    const profiles = await supabaseService.getAllProfiles();
    
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profiles',
      details: error.message
    });
  }
});

// GET /api/profiles/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const profile = await supabaseService.getProfile(id);
    
    res.json({
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(404).json({
      error: 'Profile not found',
      details: error.message
    });
  }
});

module.exports = router;