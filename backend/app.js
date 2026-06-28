const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const quizRoutes = require('./routes/quizRoutes');
const progressRoutes = require('./routes/progressRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const aiTutorRoutes = require('./routes/aiTutorRoutes');
const advertisementRoutes = require('./routes/advertisementRoutes');

const app = express();

const normalizeOrigin = (value) => {
    const origin = value.trim().replace(/\/$/, '');
    try {
        return new URL(origin).origin;
    } catch {
        return origin;
    }
};

const configuredOrigins = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
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
        if (!origin || allowedOrigins.has(normalizeOrigin(origin))) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
}));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => res.json({ message: 'Abqora backend is running' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/ai', aiTutorRoutes);
app.use('/api/ads', advertisementRoutes);

app.use((err, req, res, next) => {
    if (err?.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'المصدر غير مسموح' });
    }
    return next(err);
});

module.exports = app;
