// server.js 
const express = require("express");
const dotenv = require("dotenv").config();
const mongoose = require('mongoose'); // Add mongoose import
const connectDB = require('./database/database');
const cors = require('cors'); // Add CORS middleware
const port = process.env.PORT || 8000;
const adminRoutes = require('./routes/adminRoutes');

// Connect to database
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://headingtonportal.danielesambu.com',
  'https://headingtonportal-frontend.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Add health check route
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: port,
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: dbStatus === 'Connected' ? '✅' : '❌',
      email: process.env.EMAIL_USER ? '✅' : '❌',
      reports: '✅'
    }
  });
});

// API Routes
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/sheets', require('./routes/sheetRoutes'));
app.use('/api/clerks', require('./routes/clerkRoutes'));
app.use('/api/residents', require('./routes/residentRoutes'));
app.use('/api/guests', require("./routes/guestRoutes"));

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const EmailService = require('./utils/emailService');
    const emailService = new EmailService();
    
    const result = await emailService.testEmailConfig();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Email test failed',
      details: error.message 
    });
  }
});

// Initialize jobs
const startJobs = () => {
  try {
    const MonthlyReportJob = require('./jobs/monthlyReportJob');
    const monthlyReportJob = new MonthlyReportJob();
    monthlyReportJob.start();
    
    console.log('Scheduled jobs initialized');
  } catch (error) {
    console.error('Failed to start jobs:', error.message);
  }
};
app.use('/api/admin', adminRoutes);

// Improved error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  const statusCode = err.status || 500;
  
  const errorResponse = {
    success: false,
    message: 'Something went wrong!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };
  
  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    requestedPath: req.originalUrl,
    availableEndpoints: {
      health: 'GET /health',
      guests: {
        list: 'GET /api/guests',
        checkIn: 'PUT /api/guests/checkin/:id',
        checkOut: 'PUT /api/guests/checkout/:id',
        register: 'POST /api/guests/register'
      },
      residents: {
        list: 'GET /api/residents',
        byRoom: 'GET /api/residents/:room',
        register: 'POST /api/residents'
      },
      reports: {
        generate: 'POST /api/reports/generate',
        stats: 'GET /api/reports/stats',
        email: 'POST /api/reports/email'
      }
    }
  });
});

// Start server with error handling
const server = app.listen(port, () => {
  console.log(`
  ========================================
  HEADINGTON HALL VISITOR PORTAL
  ========================================
  Server running on port ${port}
  Environment: ${process.env.NODE_ENV || 'development'}
  
  Health check: http://localhost:${port}/health
  Email test: http://localhost:${port}/api/test-email
  
  API endpoints:
  - GET    /api/guests/allguests
  - POST   /api/guests/register
  - PUT    /api/guests/checkin/:id
  - PUT    /api/guests/checkout/:id
  
  Report endpoints:
  - POST   /api/reports/generate
  - GET    /api/reports/stats
  - POST   /api/reports/email
  
  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
  Email: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}
  ========================================
  `);
  
  // Start scheduled jobs after server is running
  setTimeout(startJobs, 2000);
  
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
     PORT ${port} IS ALREADY IN USE
    
    Try one of these solutions:
    1. Kill the process using port ${port}:
       $ kill -9 $(lsof -t -i:${port})
    
    2. Use a different port:
       Change PORT in .env file or run:
       $ PORT=8001 npm run dev
    
    3. Find and kill the process manually:
       $ lsof -i :${port}
       $ kill -9 <PID>
    `);
    process.exit(1);
  } else {
    console.error('Server startup error:', err.message);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  
  server.close(() => {
    console.log('Server closed.');
    
    // Close database connection
    mongoose.connection.close(false, () => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('Forcing shutdown after timeout...');
    process.exit(1);
  }, 10000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit in development, but log heavily
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app; // For testing