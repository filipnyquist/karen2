import { Elysia, t } from "elysia";
import { eq, desc } from "drizzle-orm";
import { db, frontPageNotices } from "../db";
import { authMiddleware, requireAdmin } from "../middleware/auth";

export const adminFrontpageRoutes = new Elysia({ prefix: "/admin" })
  .use(authMiddleware)
  // Get current frontpage notice (admin only)
  .get("/frontpage", async ({ user, set }) => {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const notice = await db.query.frontPageNotices.findFirst({
      orderBy: [desc(frontPageNotices.createdAt)],
    });

    return {
      notice: notice || null,
    };
  })
  // Create or update frontpage notice (admin only)
  .post("/frontpage", async ({ body, user, set }) => {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const { title, content, isActive } = body;

    // Check if there's an existing notice
    const existing = await db.query.frontPageNotices.findFirst({
      orderBy: [desc(frontPageNotices.createdAt)],
    });

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(frontPageNotices)
        .set({
          title: title !== undefined ? title : existing.title,
          content,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(frontPageNotices.id, existing.id))
        .returning();

      return {
        message: "Notice updated successfully",
        notice: updated,
      };
    }

    // Create new notice
    const [notice] = await db
      .insert(frontPageNotices)
      .values({
        title,
        content,
        isActive,
      })
      .returning();

    set.status = 201;
    return {
      message: "Notice created successfully",
      notice,
    };
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      content: t.String(),
      isActive: t.Boolean(),
    }),
  });
