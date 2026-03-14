import { Elysia, t } from "elysia";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { db, eventWorkers, events, users } from "../db";
import { authMiddleware } from "../middleware/auth";

export const scoreboardRoutes = new Elysia({ prefix: "/scoreboard" })
  .use(authMiddleware)
  // Get scoreboard with optional time period filter
  .get("/", async ({ query }) => {
    const { period = "all" } = query;

    // Build date filters based on period
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (period === "year") {
      // Current calendar year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
    } else if (period === "semester") {
      // Swedish academic calendar: Spring (Jan-June), Autumn (Aug-Dec)
      const month = now.getMonth(); // 0-11
      const year = now.getFullYear();

      if (month >= 0 && month <= 5) {
        // Spring semester: Jan 1 - June 30
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 6, 1);
      } else if (month >= 7 && month <= 11) {
        // Autumn semester: Aug 1 - Dec 31
        startDate = new Date(year, 7, 1);
        endDate = new Date(year + 1, 0, 1);
      } else {
        // July - show previous semester or all time
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 6, 1);
      }
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Build the query conditions
    const conditions: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof gte> | ReturnType<typeof lte> | undefined)[] = [
      eq(events.givesPoints, true),
    ];

    if (startDate) {
      conditions.push(gte(events.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(events.startTime, endDate));
    }

    const whereClause = and(...conditions);

    // Get worker stats grouped by user
    const workerStats = await db
      .select({
        userId: eventWorkers.userId,
        userName: users.name,
        userProfilePicture: users.profilePicture,
        count: count(),
      })
      .from(eventWorkers)
      .innerJoin(events, eq(eventWorkers.eventId, events.id))
      .innerJoin(users, eq(eventWorkers.userId, users.id))
      .where(whereClause)
      .groupBy(eventWorkers.userId, users.name, users.profilePicture)
      .orderBy(desc(count()));

    // Add rankings
    const rankedStats = workerStats.map((stat, index) => ({
      rank: index + 1,
      userId: stat.userId,
      name: stat.userName,
      profilePicture: stat.userProfilePicture,
      eventsWorked: stat.count,
    }));

    return {
      period,
      periodLabel: getPeriodLabel(period, startDate, endDate),
      scoreboard: rankedStats,
    };
  }, {
    query: t.Object({
      period: t.Optional(t.Union([t.Literal("all"), t.Literal("year"), t.Literal("semester"), t.Literal("month")])),
    }),
  })
  // Get current user's ranking and stats
  .get("/me", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    // Count events worked
    const eventsWorked = await db
      .select({ count: count() })
      .from(eventWorkers)
      .innerJoin(events, eq(eventWorkers.eventId, events.id))
      .where(
        and(
          eq(eventWorkers.userId, user.id),
          eq(events.givesPoints, true)
        )
      );

    const countValue = eventsWorked[0]?.count || 0;

    // Get rank by counting users with more events
    const higherRanked = await db
      .select({ userId: eventWorkers.userId })
      .from(eventWorkers)
      .innerJoin(events, eq(eventWorkers.eventId, events.id))
      .where(
        and(
          eq(events.givesPoints, true)
        )
      )
      .groupBy(eventWorkers.userId)
      .having(sql`count(*) > ${countValue}`);

    const rank = higherRanked.length + 1;

    return {
      userId: user.id,
      name: user.name,
      eventsWorked: countValue,
      rank: countValue > 0 ? rank : null,
    };
  });

function getPeriodLabel(period: string, startDate?: Date, endDate?: Date): string {
  if (period === "all") return "All Time";
  if (period === "year") return new Date().getFullYear().toString();
  if (period === "semester") {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    if (month >= 0 && month <= 5) return `Spring ${year}`;
    if (month >= 7 && month <= 11) return `Autumn ${year}`;
    return `Spring ${year}`;
  }
  if (period === "month") {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return "All Time";
}
