"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api, {
  setTokens,
  clearTokens,
  setAuthCallback,
  loadRefreshToken,
} from "@/lib/api-client";

interface User {
  id: string;
  username: string;
  role?: "admin" | "user";
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  // Restore session from stored refresh token
  useEffect(() => {
    setAuthCallback(logout);

    const rt = loadRefreshToken();
    if (!rt) {
      setIsLoading(false);
      return;
    }

    // Try to refresh the token to restore session
    api
      .post<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
        refreshToken: rt,
      })
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken);
        const decoded = decodeUser(data.accessToken);
        if (decoded) setUser(decoded);
        else clearTokens();
      })
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false));
  }, [logout]);

  // Decode user from JWT payload
  const decodeUser = useCallback((token: string) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return { id: payload.id, username: payload.username, role: payload.role || "user" };
    } catch {
      return null;
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await api.post<{
        tokens: { accessToken: string; refreshToken: string };
        user: { id: string; username: string; role?: "admin" | "user" };
      }>("/auth/login", { username, password });

      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      const decoded = data.user.role
        ? data.user
        : decodeUser(data.tokens.accessToken);
      setUser(decoded || { id: data.user.id, username: data.user.username });
    },
    [decodeUser]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: user?.role === "admin",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
