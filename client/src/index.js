import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import HomePage from "./pages/public/HomePage";

import SchoolLoginPage from "./pages/school/SchoolLoginPage";
import SchoolRegisterPage from "./pages/school/SchoolRegisterPage";
import SchoolDashboardPage from "./pages/school/SchoolDashboardPage";
import SchoolTeachersPage from "./pages/school/SchoolTeachersPage";
import SchoolStudentsPage from "./pages/school/SchoolStudentsPage";

import TeacherLoginPage from "./pages/teacher/TeacherLoginPage";
import TeacherDashboardPage from "./pages/teacher/TeacherDashboardPage";

import ParentLoginPage from "./pages/parent/ParentLoginPage";
import ParentRegisterPage from "./pages/parent/ParentRegisterPage";
import ParentDashboardPage from "./pages/parent/ParentDashboardPage";
import ParentChildDataPage from "./pages/parent/ParentChildDataPage";
import ParentChildProgressPage from "./pages/parent/ParentChildProgressPage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminSchoolRequestPage from "./pages/admin/AdminSchoolRequestPage";
import AdminSchoolsPage from "./pages/admin/AdminSchoolsPage";
import ProtectedAdminRoute from "./pages/admin/ProtectedAdminRoute";

import "./styles/global.css";

class AdminDashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "حدث خطأ غير متوقع أثناء عرض لوحة الإدارة."
    };
  }

  componentDidCatch(error, info) {
    console.error("Admin dashboard render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f7f8fa" }}>
          <section style={{ width: "100%", maxWidth: "560px", padding: "28px", borderRadius: "14px", background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
            <h1>تعذر عرض لوحة الإدارة</h1>
            <p>حدث خطأ أثناء تحميل مكونات لوحة الإدارة. لم يتم حذف أي بيانات.</p>
            <pre style={{ whiteSpace: "pre-wrap", direction: "ltr", textAlign: "left", padding: "12px", background: "#f3f4f6", borderRadius: "8px", fontSize: "12px" }}>{this.state.message}</pre>
            <button type="button" onClick={() => window.location.reload()} style={{ padding: "10px 18px", border: 0, borderRadius: "8px", cursor: "pointer" }}>إعادة تحميل الصفحة</button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/school/login" element={<SchoolLoginPage />} />
        <Route path="/school/register" element={<SchoolRegisterPage />} />
        <Route path="/school/dashboard" element={<SchoolDashboardPage />} />
        <Route path="/school/teachers" element={<SchoolTeachersPage />} />
        <Route path="/school/students" element={<SchoolStudentsPage />} />

        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />

        <Route path="/parent/login" element={<ParentLoginPage />} />
        <Route path="/parent/register" element={<ParentRegisterPage />} />
        <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
        <Route path="/parent/child/:id/data" element={<ParentChildDataPage />} />
        <Route path="/parent/child/:id/progress" element={<ParentChildProgressPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboardErrorBoundary><AdminDashboardPage /></AdminDashboardErrorBoundary>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/school/request"
          element={
            <ProtectedAdminRoute>
              <AdminSchoolRequestPage />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/schools"
          element={
            <ProtectedAdminRoute>
              <AdminSchoolsPage />
            </ProtectedAdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("لم يتم العثور على عنصر root في ملف HTML.");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
