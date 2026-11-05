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

  // Headers for logged-in API calls
  const authHeader = {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };

  const isAdmin = user?.role === "admin";

  // Pick up role changes made on the server (e.g. someone was made an admin)
  // without asking them to log out and back in.
  useEffect(() => {
    if (!user?.token) return;

    axios
      .get(`${API}/auth/me`, authHeader)
      .then(({ data }) => {
        if (data.role !== user.role || data.name !== user.name) {
          login({ ...user, role: data.role, name: data.name });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  // If the API rejects the saved login (expired token, the account no longer
  // exists, or it was blocked by an admin), log out and go to the login page
  // instead of failing every request.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const url = err.config?.url || "";
        const status = err.response?.status;
        const blocked =
          status === 403 &&
          /blocked/i.test(err.response?.data?.message || "");

        if (
          (status === 401 || blocked) &&
          url.startsWith(API) &&
          localStorage.getItem("user")
        ) {
          localStorage.removeItem("user");
          setUser(null);
          alert(
            blocked
              ? err.response.data.message
              : "Your session has expired. Please log in again."
          );
          window.location.assign("/login");
        }

        return Promise.reject(err);
      }
    );

    return () => axios.interceptors.response.eject(id);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, authHeader, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);