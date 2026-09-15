import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  const location = useLocation();

  const token = localStorage.getItem("quranTeacherAdminToken");
  const storedRole = localStorage.getItem("quranTeacherRole");

  let user = null;

  try {
    const savedUser = localStorage.getItem("quranTeacherAdmin");
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    user = null;
  }

  const isAdmin =
    Boolean(token) &&
    storedRole === "admin" &&
    (!user?.role || user.role === "admin");

  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default ProtectedAdminRoute;
