import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from './routes/showRoutes.js';
import boookingRoutes from './routes/bookingRoutes.js';
import adminRouter from './routes/adminroutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import 'dotenv/config';


const app = express();
const port = 3000;

await connectDB()

//stripe webhooks Route
app.use('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

//middle wares

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())

// Normalize duplicate slashes in incoming URLs (e.g. /api/show//now-playing -> /api/show/now-playing)
app.use((req, res, next) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/\/{2,}/g, '/');
  }
  next();
});

//routes
app.get('/', (req, res) => res.send('Server is live!'));
app.use('/api/inngest',  serve({ client: inngest, functions }))
app.use('/api/show', showRouter)
app.use('/api/booking', boookingRoutes)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});