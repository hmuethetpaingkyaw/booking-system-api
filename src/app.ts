import express from "express";
import cors, { type CorsOptions } from "cors";
import apiRoutes from "./routes";
import notFound from "./middlewares/not-found.middleware";
import errorHandler from "./middlewares/error.middleware";

const app = express();

const corsOptions: CorsOptions = {
  origin: true,
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
