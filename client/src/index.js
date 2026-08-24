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

import "./styles/global.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/school/login"
          element={<SchoolLoginPage />}
        />

        <Route
          path="/school/register"
          element={<SchoolRegisterPage />}
        />

        <Route
          path="/school/dashboard"
          element={<SchoolDashboardPage />}
        />

        <Route
          path="/school/teachers"
          element={<SchoolTeachersPage />}
        />

        <Route
          path="/school/students"
          element={<SchoolStudentsPage />}
        />

        <Route
          path="/teacher/login"
          element={<TeacherLoginPage />}
        />

        <Route
          path="/teacher/dashboard"
          element={<TeacherDashboardPage />}
        />

        <Route
          path="/parent/login"
          element={<ParentLoginPage />}
        />

        <Route
          path="/parent/register"
          element={<ParentRegisterPage />}
        />

        <Route
          path="/parent/dashboard"
          element={<ParentDashboardPage />}
        />

        <Route
          path="/parent/child/:id/data"
          element={<ParentChildDataPage />}
        />

        <Route
          path="/parent/child/:id/progress"
          element={<ParentChildProgressPage />}
        />

        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />

        <Route
          path="/admin"
          element={<AdminDashboardPage />}
        />

        <Route
          path="/admin/school/request"
          element={<AdminSchoolRequestPage />}
        />

        <Route
          path="/admin/schools"
          element={<AdminSchoolsPage />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "لم يتم العثور على عنصر root في ملف HTML."
  );
}

const root =
  createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);