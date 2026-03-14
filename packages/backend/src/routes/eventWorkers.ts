import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db, events, eventWorkers, users, userEducations } from "../db";
import { authMiddleware, requireAuth } from "../middleware/auth";

export const eventWorkerRoutes = new Elysia({ prefix: "/events/:eventId" })
  .use(authMiddleware)
  // Sign up as worker for event
  .post("/signup", async ({ params, user, set }) => {
    const eventId = params.eventId;
    const userId = user!.id;

    // Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        workers: true,
      },
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    if (event.status !== "open") {
      set.status = 400;
      return { error: "This event is not open for signups" };
    }

    // Check if event has already started
    if (new Date(event.startTime) < new Date()) {
      set.status = 400;
      return { error: "Cannot sign up for events that have already started" };
    }

    // Check if user is already signed up
    const existingSignup = await db.query.eventWorkers.findFirst({
      where: and(
        eq(eventWorkers.eventId, eventId),
        eq(eventWorkers.userId, userId)
      ),
    });

    if (existingSignup) {
      set.status = 400;
      return { error: "You are already signed up for this event" };
    }

    // Check if user has "responsible" education and if responsible spots are open
    const userEducation = await db.query.userEducations.findFirst({
      where: and(
        eq(userEducations.userId, userId),
        eq(userEducations.educationType, "responsible")
      ),
    });

    const responsibleCount = event.workers.filter((w) => w.isResponsible).length;
    const regularCount = event.workers.filter((w) => !w.isResponsible).length;

    // If user has responsible education and responsible spots are available
    const canBeResponsible = userEducation && responsibleCount < event.maxResponsible;

    // If regular spots are full
    if (regularCount >= event.maxWorkers && !canBeResponsible) {
      set.status = 400;
      return { error: "This event is full" };
    }

    const isResponsible = canBeResponsible && responsibleCount < event.minResponsible
      ? true
      : false;

    // Sign up user
    const [signup] = await db
      .insert(eventWorkers)
      .values({
        eventId,
        userId,
        isResponsible,
      })
      .returning();

    return {
      message: isResponsible
        ? "You are signed up as responsible for this event"
        : "You are signed up to work this event",
      signup: {
        id: signup.id,
        isResponsible: signup.isResponsible,
      },
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    beforeHandle: [requireAuth],
  })
  // Remove worker signup (self, responsible, or admin)
  .delete("/signup", async ({ params, user, set }) => {
    const eventId = params.eventId;
    const userId = user!.id;

    // Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        workers: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    // Find user's signup
    const signup = await db.query.eventWorkers.findFirst({
      where: and(
        eq(eventWorkers.eventId, eventId),
        eq(eventWorkers.userId, userId)
      ),
    });

    if (!signup) {
      set.status = 404;
      return { error: "You are not signed up for this event" };
    }

    // Check if user is responsible for this event
    const isResponsibleForEvent = event.workers.some(
      (w) => w.userId === userId && w.isResponsible
    );

    // Users can only remove themselves if they are responsible or admin
    if (signup.userId !== userId && !isResponsibleForEvent && user!.role !== "admin" && user!.role !== "superadmin") {
      set.status = 403;
      return { error: "You can only remove your own signup or be a responsible/admin to remove others" };
    }

    await db
      .delete(eventWorkers)
      .where(eq(eventWorkers.id, signup.id));

    return { message: "Signup removed successfully" };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    beforeHandle: [requireAuth],
  })
  // List workers for an event
  .get("/workers", async ({ params, set }) => {
    const event = await db.query.events.findFirst({
      where: eq(events.id, params.eventId),
      with: {
        workers: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    return {
      responsible: event.workers
        .filter((w) => w.isResponsible)
        .map((w) => ({
          id: w.id,
          user: w.user,
          createdAt: w.createdAt,
        })),
      workers: event.workers
        .filter((w) => !w.isResponsible)
        .map((w) => ({
          id: w.id,
          user: w.user,
          createdAt: w.createdAt,
        })),
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
  });
