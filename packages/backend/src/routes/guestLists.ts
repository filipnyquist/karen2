import { Elysia, t } from "elysia";
import { eq, and, count, sql } from "drizzle-orm";
import { db, events, guestLists } from "../db";
import { authMiddleware, requireAuth, requireVerified, isAdmin, type AuthContext } from "../middleware/auth";

export const guestListRoutes = new Elysia({ prefix: "/events/:eventId" })
  .use(authMiddleware)
  // Get guest list (with visibility rules)
  .get("/guests", async ({ params, user, set }) => {
    const eventId = params.eventId;

    // Get event details to check responsible
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

    // Count total guests
    const guestCount = await db
      .select({ count: count() })
      .from(guestLists)
      .where(eq(guestLists.eventId, eventId));

    const totalGuests = guestCount[0]?.count || 0;

    // Public: return count only
    if (!user) {
      return {
        totalGuests,
        maxGuests: event.maxGuests,
        guests: [],
      };
    }

    // Check if user is responsible for this event or admin
    const isResponsible = event.workers.some(
      (w) => w.userId === user.id && w.isResponsible
    );
    const isAdminUser = isAdmin(user.role);

    // Responsible/Admin: return full guest list
    if (isResponsible || isAdminUser) {
      const allGuests = await db.query.guestLists.findMany({
        where: eq(guestLists.eventId, eventId),
        with: {
          signedUpByUser: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [guestLists.createdAt],
      });

      return {
        totalGuests,
        maxGuests: event.maxGuests,
        canViewFullList: true,
        guests: allGuests.map((g) => ({
          id: g.id,
          guestName: g.guestName,
          guestEmail: g.guestEmail,
          guestSsn: g.guestSsn,
          signedUpBy: g.signedUpByUser,
          createdAt: g.createdAt,
        })),
      };
    }

    // Regular worker: return only their own guests
    const ownGuests = await db.query.guestLists.findMany({
      where: and(
        eq(guestLists.eventId, eventId),
        eq(guestLists.signedUpBy, user.id)
      ),
      orderBy: [guestLists.createdAt],
    });

    return {
      totalGuests,
      maxGuests: event.maxGuests,
      canViewFullList: false,
      myGuests: ownGuests.map((g) => ({
        id: g.id,
        guestName: g.guestName,
        guestEmail: g.guestEmail,
        guestSsn: g.guestSsn,
        createdAt: g.createdAt,
      })),
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
  })
  // Add guest (verified+ users only)
  .post("/guests", async ({ params, user, body, set }) => {
    const eventId = params.eventId;
    const userId = user!.id;

    // Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    if (event.maxGuests === 0) {
      set.status = 400;
      return { error: "This event does not allow guests" };
    }

    // Check if guest list is full
    const guestCount = await db
      .select({ count: count() })
      .from(guestLists)
      .where(eq(guestLists.eventId, eventId));

    if (guestCount[0].count >= event.maxGuests) {
      set.status = 400;
      return { error: "Guest list is full" };
    }

    // Check user's guest limit
    const userGuestCount = await db
      .select({ count: count() })
      .from(guestLists)
      .where(
        and(
          eq(guestLists.eventId, eventId),
          eq(guestLists.signedUpBy, userId)
        )
      );

    if (
      event.maxGuestsPerPerson &&
      userGuestCount[0].count >= event.maxGuestsPerPerson
    ) {
      set.status = 400;
      return {
        error: `You can only add up to ${event.maxGuestsPerPerson} guests for this event`,
      };
    }

    // Add guest
    const [guest] = await db
      .insert(guestLists)
      .values({
        eventId,
        signedUpBy: userId,
        guestName: body.guestName,
        guestEmail: body.guestEmail,
        guestSsn: body.guestSsn,
      })
      .returning();

    set.status = 201;
    return {
      message: "Guest added successfully",
      guest: {
        id: guest.id,
        guestName: guest.guestName,
        guestEmail: guest.guestEmail,
        guestSsn: guest.guestSsn,
        createdAt: guest.createdAt,
      },
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    body: t.Object({
      guestName: t.String({ minLength: 1, maxLength: 255 }),
      guestEmail: t.Optional(t.String({ format: "email" })),
      guestSsn: t.Optional(t.String({ maxLength: 20 })),
    }),
    beforeHandle: [requireVerified],
  })
  // Update guest (own guests only)
  .put("/guests/:guestId", async ({ params, user, body, set }) => {
    const { eventId, guestId } = params;
    const userId = user!.id;

    // Find guest
    const guest = await db.query.guestLists.findFirst({
      where: and(
        eq(guestLists.id, guestId),
        eq(guestLists.eventId, eventId)
      ),
    });

    if (!guest) {
      set.status = 404;
      return { error: "Guest not found" };
    }

    // Check ownership or admin
    const isOwner = guest.signedUpBy === userId;
    const isAdminUser = isAdmin(user!.role);

    if (!isOwner && !isAdminUser) {
      set.status = 403;
      return { error: "You can only edit your own guests" };
    }

    const [updated] = await db
      .update(guestLists)
      .set({
        guestName: body.guestName ?? guest.guestName,
        guestEmail: body.guestEmail ?? guest.guestEmail,
        guestSsn: body.guestSsn ?? guest.guestSsn,
      })
      .where(eq(guestLists.id, guestId))
      .returning();

    return {
      message: "Guest updated successfully",
      guest: {
        id: updated.id,
        guestName: updated.guestName,
        guestEmail: updated.guestEmail,
        guestSsn: updated.guestSsn,
        createdAt: updated.createdAt,
      },
    };
  }, {
    params: t.Object({
      eventId: t.String(),
      guestId: t.String(),
    }),
    body: t.Object({
      guestName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      guestEmail: t.Optional(t.String({ format: "email" })),
      guestSsn: t.Optional(t.String({ maxLength: 20 })),
    }),
    beforeHandle: [requireAuth],
  })
  // Delete guest (own guests only, or admin)
  .delete("/guests/:guestId", async ({ params, user, set }) => {
    const { eventId, guestId } = params;
    const userId = user!.id;

    // Find guest
    const guest = await db.query.guestLists.findFirst({
      where: and(
        eq(guestLists.id, guestId),
        eq(guestLists.eventId, eventId)
      ),
    });

    if (!guest) {
      set.status = 404;
      return { error: "Guest not found" };
    }

    // Check ownership or admin
    const isOwner = guest.signedUpBy === userId;
    const isAdminUser = isAdmin(user!.role);

    if (!isOwner && !isAdminUser) {
      set.status = 403;
      return { error: "You can only remove your own guests" };
    }

    await db.delete(guestLists).where(eq(guestLists.id, guestId));

    return { message: "Guest removed successfully" };
  }, {
    params: t.Object({
      eventId: t.String(),
      guestId: t.String(),
    }),
    beforeHandle: [requireAuth],
  })
  // Get full guest list (for responsible/admin with full details page)
  .get("/fullguestlist", async ({ params, user, set }) => {
    const eventId = params.eventId;

    // Get event with workers
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        workers: true,
        location: true,
      },
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    // Check if user is responsible or admin
    const isResponsible = event.workers.some(
      (w) => w.userId === user?.id && w.isResponsible
    );
    const isAdminUser = user ? isAdmin(user.role) : false;

    if (!isResponsible && !isAdminUser) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const allGuests = await db.query.guestLists.findMany({
      where: eq(guestLists.eventId, eventId),
      with: {
        signedUpByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [guestLists.guestName],
    });

    return {
      event: {
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
      },
      totalGuests: allGuests.length,
      maxGuests: event.maxGuests,
      guests: allGuests.map((g) => ({
        id: g.id,
        guestName: g.guestName,
        guestEmail: g.guestEmail,
        guestSsn: g.guestSsn,
        signedUpBy: g.signedUpByUser,
        createdAt: g.createdAt,
      })),
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    beforeHandle: [requireAuth],
  });
