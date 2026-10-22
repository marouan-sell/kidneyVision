import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { User } from "../types";
import { apiClient, fetchCsrfCookie } from "../services";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isSessionLocked: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  lockSession: () => void;
  unlockSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 15 minutes of inactivity before locking the session (HIPAA/GDPR security compliance)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("kv_token");
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(() => {
    return sessionStorage.getItem("kv_session_locked") === "true";
  });

  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckIntervalRef = useRef<number | null>(null);

  const lockSession = useCallback(() => {
    if (token) {
      setIsSessionLocked(true);
      sessionStorage.setItem("kv_session_locked", "true");
    }
  }, [token]);

  const unlockSession = useCallback(() => {
    setIsSessionLocked(false);
    sessionStorage.removeItem("kv_session_locked");
    lastActivityRef.current = Date.now();
  }, []);

  // Update activity timestamp on meaningful user interaction
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    // Throttle timestamp updates to at most once per 2 seconds
    if (now - lastActivityRef.current > 2000) {
      lastActivityRef.current = now;
    }
  }, []);

  // Setup inactivity monitoring when logged in
  useEffect(() => {
    if (!token || isSessionLocked) {
      if (timerCheckIntervalRef.current) {
        window.clearInterval(timerCheckIntervalRef.current);
        timerCheckIntervalRef.current = null;
      }
      return;
    }

    lastActivityRef.current = Date.now();

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    // Check inactivity every 10 seconds
    timerCheckIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        lockSession();
      }
    }, 10000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      if (timerCheckIntervalRef.current) {
        window.clearInterval(timerCheckIntervalRef.current);
        timerCheckIntervalRef.current = null;
      }
    };
  }, [token, isSessionLocked, handleUserActivity, lockSession]);

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
          sessionStorage.removeItem("kv_session_locked");
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
        localStorage.removeItem("kv_token");
        sessionStorage.removeItem("kv_session_locked");
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
    sessionStorage.removeItem("kv_session_locked");
    localStorage.setItem("kv_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setIsSessionLocked(false);
    lastActivityRef.current = Date.now();
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
    sessionStorage.removeItem("kv_session_locked");
    setToken(null);
    setUser(null);
    setIsSessionLocked(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        loading, 
        isSessionLocked,
        login, 
        logout, 
        updateUser,
        lockSession,
        unlockSession,
      }}
    >
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
