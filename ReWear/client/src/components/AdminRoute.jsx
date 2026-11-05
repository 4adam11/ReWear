import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Admin-only pages. The server checks the role on every admin request too;
// this just keeps non-admins from seeing an empty panel.
const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
