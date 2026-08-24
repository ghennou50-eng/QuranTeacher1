import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLoginPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "بيانات تسجيل الدخول غير صحيحة."
        );
      }

      localStorage.setItem(
        "quranTeacherAdminToken",
        data.token
      );

      localStorage.setItem(
        "quranTeacherAdmin",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "quranTeacherRole",
        "admin"
      );

      navigate("/admin");

    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      setError(
        error.message ||
          "حدث خطأ أثناء تسجيل الدخول."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-logo">
          QT
        </div>

        <div className="admin-login-heading">
          <h1>إدارة التطبيق</h1>
          <p>تسجيل دخول مسير النظام</p>
        </div>

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >

          <div className="admin-login-field">
            <label htmlFor="admin-email">
              البريد الإلكتروني
            </label>

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="أدخل البريد الإلكتروني"
              required
              disabled={loading}
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">
              كلمة المرور
            </label>

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="أدخل كلمة المرور"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "تسجيل الدخول"}
          </button>

        </form>

        <div className="admin-login-security">
          <span>i</span>
          <p>
            هذه الصفحة مخصصة لمسير التطبيق فقط.
          </p>
        </div>

      </div>
    </main>
  );
}

export default AdminLoginPage;

