import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { apiClient, fetchCsrfCookie } from "../services";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_CLINICIAN_TOKEN = "58|lknjIVpL7S43rMpK4wYqfByoLXxnWorNRY0FWEYq1964c504";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem("kv_token");
    if (saved) return saved;
    if (localStorage.getItem("kv_logged_out") === "true") return null;
    // Auto-initialize clinician account marouan.sellami@outlook.com
    localStorage.setItem("kv_token", DEFAULT_CLINICIAN_TOKEN);
    return DEFAULT_CLINICIAN_TOKEN;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 200 && response.data.success) {
          setUser(response.data.data.user);
        } else {
          localStorage.removeItem("kv_token");
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
        localStorage.removeItem("kv_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.removeItem("kv_logged_out");
    localStorage.setItem("kv_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetchCsrfCookie();
        await apiClient.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Logout failed", error);
      }
    }
    localStorage.setItem("kv_logged_out", "true");
    localStorage.removeItem("kv_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
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
