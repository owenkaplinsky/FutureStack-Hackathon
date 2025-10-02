import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const userId = localStorage.getItem("userId"); 

  if (!userId) return <Navigate to="/login" replace />;

  return children;
}
