const express = require('express');
const supabaseService = require('../services/supabaseService');
const UserSupabaseService = require('../services/userSupabaseService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks - with query parameters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { projectId, assigneeId } = req.query;
    
    let tasks;
    if (projectId) {
      tasks = await UserSupabaseService.getTasks(req.userSupabase, projectId);
    } else if (assigneeId) {
      // Ensure user can only access their own tasks
      if (assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      tasks = await UserSupabaseService.getTasksByAssignee(req.userSupabase, assigneeId);
    } else {
      tasks = await UserSupabaseService.getAllTasks(req.userSupabase);
    }
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const tasks = await UserSupabaseService.getTasks(req.userSupabase, projectId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:taskId - Get single task
router.get('/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await UserSupabaseService.getTask(req.userSupabase, taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, project_id, status, priority, assignee_id } = req.body;
    
    console.log('Task creation request:', {
      body: req.body,
      user: req.user
    });
    
    if (!title || !project_id) {
      return res.status(400).json({ error: 'Title and project ID are required' });
    }

    const taskData = {
      title,
      description: description || '',
      project_id,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee_id: assignee_id || req.user.id,
      created_by: req.user.id
    };

    console.log('Final task data:', taskData);

    const task = await UserSupabaseService.createTask(req.userSupabase, taskData);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

module.exports = router;