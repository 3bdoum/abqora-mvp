const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { getJwtSecret } = require('./config/auth');

dotenv.config();
getJwtSecret();

const app = require('./app');
connectDB();

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT_TRIES = 10;

const startServer = (port, attempt = 1) => {
    const server = app.listen(port, () => console.log(`Server running on port ${port}`));
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
