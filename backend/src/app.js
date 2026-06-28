import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import router from "./routes/index.js";
import { logger } from "./config/logger.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import { NotFoundError } from "./utils/appError.js";

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3222",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));

// HTTP Request Logger (Piped to Winston)
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);


// Body Parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Gzip Compression
app.use(compression());

// Mount API Routes
app.use(router);

// 404 Route Handler
app.use("*", (req, res, next) => {
  next(new NotFoundError(`Cannot find ${req.originalUrl} on this server`));
});

// Centralized Error Handler
app.use(globalErrorHandler);

export { app };
export default app;
