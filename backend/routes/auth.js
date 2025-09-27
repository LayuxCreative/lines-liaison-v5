const express = require('express');
const supabaseService = require('../services/supabaseService');
const { setSession, deleteSession } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const authData = await supabaseService.signIn(email, password);
    
    // Get user profile data from profiles table
    let userProfile;
    try {
      userProfile = await supabaseService.getProfile(authData.user.id);
    } catch (profileError) {
      console.warn('Could not fetch user profile:', profileError);
      userProfile = null;
    }
    
    // Combine auth user with profile data
    const completeUser = {
      id: authData.user.id,
      email: authData.user.email,
      name: userProfile?.full_name || authData.user.user_metadata?.full_name || authData.user.email,
      role: userProfile?.role || authData.user.user_metadata?.role || 'user',
      department: userProfile?.department || null,
      status: userProfile?.status || 'active',
      avatar: userProfile?.avatar_url || null, // Add avatar field for header components
      avatar_url: userProfile?.avatar_url || null,
      created_at: authData.user.created_at,
      updated_at: authData.user.updated_at
    };
    
    // Create session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store session with complete user data and JWT
    setSession(sessionToken, {
      user: completeUser,
      supabaseSession: authData.session, // Store JWT for RLS
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    // Set session cookie
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({
      message: 'Login successful',
      user: completeUser,
      session: authData.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      error: 'Invalid credentials',
      details: error.message
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Email, password, first name, and last name are required'
      });
    }

    const userData = {
      first_name: firstName,
      last_name: lastName,
      role: role || 'user',
      created_at: new Date().toISOString()
    };

    const authData = await supabaseService.signUp(email, password, userData);
    
    res.status(201).json({
      message: 'Registration successful',
      user: authData.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      error: 'Registration failed',
      details: error.message
    });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const sessionToken = req.cookies.session_token;
    
    if (sessionToken) {
      deleteSession(sessionToken);
    }
    
    // Clear session cookie
    res.clearCookie('session_token');
    
    // Call Supabase signOut
    await supabaseService.signOut();
    
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      details: error.message
    });
  }
});

// GET /api/auth/me - Get current user
const { authMiddleware } = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      details: error.message
    });
  }
});

// GET /api/auth/profile/:userId
router.get('/profile/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const profile = await supabaseService.getProfile(userId);
    
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

// PUT /api/auth/profile/:userId
router.put('/profile/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const updatedProfile = await supabaseService.updateProfile(userId, updates);
    
    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      error: 'Profile update failed',
      details: error.message
    });
  }
});

module.exports = router;