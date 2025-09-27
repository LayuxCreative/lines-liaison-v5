const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabaseService = require('../services/supabaseService');
const UserSupabaseService = require('../services/userSupabaseService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for local file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Determine upload directory based on file type
      let uploadDir = 'uploads/documents'; // default
      
      if (file.mimetype.startsWith('image/')) {
        uploadDir = 'uploads/images';
      } else if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
        uploadDir = 'uploads/media';
      }
      
      // Ensure directory exists
      const fullPath = path.join(__dirname, '..', uploadDir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|mp3|wav/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// GET /api/files/:projectId
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const files = await UserSupabaseService.getFiles(req.userSupabase, projectId);
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// POST /api/files/upload - Handle file uploads
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { projectId } = req.body;
    const file = req.file;
    
    // Generate local file URL
    const relativePath = path.relative(path.join(__dirname, '..'), file.path);
    const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
    
    // Save file metadata to database
    const fileData = {
      name: file.originalname,
      url: fileUrl,
      type: file.mimetype,
      size: file.size,
      project_id: projectId || null,
      uploaded_by: req.user.id
    };

    const savedFile = await UserSupabaseService.uploadFile(req.userSupabase, fileData);
    
    res.status(201).json({
      success: true,
      data: {
        id: savedFile.id,
        name: savedFile.name,
        url: savedFile.url,
        size: savedFile.size,
        type: savedFile.type,
        localPath: file.path
      }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      error: 'File upload failed',
      details: error.message
    });
  }
});

// POST /api/files - Create file record (existing endpoint)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, url, type, size, project_id } = req.body;
    
    if (!name || !url || !project_id) {
      return res.status(400).json({ error: 'Name, URL, and project ID are required' });
    }

    const fileData = {
      name,
      url,
      type: type || 'unknown',
      size: size || 0,
      project_id,
      uploaded_by: req.user.id
    };

    const file = await UserSupabaseService.uploadFile(req.userSupabase, fileData);
    res.status(201).json(file);
  } catch (error) {
    console.error('Error creating file record:', error);
    res.status(500).json({ error: 'Failed to create file record' });
  }
});

module.exports = router;