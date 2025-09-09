import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

dotenv.config();

// Import Routers
import authRouter from './routes/auth/authRoute.js';
import userRouter from './routes/user/userRoute.js';
import documentRouter from './routes/user/documentRoute.js';
import documentReminderService from './utils/reminders/documentReminderService.js';
import dailyCheckRoutes from './routes/user/dailyCheckRoutes.h'
import checklistItemRoutes from './routes/user/checklistItemRoutes.js'
import linkRoutes from './routes/admin/linkRoutes.js'
import subscriptionRoutes from './routes/user/subscriptionRoutes.js'
import documentTypeRouter from './routes/admin/documentTypeRoute.js'

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

//allow all origins for CORS
app.use(cors({
  origin: '*', // Be cautious with '*' in production
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  credentials: true,
}));

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Start the document reminder service ONCE
documentReminderService.start();

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/document', documentRouter);
app.use('/api/document-type', documentTypeRouter);

// Graceful shutdown
process.on('SIGTERM', () => {
    documentReminderService.stop();
});

app.use('/api/checks', dailyCheckRoutes);
app.use('/api/checklist-items', checklistItemRoutes)
app.use('/api/links', linkRoutes)
app.use('/api/subscriptions', subscriptionRoutes);

// if other  mean which i not declare then say hi hackers
app.use((req, res) => {
  res.send('Hi Hackers, you are not allowed to access this API');
});

// --- Global Error Handling Middleware ---
// Must have 4 arguments for Express to recognize it as error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
  err.status = err.status || 'error';

  console.error('ERROR 💥:', err); // Log the full error stack

  // Send response
  res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      // Optionally include stack trace in development
      // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      error: err // Include the error object itself can sometimes be useful (or strip it in prod)
  });
});

// Start the server only if all critical checks passed
const connectToDatabase = async () => {
    try {
        await prisma.$connect();
        console.log('Database connected successfully!');
        
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('Database connection failed:', err);
        // Exit the process if the database connection fails
        process.exit(1); 
    } finally {
        // Disconnect Prisma client when the app closes
        process.on('beforeExit', async () => {
            await prisma.$disconnect();
        });
    }
};

connectToDatabase();
