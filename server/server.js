const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const socketService = require('./services/socketService');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize real-time updates via Socket.IO
socketService.init(server);

// Connect to MongoDB Database
connectDB().then(async () => {
  try {
    const ParkingFacility = require('./models/ParkingFacility');
    const count = await ParkingFacility.countDocuments();
    if (count === 0) {
      console.log('\x1b[33m[Autoseed] Database is empty. Seeding demo parking slots and credentials...\x1b[0m');
      const { seedData } = require('./seed');
      await seedData();
    }
  } catch (err) {
    console.log('[Autoseed Warning] Mongoose is disconnected or seeding failed. Operations will continue, but data might be empty.');
  }
});

// Middleware
app.use(cors({ origin: '*' })); // Enable CORS for development
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.originalUrl}`);
  next();
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const violationRoutes = require('./routes/violationRoutes');
const evRoutes = require('./routes/evRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/ev', evRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('\x1b[31m[Server Error]\x1b[0m', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\x1b[32m[Server Running] Express + Socket.IO server active on port: ${PORT}\x1b[0m`);
});
