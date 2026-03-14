import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db, events, eventReports, eventWorkers } from "../db";
import { authMiddleware, requireAuth, isAdmin } from "../middleware/auth";

export const eventReportRoutes = new Elysia({ prefix: "/events/:eventId" })
  .use(authMiddleware)
  // Get event report (visible to admin and responsible)
  .get("/report", async ({ params, user, set }) => {
    const event = await db.query.events.findFirst({
      where: eq(events.id, params.eventId),
      with: {
        workers: true,
      },
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    // Check if user is responsible for this event or admin
    const isResponsible = event.workers.some(
      (w) => w.userId === user?.id && w.isResponsible
    );
    const isAdminUser = user ? isAdmin(user.role) : false;

    if (!isResponsible && !isAdminUser) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const report = await db.query.eventReports.findFirst({
      where: eq(eventReports.eventId, params.eventId),
      with: {
        createdByUser: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      return {
        report: null,
        canEdit: isResponsible || isAdminUser,
      };
    }

    return {
      report: {
        id: report.id,
        whoWorked: report.whoWorked,
        summary: report.summary,
        finances: report.finances,
        other: report.other,
        createdBy: report.createdByUser,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
      canEdit: isResponsible || isAdminUser,
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    beforeHandle: [requireAuth],
  })
  // Create or update event report
  .post("/report", async ({ params, user, body, set }) => {
    const event = await db.query.events.findFirst({
      where: eq(events.id, params.eventId),
      with: {
        workers: true,
      },
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    // Check if user is responsible for this event or admin
    const isResponsible = event.workers.some(
      (w) => w.userId === user!.id && w.isResponsible
    );
    const isAdminUser = isAdmin(user!.role);

    if (!isResponsible && !isAdminUser) {
      set.status = 403;
      return { error: "Only responsible or admin can create reports" };
    }

    // Check if report already exists
    const existingReport = await db.query.eventReports.findFirst({
      where: eq(eventReports.eventId, params.eventId),
    });

    if (existingReport) {
      // Update existing report
      const [updated] = await db
        .update(eventReports)
        .set({
          whoWorked: body.whoWorked ?? existingReport.whoWorked,
          summary: body.summary ?? existingReport.summary,
          finances: body.finances ?? existingReport.finances,
          other: body.other ?? existingReport.other,
          updatedAt: new Date(),
        })
        .where(eq(eventReports.id, existingReport.id))
        .returning();

      return {
        message: "Report updated successfully",
        report: updated,
      };
    }

    // Create new report
    const [report] = await db
      .insert(eventReports)
      .values({
        eventId: params.eventId,
        whoWorked: body.whoWorked,
        summary: body.summary,
        finances: body.finances,
        other: body.other,
        createdBy: user!.id,
      })
      .returning();

    set.status = 201;
    return {
      message: "Report created successfully",
      report,
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    body: t.Object({
      whoWorked: t.Optional(t.String()),
      summary: t.Optional(t.String()),
      finances: t.Optional(t.String()),
      other: t.Optional(t.String()),
    }),
    beforeHandle: [requireAuth],
  })
  // Update report (alternative endpoint)
  .put("/report", async ({ params, user, body, set }) => {
    const event = await db.query.events.findFirst({
      where: eq(events.id, params.eventId),
      with: {
        workers: true,
      },
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    // Check if user is responsible for this event or admin
    const isResponsible = event.workers.some(
      (w) => w.userId === user!.id && w.isResponsible
    );
    const isAdminUser = isAdmin(user!.role);

    if (!isResponsible && !isAdminUser) {
      set.status = 403;
      return { error: "Only responsible or admin can update reports" };
    }

    const existingReport = await db.query.eventReports.findFirst({
      where: eq(eventReports.eventId, params.eventId),
    });

    if (!existingReport) {
      set.status = 404;
      return { error: "Report not found. Create one first." };
    }

    const [updated] = await db
      .update(eventReports)
      .set({
        whoWorked: body.whoWorked !== undefined ? body.whoWorked : existingReport.whoWorked,
        summary: body.summary !== undefined ? body.summary : existingReport.summary,
        finances: body.finances !== undefined ? body.finances : existingReport.finances,
        other: body.other !== undefined ? body.other : existingReport.other,
        updatedAt: new Date(),
      })
      .where(eq(eventReports.id, existingReport.id))
      .returning();

    return {
      message: "Report updated successfully",
      report: updated,
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    body: t.Object({
      whoWorked: t.Optional(t.String()),
      summary: t.Optional(t.String()),
      finances: t.Optional(t.String()),
      other: t.Optional(t.String()),
    }),
    beforeHandle: [requireAuth],
  });
