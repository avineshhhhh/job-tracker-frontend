import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  getAuthHeaders: () => { Authorization: string } | {};
}

interface UserProfile {
  id: string;
  email?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Function to extract user info from JWT token
  const parseJwt = (token: string) => {
    try {
      // Split the token and get the middle part (payload)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Failed to parse token:", error);
      return null;
    }
  };

  // Function to check if token is expired
  const isTokenExpired = (token: string) => {
    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.exp) return true;

    // Token expiration is in seconds, Date.now() is in milliseconds
    const expirationTime = decodedToken.exp * 1000;
    return Date.now() >= expirationTime;
  };

  // Setup user from token
  const setupUserFromToken = (authToken: string) => {
    try {
      if (!authToken) return false;

      if (isTokenExpired(authToken)) {
        console.log("Token is expired");
        localStorage.removeItem("token");
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      const decoded = parseJwt(authToken);
      if (decoded && decoded.sub) {
        console.log("Setting up user from token, user ID:", decoded.sub);
        setUser({
          id: decoded.sub,
        });
        setToken(authToken);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token validation failed:", error);
      localStorage.removeItem("token");
      setToken(null);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  // Check token on mount and set authentication state
  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem("token");
      console.log("Checking auth, token exists:", !!storedToken);

      if (storedToken) {
        setupUserFromToken(storedToken);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (newToken: string) => {
    console.log("Login called with token");
    localStorage.setItem("token", newToken);
    setupUserFromToken(newToken);
  };

  const logout = () => {
    console.log("Logout called");
    localStorage.removeItem("token");
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  };

  const getAuthHeaders = () => {
    const currentToken = token || localStorage.getItem("token");
    return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        isLoading,
        getAuthHeaders,
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
