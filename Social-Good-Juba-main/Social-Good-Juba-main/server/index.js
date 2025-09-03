const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { rateLimitMiddleware, generalRateLimiter } = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all routes
app.use(rateLimitMiddleware(generalRateLimiter));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Juba server is running' });
});

// Socket.io for real-time messaging
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join room for a specific job
    socket.on('join-job', (jobId) => {
        socket.join(jobId);
        console.log(`User ${socket.id} joined job room ${jobId}`);
    });
    
    // Handle chat messages
    socket.on('send-message', async (data) => {
        try {
            const { jobId, senderId, receiverId, content } = data;
            
            // Save message to database
            const supabase = require('./db/index');
            const { data: message, error } = await supabase
                .from('messages')
                .insert([
                    {
                        job_id: jobId,
                        sender_id: senderId,
                        receiver_id: receiverId,
                        content
                    }
                ])
                .select()
                .single();
                
            if (error) {
                console.error('Message save error:', error);
                return;
            }
            
            // Emit message to the job room
            io.to(jobId).emit('receive-message', message);
        } catch (error) {
            console.error('Message handling error:', error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
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
