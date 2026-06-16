const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { getJwtSecret } = require('./config/auth');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const quizRoutes = require('./routes/quizRoutes');
const progressRoutes = require('./routes/progressRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

dotenv.config();

try {
    getJwtSecret();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

connectDB();

const app = express();

const normalizeOrigin = (value) => {
    const origin = value.trim().replace(/\/$/, '');
    try {
        return new URL(origin).origin;
    } catch {
        return origin;
    }
};

const configuredOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
]
    .filter(Boolean)
    .flatMap((origin) => origin.split(','))
    .map(normalizeOrigin);

const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://3bdoum.github.io',
    ...configuredOrigins,
]);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Abqora backend is running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/certificates', certificateRoutes);

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT_TRIES = 10;

const startServer = (port, attempt = 1) => {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE' && attempt <= MAX_PORT_TRIES) {
            const nextPort = port + 1;
            console.warn(`Port ${port} is in use, trying port ${nextPort}...`);
            startServer(nextPort, attempt + 1);
        } else {
            console.error('Server error:', error.message);
            process.exit(1);
        }
    });
};

startServer(DEFAULT_PORT);
