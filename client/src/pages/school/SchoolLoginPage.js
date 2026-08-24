import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SchoolLoginPage.css";

const API_URL = "http://localhost:5000/api";

function SchoolLoginPage() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/school/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phone,
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
        "school"
      );

      localStorage.setItem(
        "quranTeacherSchool",
        JSON.stringify(result.school)
      );

      navigate("/school/dashboard");
    } catch (loginError) {
      console.error(
        "School login failed:",
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
    <main className="school-auth-page">
      <section className="school-auth-card">

        <div className="school-auth-header">

          <div className="school-auth-logo">
            م
          </div>

          <h1>
            دخول المدرسة
          </h1>

          <p>
            أدخل بيانات حساب المدرسة للوصول
            إلى لوحة الإدارة.
          </p>

        </div>

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "13px",
              borderRadius: "10px",
              background: "#fff3f3",
              border: "1px solid #e6b8b8",
              color: "#a34848",
              fontSize: "13px",
              lineHeight: "1.7"
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="school-auth-form"
        >

          <div className="form-group">
            <label htmlFor="school-phone">
              رقم هاتف المدرسة
            </label>

            <input
              id="school-phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="أدخل رقم الهاتف"
              autoComplete="tel"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="school-password">
              كلمة المرور
            </label>

            <input
              id="school-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="أدخل كلمة المرور"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="primary-auth-button"
            disabled={loading}
          >
            {loading
              ? "جارٍ تسجيل الدخول..."
              : "تسجيل الدخول"}
          </button>

        </form>

        <div className="auth-divider">
          <span>أو</span>
        </div>

        <Link
          to="/school/register"
          className="secondary-auth-button"
        >
          إنشاء حساب مدرسة جديد
        </Link>

        <Link
          to="/"
          className="back-home-link"
        >
          العودة إلى الصفحة الرئيسية
        </Link>

      </section>
    </main>
  );
}

export default SchoolLoginPage;