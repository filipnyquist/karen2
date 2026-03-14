import { Elysia, t } from "elysia";
import { eq, and, desc, isNull } from "drizzle-orm";
import { db, skipQueueTickets, events, eventWorkers, users } from "../db";
import { authMiddleware, requireAuth, requireAdmin } from "../middleware/auth";
import crypto from "crypto";

// Generate unique QR code data
function generateQRCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const ticketRoutes = new Elysia({ prefix: "/tickets" })
  .use(authMiddleware)
  // List user's tickets (received)
  .get("/my-tickets", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const tickets = await db.query.skipQueueTickets.findMany({
      where: eq(skipQueueTickets.userId, user.id),
      orderBy: [desc(skipQueueTickets.createdAt)],
      with: {
        event: {
          columns: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
        givenByUser: {
          columns: {
            id: true,
            name: true,
          },
        },
        redeemedAtEvent: {
          columns: {
            id: true,
            title: true,
            startTime: true,
          },
        },
      },
    });

    return {
      tickets: tickets.map((t) => ({
        id: t.id,
        qrCodeData: t.qrCodeData,
        createdAt: t.createdAt,
        redeemedAt: t.redeemedAt,
        event: t.event,
        givenBy: t.givenByUser,
        redeemedAtEvent: t.redeemedAtEvent,
        isRedeemed: !!t.redeemedAt,
      })),
    };
  })
  // Get single ticket details
  .get("/:id", async ({ params, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const ticket = await db.query.skipQueueTickets.findFirst({
      where: eq(skipQueueTickets.id, params.id),
      with: {
        event: {
          columns: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
        givenByUser: {
          columns: {
            id: true,
            name: true,
          },
        },
        redeemedAtEvent: {
          columns: {
            id: true,
            title: true,
            startTime: true,
          },
        },
      },
    });

    if (!ticket) {
      set.status = 404;
      return { error: "Ticket not found" };
    }

    // Only ticket owner or admin can view
    if (ticket.userId !== user.id && user.role !== "admin" && user.role !== "superadmin") {
      set.status = 403;
      return { error: "Access denied" };
    }

    return {
      ticket: {
        id: ticket.id,
        qrCodeData: ticket.qrCodeData,
        createdAt: ticket.createdAt,
        redeemedAt: ticket.redeemedAt,
        event: ticket.event,
        givenBy: ticket.givenByUser,
        redeemedAtEvent: ticket.redeemedAtEvent,
        isRedeemed: !!ticket.redeemedAt,
      },
    };
  }, {
    params: t.Object({
      id: t.String(),
    }),
  })
  // Generate ticket (admin or responsible for event)
  .post("/generate", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { userId, eventId } = body;

    // Check if event exists
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    // Check if user is admin or responsible for this event
    const isAdmin = user.role === "admin" || user.role === "superadmin";

    if (!isAdmin) {
      // Check if user is responsible for this event
      const worker = await db.query.eventWorkers.findFirst({
        where: and(
          eq(eventWorkers.eventId, eventId),
          eq(eventWorkers.userId, user.id),
          eq(eventWorkers.role, "responsible")
        ),
      });

      if (!worker) {
        set.status = 403;
        return { error: "Only admins or event responsible can generate tickets" };
      }
    }

    // Check if target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      set.status = 404;
      return { error: "User not found" };
    }

    // Generate ticket
    const qrCode = generateQRCode();
    const [ticket] = await db
      .insert(skipQueueTickets)
      .values({
        userId,
        eventId,
        qrCodeData: qrCode,
        givenBy: user.id,
      })
      .returning();

    set.status = 201;
    return {
      message: "Ticket generated successfully",
      ticket: {
        id: ticket.id,
        qrCodeData: ticket.qrCodeData,
        createdAt: ticket.createdAt,
      },
    };
  }, {
    body: t.Object({
      userId: t.String(),
      eventId: t.String(),
    }),
  })
  // Validate/redeem ticket by QR code
  .post("/redeem", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { qrCode, eventId } = body;

    // Find ticket by QR code
    const ticket = await db.query.skipQueueTickets.findFirst({
      where: eq(skipQueueTickets.qrCodeData, qrCode),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!ticket) {
      set.status = 404;
      return { error: "Invalid ticket code" };
    }

    // Check if already redeemed
    if (ticket.redeemedAt) {
      set.status = 400;
      return {
        error: "Ticket already redeemed",
        redeemedAt: ticket.redeemedAt,
        redeemedAtEvent: ticket.redeemedAtEventId,
      };
    }

    // If eventId provided, validate redeemer is responsible for that event
    if (eventId) {
      const isAdmin = user.role === "admin" || user.role === "superadmin";

      if (!isAdmin) {
        const worker = await db.query.eventWorkers.findFirst({
          where: and(
            eq(eventWorkers.eventId, eventId),
            eq(eventWorkers.userId, user.id),
            eq(eventWorkers.role, "responsible")
          ),
        });

        if (!worker) {
          set.status = 403;
          return { error: "Only admins or event responsible can redeem tickets" };
        }
      }

      // Redeem the ticket
      const [updated] = await db
        .update(skipQueueTickets)
        .set({
          redeemedAt: new Date(),
          redeemedAtEventId: eventId,
        })
        .where(eq(skipQueueTickets.id, ticket.id))
        .returning();

      return {
        message: "Ticket redeemed successfully",
        ticket: {
          id: ticket.id,
          user: ticket.user,
          originalEvent: ticket.event,
          redeemedAt: updated.redeemedAt,
        },
      };
    }

    // Just validate (dry run)
    return {
      valid: true,
      ticket: {
        id: ticket.id,
        user: ticket.user,
        originalEvent: ticket.event,
        createdAt: ticket.createdAt,
      },
    };
  }, {
    body: t.Object({
      qrCode: t.String(),
      eventId: t.Optional(t.String()),
    }),
  })
  // Get ticket statistics (admin only)
  .get("/stats", async ({ user, set }) => {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const allTickets = await db.query.skipQueueTickets.findMany();

    const total = allTickets.length;
    const redeemed = allTickets.filter((t) => t.redeemedAt).length;
    const pending = total - redeemed;

    return {
      stats: {
        total,
        redeemed,
        pending,
      },
    };
  });
