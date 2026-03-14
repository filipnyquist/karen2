import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";
import { db, users, type UserRole } from "../db";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  sendEmail,
  generateVerificationEmailHtml,
  generatePasswordResetEmailHtml,
} from "../lib/email";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import crypto from "crypto";

// Generate random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
      exp: "7d",
    })
  )
  .use(authMiddleware)
  // Register
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      const { email, name, password } = body;

      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (existingUser) {
        set.status = 400;
        return { error: "Email already registered" };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Generate verification token
      const verificationToken = generateToken();

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          name,
          password: hashedPassword,
          emailVerificationToken: verificationToken,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: email,
        subject: "Verify your email - Karen2",
        html: generateVerificationEmailHtml(name, verificationUrl),
      });

      // Generate JWT
      const token = await jwt.sign({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role as UserRole,
      });

      return {
        message:
          "Registration successful. Please check your email to verify your account.",
        user: newUser,
        token,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        name: t.String({ minLength: 2, maxLength: 255 }),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  // Login
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user || user.deactivated) {
        set.status = 401;
        return { error: "Invalid email or password" };
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password);

      if (!isValid) {
        set.status = 401;
        return { error: "Invalid email or password" };
      }

      // Generate JWT
      const token = await jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          emailVerified: user.emailVerified,
        },
        token,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )
  // Verify email
  .post(
    "/verify-email",
    async ({ body, set }) => {
      const { token } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.emailVerificationToken, token),
      });

      if (!user) {
        set.status = 400;
        return { error: "Invalid or expired verification token" };
      }

      // Update user
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          role: "user", // Upgrade from unverified to user
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return { message: "Email verified successfully" };
    },
    {
      body: t.Object({
        token: t.String(),
      }),
    }
  )
  // Forgot password
  .post(
    "/forgot-password",
    async ({ body }) => {
      const { email } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user || user.deactivated) {
        // Return success even if user not found (security)
        return {
          message:
            "If an account exists with this email, a password reset link has been sent.",
        };
      }

      // Generate reset token
      const resetToken = generateToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: email,
        subject: "Reset your password - Karen2",
        html: generatePasswordResetEmailHtml(user.name, resetUrl),
      });

      return {
        message:
          "If an account exists with this email, a password reset link has been sent.",
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
    }
  )
  // Reset password
  .post(
    "/reset-password",
    async ({ body, set }) => {
      const { token, password } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.passwordResetToken, token),
      });

      if (!user || !user.passwordResetExpires) {
        set.status = 400;
        return { error: "Invalid or expired reset token" };
      }

      if (new Date() > user.passwordResetExpires) {
        set.status = 400;
        return { error: "Reset token has expired" };
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return { message: "Password reset successfully" };
    },
    {
      body: t.Object({
        token: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  // Get current user
  .get("/me", async ({ user, set }: { user: AuthContext["user"]; set: { status: number } }) => {
    if (!user) {
      set.status = 401;
      return { error: "Not authenticated" };
    }

    return { user };
  });
