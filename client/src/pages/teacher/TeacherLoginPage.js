import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./TeacherLoginPage.css";

const API_URL = "http://localhost:5000/api";

function TeacherLoginPage() {
  const navigate = useNavigate();

  const [teacherCode, setTeacherCode] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/teacher/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            teacherCode: teacherCode.trim(),
            password
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر تسجيل الدخول."
        );
      }

      localStorage.setItem(
        "quranTeacherToken",
        result.token
      );

      localStorage.setItem(
        "quranTeacherRole",
        "teacher"
      );

      localStorage.setItem(
        "quranTeacherTeacher",
        JSON.stringify(result.teacher)
      );

      navigate("/teacher/dashboard", {
        replace: true
      });
    } catch (loginError) {
      console.error(
        "Teacher login failed:",
        loginError
      );

      setError(
        loginError.message ||
          "حدث خطأ أثناء تسجيل الدخول."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="teacher-login-page">

      <section className="teacher-login-card">

        <div className="teacher-login-header">

          <div className="teacher-login-logo">
            م
          </div>

          <h1>
            دخول المعلم
          </h1>

          <p>
            أدخل معرف المعلم وكلمة المرور
            للوصول إلى لوحة المعلم.
          </p>

        </div>

        {error && (
          <div className="teacher-login-error">
            {error}
          </div>
        )}

        <form
          className="teacher-login-form"
          onSubmit={handleSubmit}
        >

          <div className="teacher-login-field">
            <label htmlFor="teacher-code">
              معرف المعلم
            </label>

            <input
              id="teacher-code"
              type="text"
              value={teacherCode}
              onChange={(event) =>
                setTeacherCode(
                  event.target.value
                )
              }
              placeholder="مثال: TCH-123456"
              autoComplete="username"
              required
            />
          </div>

          <div className="teacher-login-field">
            <label htmlFor="teacher-password">
              كلمة المرور
            </label>

            <input
              id="teacher-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="أدخل كلمة المرور"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="teacher-login-button"
            disabled={loading}
          >
            {loading
              ? "جارٍ تسجيل الدخول..."
              : "تسجيل الدخول"}
          </button>

        </form>

        <div className="teacher-login-notice">

          <span>
            i
          </span>

          <p>
            استخدم معرف المعلم الذي تم توليده
            عند إنشاء حسابك من طرف المدرسة.
          </p>

        </div>

        <Link
          to="/"
          className="teacher-login-back"
        >
          العودة إلى الصفحة الرئيسية
        </Link>

      </section>

    </main>
  );
}

export default TeacherLoginPage;