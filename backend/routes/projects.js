const express = require('express');
const supabaseService = require('../services/supabaseService');
const UserSupabaseService = require('../services/userSupabaseService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get projects by user ID
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own projects
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const projects = await UserSupabaseService.getProjects(req.userSupabase, userId);
    res.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('=== CREATE PROJECT DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from middleware:', JSON.stringify(req.user, null, 2));
    console.log('User ID:', req.user?.id);
    
    const { name, client_id, manager_id, description, budget } = req.body;
    
    console.log('Extracted name:', name);
    console.log('Extracted client_id:', client_id);
    console.log('Extracted manager_id:', manager_id);
    
    if (!name) {
      console.log('❌ Name is missing');
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Ensure user can only create projects where they are client or manager
    if (client_id && client_id !== req.user.id && manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const projectData = {
      name,
      client_id: client_id || req.user.id,
      manager_id: manager_id || req.user.id,
      description,
      budget,
      status: 'active'
    };
    
    console.log('Final project data:', JSON.stringify(projectData, null, 2));
    console.log('About to call UserSupabaseService.createProject...');
    
    const project = await UserSupabaseService.createProject(req.userSupabase, projectData);
    
    console.log('Project created successfully:', JSON.stringify(project, null, 2));
    res.status(201).json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

module.exports = router;