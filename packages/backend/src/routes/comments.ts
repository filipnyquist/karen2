import { Elysia, t } from "elysia";
import { eq, and, desc } from "drizzle-orm";
import { db, events, eventComments } from "../db";
import { authMiddleware, requireAuth, isAdmin } from "../middleware/auth";

export const commentRoutes = new Elysia({ prefix: "/events/:eventId" })
  .use(authMiddleware)
  // Get comments for event
  .get("/comments", async ({ params, set }) => {
    const eventId = params.eventId;

    // Verify event exists
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    const comments = await db.query.eventComments.findMany({
      where: eq(eventComments.eventId, eventId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [desc(eventComments.createdAt)],
    });

    return {
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        user: c.user,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        isEdited: c.updatedAt.getTime() !== c.createdAt.getTime(),
      })),
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
  })
  // Add comment
  .post("/comments", async ({ params, user, body, set }) => {
    const eventId = params.eventId;

    // Verify event exists
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      set.status = 404;
      return { error: "Event not found" };
    }

    const [comment] = await db
      .insert(eventComments)
      .values({
        eventId,
        userId: user!.id,
        content: body.content,
      })
      .returning();

    // Fetch the comment with user info
    const commentWithUser = await db.query.eventComments.findFirst({
      where: eq(eventComments.id, comment.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    set.status = 201;
    return {
      message: "Comment added successfully",
      comment: {
        id: commentWithUser!.id,
        content: commentWithUser!.content,
        user: commentWithUser!.user,
        createdAt: commentWithUser!.createdAt,
        updatedAt: commentWithUser!.updatedAt,
        isEdited: false,
      },
    };
  }, {
    params: t.Object({
      eventId: t.String(),
    }),
    body: t.Object({
      content: t.String({ minLength: 1, maxLength: 2000 }),
    }),
    beforeHandle: [requireAuth],
  })
  // Update comment
  .put("/comments/:commentId", async ({ params, user, body, set }) => {
    const { eventId, commentId } = params;

    // Find comment
    const comment = await db.query.eventComments.findFirst({
      where: and(
        eq(eventComments.id, commentId),
        eq(eventComments.eventId, eventId)
      ),
    });

    if (!comment) {
      set.status = 404;
      return { error: "Comment not found" };
    }

    // Check ownership
    if (comment.userId !== user!.id) {
      set.status = 403;
      return { error: "You can only edit your own comments" };
    }

    const [updated] = await db
      .update(eventComments)
      .set({
        content: body.content,
        updatedAt: new Date(),
      })
      .where(eq(eventComments.id, commentId))
      .returning();

    return {
      message: "Comment updated successfully",
      comment: {
        id: updated.id,
        content: updated.content,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        isEdited: true,
      },
    };
  }, {
    params: t.Object({
      eventId: t.String(),
      commentId: t.String(),
    }),
    body: t.Object({
      content: t.String({ minLength: 1, maxLength: 2000 }),
    }),
    beforeHandle: [requireAuth],
  })
  // Delete comment
  .delete("/comments/:commentId", async ({ params, user, set }) => {
    const { eventId, commentId } = params;

    // Find comment
    const comment = await db.query.eventComments.findFirst({
      where: and(
        eq(eventComments.id, commentId),
        eq(eventComments.eventId, eventId)
      ),
    });

    if (!comment) {
      set.status = 404;
      return { error: "Comment not found" };
    }

    // Check ownership or admin
    const isOwner = comment.userId === user!.id;
    const isAdminUser = isAdmin(user!.role);

    if (!isOwner && !isAdminUser) {
      set.status = 403;
      return { error: "You can only delete your own comments" };
    }

    await db.delete(eventComments).where(eq(eventComments.id, commentId));

    return { message: "Comment deleted successfully" };
  }, {
    params: t.Object({
      eventId: t.String(),
      commentId: t.String(),
    }),
    beforeHandle: [requireAuth],
  });
