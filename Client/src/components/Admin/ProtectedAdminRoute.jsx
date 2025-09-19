// src/components/Admin/ProtectedAdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  // ✅ If not logged in → redirect to login
  if (!admin) return <Navigate to="/adminLogin" replace />;

  return children;
}
