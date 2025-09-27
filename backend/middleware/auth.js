const { createClient } = require('@supabase/supabase-js');

// Simple session storage (in production, use Redis or database)
const activeSessions = new Map();

/**
 * Auth middleware that extracts JWT from cookies and creates user-specific Supabase client
 */
const authMiddleware = async (req, res, next) => {
  try {
    const sessionToken = req.cookies.session_token;
    
    if (!sessionToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No session token found'
      });
    }
    
    const session = activeSessions.get(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid session token'
      });
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      activeSessions.delete(sessionToken);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session expired'
      });
    }
    
    // Create user-specific Supabase client with JWT
    if (session.supabaseSession && session.supabaseSession.access_token) {
      req.userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          global: {
            headers: {
              Authorization: `Bearer ${session.supabaseSession.access_token}`
            }
          }
        }
      );
    } else {
      // Fallback to anon client if no JWT available
      req.userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );
    }
    
    // Attach user info to request
    req.user = session.user;
    req.session = session;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      details: error.message
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no auth provided
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const sessionToken = req.cookies.session_token;
    
    if (!sessionToken) {
      req.user = null;
      req.userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      return next();
    }
    
    const session = activeSessions.get(sessionToken);
    
    if (!session || new Date() > session.expiresAt) {
      if (session) activeSessions.delete(sessionToken);
      req.user = null;
      req.userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      return next();
    }
    
    // Create user-specific Supabase client
    if (session.supabaseSession && session.supabaseSession.access_token) {
      req.userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          global: {
            headers: {
              Authorization: `Bearer ${session.supabaseSession.access_token}`
            }
          }
        }
      );
    } else {
      req.userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
    
    req.user = session.user;
    req.session = session;
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    req.userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    next();
  }
};

/**
 * Helper function to get or create session storage
 */
const getSessionStorage = () => activeSessions;

/**
 * Helper function to set session
 */
const setSession = (sessionToken, sessionData) => {
  activeSessions.set(sessionToken, sessionData);
};

/**
 * Helper function to delete session
 */
const deleteSession = (sessionToken) => {
  activeSessions.delete(sessionToken);
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  getSessionStorage,
  setSession,
  deleteSession
};