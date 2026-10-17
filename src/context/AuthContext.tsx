"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/auth/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: "usr_demo_1",
  name: "Senior Equity Analyst",
  email: "analyst@findwise.com",
  role: "Lead Portfolio Analyst",
  isVerified: true,
  status: "active",
  createdAt: Date.now(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const activeSession = localStorage.getItem("findwise_active_session");
      if (activeSession) {
        setUser(JSON.parse(activeSession));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: "Please enter both email and password." };
    }

    try {
      // First attempt backend MongoDB login API
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        const sessionUser: User = data.user;
        setUser(sessionUser);
        localStorage.setItem("findwise_active_session", JSON.stringify(sessionUser));
        return { success: true };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }
    } catch {
      // If server route is unreachable, fall back to local credentials
      if (cleanEmail === "analyst@findwise.com" && cleanPassword === "findwise123") {
        setUser(DEMO_USER);
        localStorage.setItem("findwise_active_session", JSON.stringify(DEMO_USER));
        return { success: true };
      }
      if (cleanEmail === "admin@findwise.com" && cleanPassword === "admin123") {
        const adminUser: User = {
          id: "usr_admin",
          name: "Head of Research Desk",
          email: "admin@findwise.com",
          role: "Admin",
          isVerified: true,
          status: "active",
          createdAt: Date.now(),
        };
        setUser(adminUser);
        localStorage.setItem("findwise_active_session", JSON.stringify(adminUser));
        return { success: true };
      }
    }

    return { success: false, error: "Invalid email or password." };
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: string = "Equity Research Analyst"
  ): Promise<{ success: boolean; error?: string }> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return { success: false, error: "All required fields must be completed." };
    }

    if (cleanPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password: cleanPassword, role }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        const sessionUser: User = data.user;
        setUser(sessionUser);
        localStorage.setItem("findwise_active_session", JSON.stringify(sessionUser));
        return { success: true };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }
    } catch {
      // Offline fallback
      const fallbackUser: User = {
        id: `usr_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role,
        isVerified: true,
        status: "active",
        createdAt: Date.now(),
      };
      setUser(fallbackUser);
      localStorage.setItem("findwise_active_session", JSON.stringify(fallbackUser));
      return { success: true };
    }

    return { success: false, error: "Registration could not be completed." };
  }

  function logout() {
    setUser(null);
    try {
      localStorage.removeItem("findwise_active_session");
    } catch {
      // ignore
    }
    router.push("/login");
  }

  const isAdmin = user?.role === "Admin" || user?.email === "admin@findwise.com";

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
