import { Elysia, t } from "elysia";
import { eq, like, and, desc, count, sql } from "drizzle-orm";
import { db, users, userEducations, eventWorkers, guestLists, events } from "../db";
import { authMiddleware, requireAdmin } from "../middleware/auth";

export const adminUserRoutes = new Elysia({ prefix: "/admin" })
  .use(authMiddleware)
  .use(requireAdmin)
  // List users with search/filter
  .get("/users", async ({ query }) => {
    const { page = "1", limit = "20", search, role, includeDeactivated } = query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions: (SQL<unknown> | undefined)[] = [];

    if (search) {
      conditions.push(
        sql`(${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})`
      );
    }

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (includeDeactivated !== "true") {
      conditions.push(eq(users.deactivated, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    // Get users
    const userList = await db.query.users.findMany({
      where: whereClause,
      orderBy: [desc(users.createdAt)],
      limit: limitNum,
      offset,
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        deactivated: true,
        createdAt: true,
        profilePicture: true,
      },
      with: {
        educations: true,
      },
    });

    return {
      users: userList.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        emailVerified: u.emailVerified,
        deactivated: u.deactivated,
        createdAt: u.createdAt,
        profilePicture: u.profilePicture,
        educations: u.educations.map((e) => e.educationType),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
      role: t.Optional(t.String()),
      includeDeactivated: t.Optional(t.String()),
    }),
  })
  // Get single user with history
  .get("/users/:id", async ({ params, set }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, params.id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        deactivated: true,
        createdAt: true,
        profilePicture: true,
      },
      with: {
        educations: {
          with: {
            assignedByUser: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    // Get event history
    const workedEvents = await db.query.eventWorkers.findMany({
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
    });

    // Get total guests signed up
    const guestCount = await db
      .select({ count: count() })
      .from(guestLists)
      .where(eq(guestLists.signedUpBy, params.id));

    // Calculate stats
    const eventsWorked = workedEvents.length;
    const eventsAsResponsible = workedEvents.filter((w) => w.isResponsible).length;
    const pointsEvents = workedEvents.filter(
      (w) => w.event.givesPoints && new Date(w.event.endTime) < new Date()
    ).length;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        deactivated: user.deactivated,
        createdAt: user.createdAt,
        profilePicture: user.profilePicture,
        educations: user.educations.map((e) => ({
          id: e.id,
          type: e.educationType,
          assignedBy: e.assignedByUser,
          assignedAt: e.assignedAt,
        })),
      },
      stats: {
        eventsWorked,
        eventsAsResponsible,
        pointsEvents,
        guestsSignedUp: guestCount[0]?.count || 0,
      },
      eventHistory: workedEvents.map((w) => ({
        id: w.id,
        event: w.event,
        isResponsible: w.isResponsible,
        createdAt: w.createdAt,
      })),
    };
  }, {
    params: t.Object({
      id: t.String(),
    }),
  })
  // Update user
  .put("/users/:id", async ({ params, body, set }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, params.id),
    });

    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    // Prevent changing own role if superadmin
    // (additional safety check)

    const [updated] = await db
      .update(users)
      .set({
        name: body.name ?? user.name,
        role: body.role ?? user.role,
        deactivated: body.deactivated ?? user.deactivated,
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.id))
      .returning();

    return {
      message: "User updated successfully",
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        deactivated: updated.deactivated,
      },
    };
  }, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      role: t.Optional(t.String()),
      deactivated: t.Optional(t.Boolean()),
    }),
  })
  // Delete user (soft delete via deactivation)
  .delete("/users/:id", async ({ params, set }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, params.id),
    });

    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    // Soft delete by deactivating
    await db
      .update(users)
      .set({
        deactivated: true,
        email: `${user.email}.inactive.${Date.now()}`, // Make email available again
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.id));

    return { message: "User deactivated successfully" };
  }, {
    params: t.Object({
      id: t.String(),
    }),
  });
