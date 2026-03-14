import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db, users, userEducations } from "../db";
import { authMiddleware, requireAdmin } from "../middleware/auth";

export const adminEducationRoutes = new Elysia({ prefix: "/admin" })
  .use(authMiddleware)
  .use(requireAdmin)
  // Get user's educations
  .get("/users/:id/educations", async ({ params, set }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, params.id),
    });

    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    const educations = await db.query.userEducations.findMany({
      where: eq(userEducations.userId, params.id),
      with: {
        assignedByUser: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [userEducations.assignedAt],
    });

    return {
      educations: educations.map((e) => ({
        id: e.id,
        type: e.educationType,
        assignedBy: e.assignedByUser,
        assignedAt: e.assignedAt,
      })),
    };
  }, {
    params: t.Object({
      id: t.String(),
    }),
  })
  // Assign education to user
  .post("/users/:id/educations", async ({ params, user, body, set }) => {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, params.id),
    });

    if (!targetUser) {
      set.status = 404;
      return { error: "User not found" };
    }

    // Check if education already exists
    const existing = await db.query.userEducations.findFirst({
      where: and(
        eq(userEducations.userId, params.id),
        eq(userEducations.educationType, body.educationType)
      ),
    });

    if (existing) {
      set.status = 400;
      return { error: "User already has this education" };
    }

    const [education] = await db
      .insert(userEducations)
      .values({
        userId: params.id,
        educationType: body.educationType,
        assignedBy: user!.id,
      })
      .returning();

    set.status = 201;
    return {
      message: "Education assigned successfully",
      education: {
        id: education.id,
        type: education.educationType,
        assignedAt: education.assignedAt,
      },
    };
  }, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      educationType: t.String(), // pub_worker, aas, responsible
    }),
  })
  // Remove education from user
  .delete("/users/:id/educations/:educationId", async ({ params, set }) => {
    const education = await db.query.userEducations.findFirst({
      where: and(
        eq(userEducations.id, params.educationId),
        eq(userEducations.userId, params.id)
      ),
    });

    if (!education) {
      set.status = 404;
      return { error: "Education not found" };
    }

    await db
      .delete(userEducations)
      .where(eq(userEducations.id, params.educationId));

    return { message: "Education removed successfully" };
  }, {
    params: t.Object({
      id: t.String(),
      educationId: t.String(),
    }),
  });
