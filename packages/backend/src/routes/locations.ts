import { Elysia, t } from "elysia";
import { eq, desc, sql } from "drizzle-orm";
import { db, locations, events } from "../db";
import { authMiddleware, requireAdmin } from "../middleware/auth";

export const locationRoutes = new Elysia({ prefix: "/locations" })
  .use(authMiddleware)
  // List all locations
  .get("/", async () => {
    const allLocations = await db.query.locations.findMany({
      orderBy: [desc(locations.createdAt)],
    });

    return {
      locations: allLocations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        address: loc.address,
        capacity: loc.capacity,
        picture: loc.picture,
      })),
    };
  })
  // Get single location with upcoming events
  .get(
    "/:id",
    async ({ params, set }) => {
      const location = await db.query.locations.findFirst({
        where: eq(locations.id, params.id),
      });

      if (!location) {
        set.status = 404;
        return { error: "Location not found" };
      }

      // Get upcoming events at this location
      const upcomingEvents = await db.query.events.findMany({
        where: eq(events.locationId, params.id),
        orderBy: [events.startTime],
        with: {
          workers: true,
        },
      });

      const now = new Date();
      const filteredEvents = upcomingEvents
        .filter((e) => new Date(e.endTime) > now && e.status !== "canceled")
        .map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          startTime: e.startTime,
          endTime: e.endTime,
          status: e.status,
          workerCount: e.workers.length,
          maxWorkers: e.maxWorkers + e.maxResponsible,
        }));

      return {
        location: {
          id: location.id,
          name: location.name,
          description: location.description,
          address: location.address,
          capacity: location.capacity,
          picture: location.picture,
          createdAt: location.createdAt,
        },
        upcomingEvents: filteredEvents,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Create location (admin only)
  .post(
    "/",
    async ({ body, set }) => {
      const [newLocation] = await db
        .insert(locations)
        .values(body)
        .returning();

      set.status = 201;
      return {
        message: "Location created successfully",
        location: newLocation,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        description: t.Optional(t.String()),
        address: t.Optional(t.String({ maxLength: 500 })),
        capacity: t.Optional(t.Number({ minimum: 0 })),
        picture: t.Optional(t.String({ maxLength: 255 })),
      }),
      beforeHandle: [requireAdmin],
    }
  )
  // Update location (admin only)
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const existing = await db.query.locations.findFirst({
        where: eq(locations.id, params.id),
      });

      if (!existing) {
        set.status = 404;
        return { error: "Location not found" };
      }

      const [updated] = await db
        .update(locations)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(locations.id, params.id))
        .returning();

      return {
        message: "Location updated successfully",
        location: updated,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        description: t.Optional(t.String()),
        address: t.Optional(t.String({ maxLength: 500 })),
        capacity: t.Optional(t.Number({ minimum: 0 })),
        picture: t.Optional(t.String({ maxLength: 255 })),
      }),
      beforeHandle: [requireAdmin],
    }
  )
  // Delete location (admin only)
  .delete(
    "/:id",
    async ({ params, set }) => {
      const existing = await db.query.locations.findFirst({
        where: eq(locations.id, params.id),
      });

      if (!existing) {
        set.status = 404;
        return { error: "Location not found" };
      }

      // Check if there are any future events at this location
      const futureEvents = await db.query.events.findMany({
        where: eq(events.locationId, params.id),
      });

      const now = new Date();
      const hasFutureEvents = futureEvents.some(
        (e) => new Date(e.endTime) > now
      );

      if (hasFutureEvents) {
        set.status = 400;
        return {
          error:
            "Cannot delete location with upcoming events. Cancel or move events first.",
        };
      }

      await db.delete(locations).where(eq(locations.id, params.id));

      return { message: "Location deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      beforeHandle: [requireAdmin],
    }
  );
