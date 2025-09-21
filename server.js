import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'text/plain', 'text/csv', 'application/json', 'application/octet-stream',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-rar-compressed',
      'video/mp4', 'video/avi', 'video/mov',
      'audio/mp3', 'audio/wav', 'audio/ogg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Store file metadata in memory (in production, use a database)
const fileDatabase = new Map();

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = uuidv4();
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    
    const fileRecord = {
      id: fileId,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      url: fileUrl,
      path: req.file.path,
      filename: req.file.filename,
      uploadedBy: req.body.userId || 'anonymous',
      uploadedAt: new Date().toISOString(),
      projectId: req.body.projectId || null
    };

    // Store in memory database
    fileDatabase.set(fileId, fileRecord);

    res.json({
      success: true,
      file: {
        id: fileId,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: fileUrl,
        path: req.file.path,
        uploadedBy: req.body.userId || 'anonymous',
        uploadedAt: new Date(),
        projectId: req.body.projectId || null
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Multiple files upload endpoint
app.post('/api/upload-multiple', upload.array('files', 10), (req, res) => {
  console.log('Upload-multiple endpoint called');
  console.log('Files received:', req.files ? req.files.length : 0);
  console.log('Body:', req.body);
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => {
      const fileId = uuidv4();
      const fileUrl = `http://localhost:${PORT}/uploads/${file.filename}`;
      
      const fileRecord = {
        id: fileId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: fileUrl,
        path: file.path,
        filename: file.filename,
        uploadedBy: req.body.userId || 'anonymous',
        uploadedAt: new Date().toISOString(),
        projectId: req.body.projectId || null
      };

      // Store in memory database
      fileDatabase.set(fileId, fileRecord);

      return {
        id: fileId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: fileUrl,
        path: file.path,
        uploadedBy: req.body.userId || 'anonymous',
        uploadedAt: new Date(),
        projectId: req.body.projectId || null
      };
    });

    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Get files endpoint
app.get('/api/files', (req, res) => {
  const { userId, projectId } = req.query;
  let files = Array.from(fileDatabase.values());
  
  if (userId) {
    files = files.filter(file => file.uploadedBy === userId);
  }
  
  if (projectId) {
    files = files.filter(file => file.projectId === projectId);
  }
  
  res.json({ files });
});

// Delete file endpoint
app.delete('/api/files/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const file = fileDatabase.get(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete physical file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    // Remove from database
    fileDatabase.delete(fileId);
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health endpoint called from:', req.headers.origin || 'unknown origin');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`File upload server running on port ${PORT}`);
  console.log(`Upload directory: ${uploadsDir}`);
});

export default app;