const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const ratingRoutes = require('./routes/ratings');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');
const reportRoutes = require('./routes/reports');
// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { rateLimitMiddleware, generalRateLimiter, chatRateLimiter } = require('./middleware/rateLimit');

// Import services
const notificationService = require('./services/notificationService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Set up notification service with Socket.IO
notificationService.setSocketIO(io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all routes
app.use(rateLimitMiddleware(generalRateLimiter));

// Routes with specific rate limiting
app.use('/api/users', rateLimitMiddleware(generalRateLimiter), userRoutes);
app.use('/api/jobs', rateLimitMiddleware(generalRateLimiter), jobRoutes);
app.use('/api/ratings', rateLimitMiddleware(generalRateLimiter), ratingRoutes);
app.use('/api/chat', rateLimitMiddleware(chatRateLimiter), chatRoutes);
app.use('/api/notifications', rateLimitMiddleware(generalRateLimiter), notificationRoutes);
app.use('/api/profile', rateLimitMiddleware(generalRateLimiter), profileRoutes);
app.use('/api/reports', rateLimitMiddleware(generalRateLimiter), reportRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Juba server is running' });
});

// Socket.io for real-time messaging and notifications
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join user-specific room for notifications
    socket.on('join-user-room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${socket.id} joined user room ${userId}`);
    });
    
    // Leave user-specific room
    socket.on('leave-user-room', (userId) => {
        socket.leave(`user_${userId}`);
        console.log(`User ${socket.id} left user room ${userId}`);
    });
    
    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation room ${conversationId}`);
    });
    
    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
        socket.leave(conversationId);
        console.log(`User ${socket.id} left conversation room ${conversationId}`);
    });
    
    // Handle typing indicators
    socket.on('typing-start', (data) => {
        socket.to(data.conversationId).emit('user-typing', {
            userId: data.userId,
            username: data.username
        });
    });
    
    socket.on('typing-stop', (data) => {
        socket.to(data.conversationId).emit('user-stop-typing', {
            userId: data.userId
        });
    });
    
    // Handle online status
    socket.on('user-online', (userId) => {
        socket.broadcast.emit('user-status-change', {
            userId,
            status: 'online'
        });
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    // Relay chat messages in real-time
    socket.on('send-message', (data) => {
        // Broadcast to everyone else in the conversation room
        socket.to(data.conversationId).emit('new-message', data.message);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
