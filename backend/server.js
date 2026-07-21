import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import entriesRoutes from './routes/entries.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
try {
  await connectDB();
} catch (error) {
  console.error('Fatal: Database connection failed during server startup. Exiting...');
  process.exit(1);
}

app.use(
  cors({
    origin: ["http://localhost:3000", "https://pass-up.vercel.app", "https://pass-up.vercel.app/"],
    credentials: true
  })
);

// Middleware to parse incoming JSON bodies
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/api-status", (req, res) => {
  res.json({ status: "OK" });
});

// Routes
app.use("/", authRoutes);
app.use("/", entriesRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
