import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

const app = express();
const port = 3000;

await connectDB()

//middle wares

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())

//routes
app.get('/', (req, res) => res.send('Server is live!'));
app.use('/api/innegest',  serve({ client: inngest, functions }))


app.listen(port, () => {
  console.log(`Server listining at http://localhost:${port}`);
});