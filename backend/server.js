const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import route handlers
const userRoutes = require('./routes/userRoutes');
const workshopRoutes = require('./routes/workshopRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

// Initialize express application
const app = express();

// Connect to MongoDB
connectDB();

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check and root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Workshop Registration System API is running'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Workshop Registration Backend'
  });
});

// Mount API Routes
app.use('/api/users', userRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/registrations', registrationRoutes);

// Fallback & Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`💥 Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
