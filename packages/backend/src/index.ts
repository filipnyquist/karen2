import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { authMiddleware } from "./middleware/auth";

const app: Elysia = new Elysia()
  .use(cors({ origin: "http://localhost:5173", credentials: true }))
  .use(authMiddleware)
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .listen(3000);

export type App = typeof app;

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
