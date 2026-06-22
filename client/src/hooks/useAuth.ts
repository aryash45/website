import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  username: string;
  role: string;
  email: string | null;
  phone: string | null;
  addresses: any[];
  createdAt: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the current session user on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setIsAuthenticated(true);
          setIsAdmin(userData.role === "admin");
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.role === "admin");
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      return null;
    }
  };

  const register = async (username: string, email: string, password: string, phone?: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", { username, email, password, phone });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.role === "admin");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return {
    isAuthenticated,
    isAdmin,
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  };
}