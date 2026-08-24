import React, { useState } from "react";
import "./AdminLoginPage.css";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Admin login submitted");
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              required
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
              onChange={(event) => setPassword(event.target.value)}
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login-button"
          >
            تسجيل الدخول
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