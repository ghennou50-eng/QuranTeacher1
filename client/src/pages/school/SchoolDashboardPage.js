import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SchoolDashboardPage.css";

function SchoolDashboardPage() {
  const navigate = useNavigate();

  const [school, setSchool] = useState(null);

  useEffect(() => {
    const savedSchool =
      localStorage.getItem("quranTeacherSchool");

    const role =
      localStorage.getItem("quranTeacherRole");

    const token =
      localStorage.getItem("quranTeacherToken");

    if (!token || role !== "school") {
      navigate("/school/login", {
        replace: true
      });
      return;
    }

    if (savedSchool) {
      try {
        setSchool(JSON.parse(savedSchool));
      } catch (error) {
        console.error(
          "Failed to read school data:",
          error
        );
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem(
      "quranTeacherToken"
    );

    localStorage.removeItem(
      "quranTeacherRole"
    );

    localStorage.removeItem(
      "quranTeacherSchool"
    );

    navigate("/school/login", {
      replace: true
    });
  };

  if (!school) {
    return (
      <main className="school-dashboard-page">
        <div className="school-dashboard-loading">
          جارٍ تحميل بيانات المدرسة...
        </div>
      </main>
    );
  }

  return (
    <main className="school-dashboard-page">

      <header className="school-dashboard-header">
        <div className="school-dashboard-header-content">

          <div className="school-dashboard-brand">

            <div className="school-dashboard-logo">
              م
            </div>

            <div>
              <h1>
                {school.associationName}
              </h1>

              <p>
                {school.clubName}
              </p>
            </div>

          </div>

          <button
            type="button"
            className="school-dashboard-logout"
            onClick={handleLogout}
          >
            تسجيل الخروج
          </button>

        </div>
      </header>

      <section className="school-dashboard-content">

        <div className="school-dashboard-welcome">

          <div>
            <span>
              لوحة المدرسة
            </span>

            <h2>
              مرحبًا بكم
            </h2>

            <p>
              من هنا تستطيع إدارة المعلمين
              والطلاب ومتابعة نشاط المدرسة.
            </p>
          </div>

        </div>

        <div className="school-info-card">

          <div className="school-info-card-header">

            <div>
              <h2>
                معلومات المدرسة
              </h2>

              <p>
                البيانات المسجلة في المنصة
              </p>
            </div>

            <span className="school-active-badge">
              الحساب مفعل
            </span>

          </div>

          <div className="school-info-grid">

            <div className="school-info-item">
              <span>اسم الجمعية</span>
              <strong>
                {school.associationName}
              </strong>
            </div>

            <div className="school-info-item">
              <span>اسم النادي</span>
              <strong>
                {school.clubName}
              </strong>
            </div>

            <div className="school-info-item">
              <span>رقم الهاتف</span>
              <strong>
                {school.phone}
              </strong>
            </div>

            <div className="school-info-item">
              <span>الولاية</span>
              <strong>
                {school.wilaya}
              </strong>
            </div>

            <div className="school-info-item">
              <span>البلدية</span>
              <strong>
                {school.municipality}
              </strong>
            </div>

            <div className="school-info-item">
              <span>الحي</span>
              <strong>
                {school.district}
              </strong>
            </div>

          </div>

        </div>

        <div className="school-dashboard-sections">

          <Link
            to="/school/teachers"
            className="school-section-card"
          >
            <div className="school-section-icon">
              م
            </div>

            <div>
              <h3>
                المعلمون
              </h3>

              <p>
                إدارة معلمي المدرسة وإنشاء حساباتهم
              </p>
            </div>

            <span className="school-section-arrow">
              ←
            </span>
          </Link>

          <Link
            to="/school/students"
            className="school-section-card"
          >
            <div className="school-section-icon">
              ط
            </div>

            <div>
              <h3>
                الطلاب
              </h3>

              <p>
                إدارة الطلاب وربطهم بالمعلمين
              </p>
            </div>

            <span className="school-section-arrow">
              ←
            </span>
          </Link>

          <div
            className="school-section-card"
          >
            <div className="school-section-icon">
              ت
            </div>

            <div>
              <h3>
                التقارير
              </h3>

              <p>
                تقارير المدرسة ومتابعتها
              </p>
            </div>

            <span className="school-section-arrow">
              ←
            </span>
          </div>

        </div>

        <div className="school-dashboard-notice">

          <span className="school-notice-icon">
            i
          </span>

          <p>
            إدارة المنصة تقتصر على حسابات المدارس،
            بينما المدرسة مسؤولة عن معلميها وطلابها
            وبيانات الحضور والحفظ.
          </p>

        </div>

      </section>

    </main>
  );
}

export default SchoolDashboardPage;