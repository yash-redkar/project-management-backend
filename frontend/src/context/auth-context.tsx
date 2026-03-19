"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "@/services/auth.service";

type AuthContextType = {
  user: any;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  setUser: (user: any) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authService.getCurrentUser();
      setUser(res?.data || res?.user || res || null);
    } catch (error) {
      console.error("Failed to fetch current user", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      refreshUser,
      clearUser,
      setUser,
    }),
    [user, isLoading, refreshUser, clearUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
