import express from "express";
import cors, { type CorsOptions } from "cors";
import apiRoutes from "./routes";
import notFound from "./middlewares/not-found.middleware";
import errorHandler from "./middlewares/error.middleware";

const app = express();
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const allowedOrigins = (
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : defaultAllowedOrigins
).filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server tools (curl/Postman) and same-origin requests.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(express.json());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
