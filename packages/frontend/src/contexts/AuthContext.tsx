import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { eden } from "../eden";

export type UserRole = "unverified" | "user" | "admin" | "superadmin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  educations?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; value?: { message?: string } };
    return err.message || err.value?.message || "An error occurred";
  }
  return "An error occurred";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and validate it
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchUser() {
    try {
      const { data, error } = await eden.auth.me.get();
      if (data?.user) {
        // Also fetch educations from /users/me
        const { data: userData } = await eden.users.me.get();
        const educations = userData?.user?.educations as string[] || [];
        setUser({ ...data.user, educations } as User);
      } else {
        localStorage.removeItem("token");
      }
    } catch {
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { data, error } = await eden.auth.login.post({ email, password });
    if (error) {
      throw new Error(getErrorMessage(error));
    }
    if (data) {
      localStorage.setItem("token", data.token);
      setUser(data.user as User);
    }
  }

  async function register(email: string, name: string, password: string) {
    const { data, error } = await eden.auth.register.post({ email, name, password });
    if (error) {
      throw new Error(getErrorMessage(error));
    }
    if (data) {
      localStorage.setItem("token", data.token);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  async function refreshUser() {
    await fetchUser();
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
