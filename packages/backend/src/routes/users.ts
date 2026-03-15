import { Elysia, t } from "elysia";
import { eq, desc, count, and, lte } from "drizzle-orm";
import { db, users, userEducations, eventWorkers, events } from "../db";
import { authMiddleware, requireAuth } from "../middleware/auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .use(requireAuth)
  // Get current user profile
  .get("/me", async ({ user }) => {
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        emailVerified: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      return { error: "User not found" };
    }

    // Fetch educations separately to avoid relation ambiguity
    const educationsList = await db
      .select({
        educationType: userEducations.educationType,
        assignedAt: userEducations.assignedAt,
      })
      .from(userEducations)
      .where(eq(userEducations.userId, user.id));

    return {
      user: {
        ...userData,
        educations: educationsList.map((e) => e.educationType),
      },
    };
  })
  // Update current user profile
  .put("/me", async ({ user, body, set }) => {
    const updateData: {
      name?: string;
      nickname?: string | null;
      profilePicture?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.nickname !== undefined) {
      updateData.nickname = body.nickname;
    }

    if (body.profilePicture !== undefined) {
      updateData.profilePicture = body.profilePicture;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        nickname: users.nickname,
        role: users.role,
        emailVerified: users.emailVerified,
        profilePicture: users.profilePicture,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!updated) {
      set.status = 404;
      return { error: "User not found" };
    }

    return {
      message: "Profile updated successfully",
      user: updated,
    };
  }, {
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      nickname: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 255 }), t.Null()])),
      profilePicture: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 255 }), t.Null()])),
    }),
  })
  // Get public profile for any user
  .get("/:id", async ({ params, set }) => {
    const userData = await db.query.users.findFirst({
      where: eq(users.id, params.id),
      columns: {
        id: true,
        name: true,
        nickname: true,
        role: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    if (!userData) {
      set.status = 404;
      return { error: "User not found" };
    }

    // Fetch educations
    const educationsList = await db
      .select({
        educationType: userEducations.educationType,
      })
      .from(userEducations)
      .where(eq(userEducations.userId, params.id));

    // Calculate stats
    const now = new Date();

    // Get all worked events (completed only)
    const workedEvents = await db
      .select({
        isResponsible: eventWorkers.isResponsible,
      })
      .from(eventWorkers)
      .innerJoin(events, eq(eventWorkers.eventId, events.id))
      .where(
        and(
          eq(eventWorkers.userId, params.id),
          eq(events.givesPoints, true),
          // Only count completed events
          lte(events.endTime, now)
        )
      );

    const eventsWorked = workedEvents.length;
    const eventsAsResponsible = workedEvents.filter(e => e.isResponsible).length;

    // Get recent event history (last 10 events)
    const recentEvents = await db.query.eventWorkers.findMany({
      where: eq(eventWorkers.userId, params.id),
      with: {
        event: {
          columns: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            givesPoints: true,
          },
        },
      },
      orderBy: [desc(eventWorkers.createdAt)],
      limit: 10,
    });

    // Filter to only completed events for display
    const completedRecentEvents = recentEvents.filter(
      w => new Date(w.event.endTime) < now
    );

    return {
      user: {
        id: userData.id,
        name: userData.name,
        nickname: userData.nickname,
        role: userData.role,
        profilePicture: userData.profilePicture,
        createdAt: userData.createdAt,
        educations: educationsList.map((e) => e.educationType),
      },
      stats: {
        eventsWorked,
        eventsAsResponsible,
      },
      recentEvents: completedRecentEvents.map((w) => ({
        id: w.event.id,
        title: w.event.title,
        startTime: w.event.startTime,
        endTime: w.event.endTime,
        givesPoints: w.event.givesPoints,
        isResponsible: w.isResponsible,
      })),
    };
  }, {
    params: t.Object({
      id: t.String(),
    }),
  });
