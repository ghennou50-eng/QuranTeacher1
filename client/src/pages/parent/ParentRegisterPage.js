import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ParentRegisterPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

function ParentRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    birthDate: "",
    residence: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const {
      email,
      password,
      fullName,
      birthDate,
      residence
    } = formData;

    setError("");

    if (
      !email.trim() ||
      !password ||
      !fullName.trim() ||
      !birthDate ||
      !residence.trim()
    ) {
      setError("يرجى ملء جميع المعلومات المطلوبة.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/parent/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            birthDate,
            residence: residence.trim()
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "تعذر إنشاء حساب ولي الأمر."
        );
      }

      // حفظ بيانات الحساب والتوكن
      if (result.token) {
        localStorage.setItem(
          "quranTeacherParentToken",
          result.token
        );

        localStorage.setItem(
          "quranTeacherRole",
          "parent"
        );
      }

      if (result.user) {
        localStorage.setItem(
          "quranTeacherParent",
          JSON.stringify(result.user)
        );
      }

      alert(
        result.message ||
        "تم إنشاء حساب ولي الأمر بنجاح."
      );

      navigate("/parent/dashboard");

    } catch (requestError) {
      console.error(
        "Parent registration failed:",
        requestError
      );

      setError(
        requestError.message ||
        "حدث خطأ أثناء إنشاء الحساب."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="parent-register-page">

      <section className="parent-register-card">

        <div className="parent-register-header">

          <div className="parent-register-logo">
            و
          </div>

          <h1>فتح حساب ولي الأمر</h1>

          <p>
            أنشئ حسابك للوصول إلى معلومات أبنائك ومتابعة تقدمهم.
          </p>

        </div>

        {error && (
          <div
            style={{
              marginBottom: "15px",
              padding: "11px 13px",
              border: "1px solid #e6b8b8",
              borderRadius: "8px",
              background: "#fff3f3",
              color: "#a34848",
              fontSize: "12px",
              lineHeight: "1.7"
            }}
          >
            {error}
          </div>
        )}

        <form
          className="parent-register-form"
          onSubmit={handleSubmit}
        >

          <div className="parent-register-group">

            <label htmlFor="parent-register-email">
              البريد الإلكتروني
            </label>

            <input
              id="parent-register-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="أدخل البريد الإلكتروني"
              autoComplete="email"
              required
            />

          </div>

          <div className="parent-register-group">

            <label htmlFor="parent-register-password">
              كلمة المرور
            </label>

            <input
              id="parent-register-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="أدخل كلمة المرور"
              autoComplete="new-password"
              required
            />

          </div>

          <div className="parent-register-group">

            <label htmlFor="parent-register-name">
              الاسم واللقب
            </label>

            <input
              id="parent-register-name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="أدخل الاسم واللقب"
              required
            />

          </div>

          <div className="parent-register-group">

            <label htmlFor="parent-register-birth-date">
              تاريخ الميلاد
            </label>

            <input
              id="parent-register-birth-date"
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />

          </div>

          <div className="parent-register-group">

            <label htmlFor="parent-register-residence">
              مكان الإقامة
            </label>

            <input
              id="parent-register-residence"
              name="residence"
              type="text"
              value={formData.residence}
              onChange={handleChange}
              placeholder="أدخل مكان الإقامة"
              required
            />

          </div>

          <button
            type="submit"
            className="parent-register-button"
            disabled={loading}
          >
            {loading
              ? "جارٍ إنشاء الحساب..."
              : "إنشاء الحساب"}
          </button>

        </form>

        <div className="parent-register-login">

          <span>
            لديك حساب بالفعل؟
          </span>

          <Link to="/parent/login">
            تسجيل الدخول
          </Link>

        </div>

        <Link
          to="/"
          className="parent-register-back"
        >
          العودة إلى الصفحة الرئيسية
        </Link>

      </section>

    </main>
  );
}

export default ParentRegisterPage;