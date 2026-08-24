import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ParentLoginPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

function ParentLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/auth/parent/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "تعذر تسجيل الدخول.");
      }

      // 1. حفظ التوكن بجميع الأسماء المتوقعة لتفادي أي انقطاع في الصلاحيات
      localStorage.setItem("token", result.token);
      localStorage.setItem("quranTeacherParentToken", result.token);

      // 2. حفظ بيانات ولي الأمر
      const userData = result.user || result.parent;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("quranTeacherParent", JSON.stringify(userData));

      // 3. حفظ نوع الحساب
      localStorage.setItem("quranTeacherRole", "parent");

      // التوجيه للوحة التحكم
      navigate("/parent/dashboard", {
        replace: true,
      });
    } catch (requestError) {
      console.error("Parent login failed:", requestError);

      setError(requestError.message || "تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="parent-login-page">
      <section className="parent-login-card">
        <div className="parent-login-header">
          <div className="parent-login-logo">و</div>
          <h1>دخول ولي الأمر</h1>
          <p>سجل الدخول لمتابعة أبنائك ومعرفة تقدمهم في المدرسة.</p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid #e6b8b8",
              background: "#fff3f3",
              color: "#a34848",
              fontSize: "13px",
              lineHeight: "1.7",
            }}
          >
            {error}
          </div>
        )}

        <form className="parent-login-form" onSubmit={handleSubmit}>
          <div className="parent-form-group">
            <label htmlFor="parent-email">البريد الإلكتروني</label>
            <input
              id="parent-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="parent-form-group">
            <label htmlFor="parent-password">كلمة المرور</label>
            <input
              id="parent-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="أدخل كلمة المرور"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="parent-login-button"
            disabled={loading}
          >
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="parent-register-box">
          <p>ليس لديك حساب؟</p>
          <Link to="/parent/register">فتح حساب جديد</Link>
        </div>

        <Link to="/" className="parent-back-home">
          العودة إلى الصفحة الرئيسية
        </Link>
      </section>
    </main>
  );
}

export default ParentLoginPage;