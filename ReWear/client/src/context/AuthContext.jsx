import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

import API from "../utils/api";

const AuthContext = createContext();

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Read synchronously so protected routes don't redirect on refresh
  const [user, setUser] = useState(readStoredUser);

  const login = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // If the API rejects the saved login (expired token, or the account no longer
  // exists, e.g. after switching databases), log out and go to the login page
  // instead of failing every request with "Not authorized".
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const url = err.config?.url || "";

        if (
          err.response?.status === 401 &&
          url.startsWith(API) &&
          localStorage.getItem("user")
        ) {
          localStorage.removeItem("user");
          setUser(null);
          alert("Your session has expired. Please log in again.");
          window.location.assign("/login");
        }

        return Promise.reject(err);
      }
    );

    return () => axios.interceptors.response.eject(id);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);