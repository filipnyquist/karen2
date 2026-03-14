import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { db, users } from "../db";
import type { UserRole } from "../db/schema";
export type { UserRole };

// JWT Payload type
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Auth context type
export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    emailVerified: boolean;
  } | null;
}

// Role hierarchy for permission checking
const roleHierarchy: Record<UserRole, number> = {
  unverified: 0,
  user: 1,
  admin: 2,
  superadmin: 3,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

export const authMiddleware = new Elysia({ name: "auth" })
  .use(
    jwt({
      secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
      exp: "7d",
    })
  )
  .derive({ as: "scoped" }, async ({ jwt, cookie, set, headers }): Promise<AuthContext> => {
    // Try to get token from cookie first, then Authorization header
    let token: string | undefined = cookie?.auth?.value;

    if (!token) {
      const authHeader = headers["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return { user: null };
    }

    try {
      const payload = await jwt.verify(token);
      if (!payload || typeof payload !== "object" || !payload.userId) {
        return { user: null };
      }

      // Fetch fresh user data from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId as string),
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          deactivated: true,
        },
      });

      if (!user || user.deactivated) {
        return { user: null };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          emailVerified: user.emailVerified,
        },
      };
    } catch {
      return { user: null };
    }
  });

// Middleware to require authentication
export const requireAuth = new Elysia({ name: "requireAuth" }).onBeforeHandle(
  ({ user, set }: { user: AuthContext["user"]; set: { status: number } }) => {
    if (!user) {
      set.status = 401;
      return { error: "Authentication required" };
    }
  }
);

// Middleware to require specific role
export function requireRole(role: UserRole) {
  return new Elysia({ name: `requireRole-${role}` }).onBeforeHandle(
    ({ user, set }: { user: AuthContext["user"]; set: { status: number } }) => {
      if (!user) {
        set.status = 401;
        return { error: "Authentication required" };
      }

      if (!hasRole(user.role, role)) {
        set.status = 403;
        return { error: "Insufficient permissions" };
      }
    }
  );
}

// Middleware to require verified email
export const requireVerified = new Elysia({
  name: "requireVerified",
}).onBeforeHandle(({ user, set }: { user: AuthContext["user"]; set: { status: number } }) => {
  if (!user) {
    set.status = 401;
    return { error: "Authentication required" };
  }

  if (!user.emailVerified) {
    set.status = 403;
    return { error: "Email verification required" };
  }
});

// Middleware to require admin access
export const requireAdmin = new Elysia({ name: "requireAdmin" }).onBeforeHandle(
  ({ user, set }: { user: AuthContext["user"]; set: { status: number } }) => {
    if (!user) {
      set.status = 401;
      return { error: "Authentication required" };
    }

    if (!isAdmin(user.role)) {
      set.status = 403;
      return { error: "Admin access required" };
    }
  }
);
