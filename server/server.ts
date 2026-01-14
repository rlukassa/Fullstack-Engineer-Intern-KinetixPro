import 'dotenv/config';
import express, { Request, Response } from 'express';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import userRoutes from './routes/userRoutes';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'KinetixPro API is running',
        database: 'Check console for database status'
    });
});

// Health check endpoint for Docker/Kubernetes
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 5000;

connectDB();
app.listen(PORT, () => {
    console.log(`\nServer running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`\nConnecting to PostgreSQL...\n`);
});