import { Elysia, t } from "elysia";
import { eq, and, gte, desc, asc, count, sql } from "drizzle-orm";
import { db, eventWorkers, events, users, skipQueueTickets, guestLists, locations } from "../db";
import { authMiddleware, requireAuth } from "../middleware/auth";

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

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .use(authMiddleware)
  // Get current user's dashboard data
  .get("/", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const now = new Date();

    // 1. Get upcoming events (events user has signed up for that haven't ended yet)
    const upcomingEventsData = await db.query.eventWorkers.findMany({
      where: eq(eventWorkers.userId, user.id),
      with: {
        event: {
          with: {
            location: {
              columns: {
                id: true,
                name: true,
              },
            },
            guests: true,
          },
        },
      },
      orderBy: [asc(eventWorkers.createdAt)],
    });

    // Filter to only upcoming events (not ended yet) and format them
    const upcomingEvents = upcomingEventsData
      .filter((ew) => new Date(ew.event.endTime) > now)
      .slice(0, 5)
      .map((ew) => ({
        id: ew.event.id,
        title: ew.event.title,
        type: ew.event.type,
        status: ew.event.status,
        startTime: ew.event.startTime,
        endTime: ew.event.endTime,
        timeDisplay: formatEventTime(ew.event.startTime, ew.event.endTime),
        location: ew.event.location,
        isResponsible: ew.isResponsible,
        guestCount: ew.event.guests.length,
        maxGuests: ew.event.maxGuests,
      }));

    // 2. Get user stats
    // Total events worked (completed events user signed up for)
    const completedEvents = await db
      .select({ count: count() })
      .from(eventWorkers)
      .innerJoin(events, eq(eventWorkers.eventId, events.id))
      .where(
        and(
          eq(eventWorkers.userId, user.id),
          gte(events.endTime, now),
          eq(events.givesPoints, true)
        )
      );

    // Actually count past events that have ended
    const pastEventsWorked = await db
      .select({ count: count() })
      .from(eventWorkers)
      .innerJoin(events, eq(eventWorkers.eventId, events.id))
      .where(
        and(
          eq(eventWorkers.userId, user.id),
          sql`${events.endTime} < ${now}`,
          eq(events.givesPoints, true)
        )
      );

    const eventsWorked = pastEventsWorked[0]?.count || 0;

    // Get rank
    let rank: number | null = null;
    if (eventsWorked > 0) {
      const higherRanked = await db
        .select({ userId: eventWorkers.userId })
        .from(eventWorkers)
        .innerJoin(events, eq(eventWorkers.eventId, events.id))
        .where(
          and(
            eq(events.givesPoints, true),
            sql`${events.endTime} < ${now}`
          )
        )
        .groupBy(eventWorkers.userId)
        .having(sql`count(*) > ${eventsWorked}`);

      rank = higherRanked.length + 1;
    }

    // 3. Get ticket count
    const ticketCount = await db
      .select({ count: count() })
      .from(skipQueueTickets)
      .where(
        and(
          eq(skipQueueTickets.userId, user.id),
          sql`${skipQueueTickets.redeemedAt} IS NULL`
        )
      );

    // 4. Get upcoming events count
    const upcomingEventsCount = await db
      .select({ count: count() })
      .from(eventWorkers)
      .innerJoin(events, eq(eventWorkers.eventId, events.id))
      .where(
        and(
          eq(eventWorkers.userId, user.id),
          gte(events.endTime, now)
        )
      );

    // 5. Get recent activity (guest list signups for user's events)
    const recentActivity = await db.query.guestLists.findMany({
      where: eq(guestLists.signedUpBy, user.id),
      orderBy: [desc(guestLists.createdAt)],
      limit: 5,
      with: {
        event: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    });

    const formattedActivity = recentActivity.map((guest) => ({
      type: "guest_signup" as const,
      id: guest.id,
      eventId: guest.event.id,
      eventTitle: guest.event.title,
      guestName: guest.guestName,
      createdAt: guest.createdAt,
    }));

    return {
      stats: {
        eventsWorked,
        rank,
        ticketsCount: ticketCount[0]?.count || 0,
        upcomingEventsCount: upcomingEventsCount[0]?.count || 0,
      },
      upcomingEvents,
      recentActivity: formattedActivity,
    };
  });
