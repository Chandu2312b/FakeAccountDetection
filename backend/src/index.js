import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import accountsRouter from './routes/accounts.js';
import analyticsRouter from './routes/analytics.js';
import reportsRouter from './routes/reports.js';
// import adminRouter from './routes/admin.js';
import uploadRouter from './routes/upload.js';
import simulateRouter from './routes/simulate.js';
import mlRouter from './routes/ml.js';

dotenv.config();

const app = express();

// Basic middleware for JSON parsing, CORS (for local frontend), and request logging
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// API routes
app.use('/api/accounts', accountsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reports', reportsRouter);
// app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/ml', mlRouter);

// Start server after DB connects
const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
});



