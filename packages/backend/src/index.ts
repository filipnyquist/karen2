import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { locationRoutes } from "./routes/locations";
import { eventRoutes } from "./routes/events";
import { eventWorkerRoutes } from "./routes/eventWorkers";
import { authMiddleware } from "./middleware/auth";

const app: Elysia = new Elysia()
  .use(cors({ origin: "http://localhost:5173", credentials: true }))
  .use(authMiddleware)
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(locationRoutes)
  .use(eventRoutes)
  .use(eventWorkerRoutes)
  .listen(3000);

export type App = typeof app;

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
