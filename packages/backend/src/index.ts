import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { locationRoutes } from "./routes/locations";
import { eventRoutes } from "./routes/events";
import { eventWorkerRoutes } from "./routes/eventWorkers";
import { guestListRoutes } from "./routes/guestLists";
import { commentRoutes } from "./routes/comments";
import { adminUserRoutes } from "./routes/adminUsers";
import { adminEducationRoutes } from "./routes/adminEducations";
import { adminFrontpageRoutes } from "./routes/adminFrontpage";
import { eventReportRoutes } from "./routes/eventReports";
import { ticketRoutes } from "./routes/tickets";
import { scoreboardRoutes } from "./routes/scoreboard";
import { dashboardRoutes } from "./routes/dashboard";
import { userRoutes } from "./routes/users";
import { authMiddleware } from "./middleware/auth";
import { createWebSocketHandler } from "./ws";

const app: Elysia = new Elysia()
  .use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }))
  .use(authMiddleware)
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(locationRoutes)
  .use(eventRoutes)
  .use(eventWorkerRoutes)
  .use(guestListRoutes)
  .use(commentRoutes)
  .use(adminUserRoutes)
  .use(adminEducationRoutes)
  .use(adminFrontpageRoutes)
  .use(eventReportRoutes)
  .use(ticketRoutes)
  .use(scoreboardRoutes)
  .use(dashboardRoutes)
  .use(userRoutes)
  .use(createWebSocketHandler())
  .listen(3000);

export type App = typeof app;

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
