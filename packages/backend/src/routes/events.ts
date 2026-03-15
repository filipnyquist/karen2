import { Elysia, t } from "elysia";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { db, events, locations, eventWorkers, users, eventStatusEnum, eventTypeEnum, frontPageNotices, redis, generateCacheKey, invalidateCachePattern } from "../db";
import { authMiddleware, requireAdmin, requireAuth } from "../middleware/auth";

const EVENTS_CACHE_TTL = 60; // 1 minute
const EVENT_SINGLE_CACHE_TTL = 120; // 2 minutes

// Helper function to format event time for display
function formatEventTime(startTime: Date, endTime: Date): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const isOvernight = start.getDate() !== end.getDate();

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const startDay = days[start.getDay()];
  const endDay = days[end.getDay()];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  if (isOvernight) {
    return `${startDay} ${formatTime(start)} - ${endDay} ${formatTime(end)}`;
  }
  return `${startDay} ${formatTime(start)} - ${formatTime(end)}`;
}

export const eventRoutes = new Elysia({ prefix: "/events" })
  .use(authMiddleware)
  // Get active frontpage notice (public)
  .get("/frontpage-notice", async () => {
    const cacheKey = "frontpage:notice";

    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Invalid cache
      }
    }

    const notice = await db.query.frontPageNotices.findFirst({
      where: eq(frontPageNotices.isActive, true),
      orderBy: [desc(frontPageNotices.updatedAt)],
    });

    const result = {
      notice: notice || null,
    };

    await redis.set(cacheKey, JSON.stringify(result), 60); // 1 minute

    return result;
  })
  // List events with filters
  .get("/", async ({ query }) => {
    const {
      page = "1",
      limit = "10",
      status,
      from,
      to,
      locationId,
      search
    } = query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Generate cache key based on query parameters
    const cacheKey = generateCacheKey(
      "events",
      "list",
      pageNum,
      limitNum,
      status || "all",
      from || "any",
      to || "any",
      locationId || "all",
      search || "any"
    );

    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Invalid cache
      }
    }

    // Build where conditions
    const conditions: (SQL<unknown> | undefined)[] = [];

    if (status) {
      conditions.push(eq(events.status, status));
    }

    if (from) {
      conditions.push(gte(events.startTime, new Date(from)));
    }

    if (to) {
      conditions.push(lte(events.startTime, new Date(to)));
    }

    if (locationId) {
      conditions.push(eq(events.locationId, locationId));
    }

    if (search) {
      conditions.push(
        sql`${events.title} ILIKE ${`%${search}%`}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    // Get events
    const eventList = await db.query.events.findMany({
      where: whereClause,
      orderBy: [asc(events.startTime)],
      limit: limitNum,
      offset,
      with: {
        location: {
          columns: {
            id: true,
            name: true,
          },
        },
        workers: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const formattedEvents = eventList.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      status: e.status,
      startTime: e.startTime,
      endTime: e.endTime,
      timeDisplay: formatEventTime(e.startTime, e.endTime),
      location: e.location,
      responsibleCount: e.workers.filter((w) => w.isResponsible).length,
      maxResponsible: e.maxResponsible,
      workerCount: e.workers.filter((w) => !w.isResponsible).length,
      maxWorkers: e.maxWorkers,
      givesPoints: e.givesPoints,
    }));

    const result = {
      events: formattedEvents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    // Cache the result
    await redis.set(cacheKey, JSON.stringify(result), EVENTS_CACHE_TTL);

    return result;
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      status: t.Optional(t.String()),
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
      locationId: t.Optional(t.String()),
      search: t.Optional(t.String()),
    }),
  })
  // Get single event
  .get("/:eventId", async ({ params, set }) => {
    const cacheKey = generateCacheKey("events", params.eventId);

    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Invalid cache
      }
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, params.eventId),
      with: {
        location: true,
        workers: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                nickname: true,
                profilePicture: true,
              },
            },
          },
        },
        createdByUser: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    const result = {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        notice: event.notice,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        timeDisplay: formatEventTime(event.startTime, event.endTime),
        status: event.status,
        minResponsible: event.minResponsible,
        maxResponsible: event.maxResponsible,
        minWorkers: event.minWorkers,
        maxWorkers: event.maxWorkers,
        maxGuests: event.maxGuests,
        maxGuestsPerPerson: event.maxGuestsPerPerson,
        givesPoints: event.givesPoints,
        createdBy: event.createdByUser,
        createdAt: event.createdAt,
        workers: {
          responsible: event.workers
            .filter((w) => w.isResponsible)
            .map((w) => ({
              id: w.id,
              createdAt: w.createdAt,
              user: {
                id: w.user.id,
                name: w.user.name,
                nickname: w.user.nickname,
                profilePicture: w.user.profilePicture,
              },
            })),
          regular: event.workers
            .filter((w) => !w.isResponsible)
            .map((w) => ({
              id: w.id,
              createdAt: w.createdAt,
              user: {
                id: w.user.id,
                name: w.user.name,
                nickname: w.user.nickname,
                profilePicture: w.user.profilePicture,
              },
            })),
        },
      },
    };

    await redis.set(cacheKey, JSON.stringify(result), EVENT_SINGLE_CACHE_TTL);

    return result;
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
  })
  // Create event (admin only)
  .post("/", async ({ body, user, set }) => {
    // Convert string dates to Date objects
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    // Verify location exists
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, body.locationId),
    });

    if (!location) {
      set.status = 400;
      return { error: "Location not found" };
    }

    // Check for double booking
    const existingEvent = await db.query.events.findFirst({
      where: and(
        eq(events.locationId, body.locationId),
        sql`${events.startTime} < ${endTime}`,
        sql`${events.endTime} > ${startTime}`,
        eq(events.status, "open")
      ),
    });

    if (existingEvent) {
      set.status = 400;
      return {
        error: "Another event is already scheduled at this location during this time",
        conflictingEvent: {
          id: existingEvent.id,
          title: existingEvent.title,
          startTime: existingEvent.startTime,
          endTime: existingEvent.endTime,
        },
      };
    }

    const [newEvent] = await db
      .insert(events)
      .values({
        ...body,
        startTime,
        endTime,
        createdBy: user!.id,
      })
      .returning();

    // Invalidate events list cache
    await invalidateCachePattern("events:list:*");

    set.status = 201;
    return {
      message: "Event created successfully",
      event: newEvent,
    };
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 255 }),
      description: t.Optional(t.String()),
      type: t.String({ default: "event" }),
      notice: t.Optional(t.String()),
      locationId: t.String(),
      startTime: t.String(),
      endTime: t.String(),
      status: t.Optional(t.String({ default: "open" })),
      minResponsible: t.Optional(t.Number({ default: 1 })),
      maxResponsible: t.Optional(t.Number({ default: 2 })),
      minWorkers: t.Optional(t.Number({ default: 2 })),
      maxWorkers: t.Optional(t.Number({ default: 10 })),
      maxGuests: t.Optional(t.Number({ default: 0 })),
      maxGuestsPerPerson: t.Optional(t.Number()),
      givesPoints: t.Optional(t.Boolean({ default: true })),
    }),
    beforeHandle: [requireAdmin],
  })
  // Update event (admin only)
  .put("/:eventId", async ({ params, body, set }) => {
    const existing = await db.query.events.findFirst({
      where: eq(events.id, params.eventId),
    });

    if (!existing) {
      set.status = 404;
      return { error: "Event not found" };
    }

    // Convert string dates to Date objects if provided
    const startTime = body.startTime ? new Date(body.startTime) : undefined;
    const endTime = body.endTime ? new Date(body.endTime) : undefined;

    // If changing location or time, check for double booking
    if (body.locationId || startTime || endTime) {
      const locationId = body.locationId || existing.locationId;
      const checkStartTime = startTime || existing.startTime;
      const checkEndTime = endTime || existing.endTime;

      const conflictingEvent = await db.query.events.findFirst({
        where: and(
          eq(events.locationId, locationId),
          sql`${events.startTime} < ${checkEndTime}`,
          sql`${events.endTime} > ${checkStartTime}`,
          eq(events.status, "open"),
          sql`${events.id} != ${params.eventId}`
        ),
      });

      if (conflictingEvent) {
        set.status = 400;
        return {
          error: "Another event is already scheduled at this location during this time",
          conflictingEvent: {
            id: conflictingEvent.id,
            title: conflictingEvent.title,
          },
        };
      }
    }

    const [updated] = await db
      .update(events)
      .set({
        ...body,
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        updatedAt: new Date(),
      })
      .where(eq(events.id, params.eventId))
      .returning();

    // Invalidate caches
    await redis.del(generateCacheKey("events", params.eventId));
    await invalidateCachePattern("events:list:*");

    return {
      message: "Event updated successfully",
      event: updated,
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    body: t.Object({
      title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      description: t.Optional(t.String()),
      type: t.Optional(t.String()),
      notice: t.Optional(t.String()),
      locationId: t.Optional(t.String()),
      startTime: t.Optional(t.String()),
      endTime: t.Optional(t.String()),
      status: t.Optional(t.String()),
      minResponsible: t.Optional(t.Number()),
      maxResponsible: t.Optional(t.Number()),
      minWorkers: t.Optional(t.Number()),
      maxWorkers: t.Optional(t.Number()),
      maxGuests: t.Optional(t.Number()),
      maxGuestsPerPerson: t.Optional(t.Number()),
      givesPoints: t.Optional(t.Boolean()),
    }),
    beforeHandle: [requireAdmin],
  })
  // Delete event (admin only)
  .delete("/:eventId", async ({ params, set }) => {
    const existing = await db.query.events.findFirst({
      where: eq(events.id, params.eventId),
    });

    if (!existing) {
      set.status = 404;
      return { error: "Event not found" };
    }

    await db.delete(events).where(eq(events.id, params.eventId));

    // Invalidate caches
    await redis.del(generateCacheKey("events", params.eventId));
    await invalidateCachePattern("events:list:*");

    return { message: "Event deleted successfully" };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    beforeHandle: [requireAdmin],
  });
