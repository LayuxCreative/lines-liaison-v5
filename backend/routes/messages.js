const express = require('express');
const UserSupabaseService = require('../services/userSupabaseService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages - with optional projectId query parameter
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.query;
    
    let messages;
    if (projectId) {
      messages = await UserSupabaseService.getMessages(req.userSupabase, projectId);
    } else {
      messages = await UserSupabaseService.getAllMessages(req.userSupabase);
    }
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messages
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, project_id, recipient_id } = req.body;
    
    if (!content || !project_id) {
      return res.status(400).json({ error: 'Content and project ID are required' });
    }

    const messageData = {
      content,
      project_id,
      sender_id: req.user.id,
      recipient_id
    };
    
    const message = await UserSupabaseService.createMessage(req.userSupabase, messageData);
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

module.exports = router;