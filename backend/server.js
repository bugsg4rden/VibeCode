require('dotenv').config();
const express = require('express');
const cors = require('cors');

const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const submissionsRoutes = require('./routes/submissions');
const boardsRoutes = require('./routes/boards');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
const extractRoutes = require('./routes/extract');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/extract-image', extractRoutes);

// Error handler
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
