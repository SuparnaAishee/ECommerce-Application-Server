import express, { Application } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import config from "./app/config";
import globalErrorHandler from "./utils/globalErrorHandler";
import notFound from "./utils/notFound";
import { apiLimiter } from "./utils/rateLimit";
import router from "./app/routes";

const app: Application = express();

app.set("trust proxy", 1);
app.use(helmet());

const allowedOrigins = config.cors_allowed_origins?.length
  ? config.cors_allowed_origins
  : [config.client_base_url];

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api/v1", apiLimiter, router);

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
