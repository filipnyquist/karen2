import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db, users, userEducations } from "../db";
import { authMiddleware, requireAuth } from "../middleware/auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .use(requireAuth)
  // Get current user profile
  .get("/me", async ({ user }) => {
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        emailVerified: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      return { error: "User not found" };
    }

    // Fetch educations separately to avoid relation ambiguity
    const educationsList = await db
      .select({
        educationType: userEducations.educationType,
        assignedAt: userEducations.assignedAt,
      })
      .from(userEducations)
      .where(eq(userEducations.userId, user.id));

    return {
      user: {
        ...userData,
        educations: educationsList.map((e) => e.educationType),
      },
    };
  })
  // Update current user profile
  .put("/me", async ({ user, body, set }) => {
    const updateData: {
      name?: string;
      nickname?: string | null;
      profilePicture?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.nickname !== undefined) {
      updateData.nickname = body.nickname;
    }

    if (body.profilePicture !== undefined) {
      updateData.profilePicture = body.profilePicture;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        nickname: users.nickname,
        role: users.role,
        emailVerified: users.emailVerified,
        profilePicture: users.profilePicture,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!updated) {
      set.status = 404;
      return { error: "User not found" };
    }

    return {
      message: "Profile updated successfully",
      user: updated,
    };
  }, {
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      nickname: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 255 }), t.Null()])),
      profilePicture: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 255 }), t.Null()])),
    }),
  });
