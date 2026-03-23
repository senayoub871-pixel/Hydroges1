import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/api/uploads", express.static(uploadsDir));

app.use("/api", router);

if (process.env.NODE_ENV !== "production") {
  const vitePort = process.env.VITE_PORT || "5173";
  const viteTarget = `http://localhost:${vitePort}`;
  app.use(
    "/",
    createProxyMiddleware({
      target: viteTarget,
      changeOrigin: true,
      ws: true,
      logger: console,
    }),
  );
} else {
  const frontendDist = path.resolve(__dirname, "..", "..", "docexchange", "dist", "public");
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
