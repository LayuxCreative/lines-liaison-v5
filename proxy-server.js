import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;
const SUPABASE_PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID || 'ymstntjoewkyissepjbc';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Proxy configuration for Supabase
const supabaseProxy = createProxyMiddleware({
  target: SUPABASE_URL,
  changeOrigin: true,
  secure: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Proxy response:', proxyRes.statusCode, req.url);
  }
});

// Use proxy for all Supabase API calls
app.use('/supabase', supabaseProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Supabase proxy server running on http://localhost:${PORT}`);
  console.log(`Proxying requests to: ${SUPABASE_URL}`);
});