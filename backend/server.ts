import "dotenv/config";
import cors from "cors";
import express from "express";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import entriesRoutes from "./routes/entries.js";
import recoveryRoutes from "./routes/recovery.js";

const app = express();
const PORT = process.env.PORT || 5000;

try {
  await connectDB();
} catch {
  console.error(
    "Fatal: Database connection failed during server startup. Exiting...",
  );
  process.exit(1);
}

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api-status", (_req, res) => {
  res.json({ status: "OK" });
});

app.use("/", authRoutes);
app.use("/", entriesRoutes);
app.use("/", recoveryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
