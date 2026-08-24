import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./ParentChildDataPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

function ParentChildDataPage() {
  const { id: studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAuthToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("quranTeacherParentToken") ||
      localStorage.getItem("quranTeacherToken")
    );
  };

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getAuthToken();

        if (!token) {
          throw new Error("انتهت جلسة تسجيل الدخول.");
        }

        const response = await fetch(
          `${API_URL}/parent/children/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "حدث خطأ أثناء جلب بيانات الطالب."
          );
        }

        setStudent(result.student);

      } catch (err) {
        console.error(
          "Fetch student data failed:",
          err
        );

        setError(
          err.message ||
            "حدث خطأ أثناء جلب بيانات الطالب."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  if (loading) {
    return (
      <main className="parent-child-data-page">
        <section className="parent-child-data-content">
          <div className="student-data-card">
            <h2>جارٍ تحميل بيانات الطالب...</h2>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="parent-child-data-page">
        <section className="parent-child-data-content">
          <div className="student-data-card">
            <h2>حدث خطأ</h2>
            <p>{error}</p>

            <Link
              to="/parent/dashboard"
              className="parent-child-data-back"
            >
              العودة إلى الأبناء
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!student) {
    return null;
  }

  const fullName =
    `${student.first_name || ""} ${
      student.last_name || ""
    }`.trim();

  return (
    <main className="parent-child-data-page">

      <header className="parent-child-data-header">
        <div className="parent-child-data-header-content">

          <div>
            <h1>بيانات الطالب</h1>
            <p>المعلومات الشخصية للطالب</p>
          </div>

          <Link
            to="/parent/dashboard"
            className="parent-child-data-back"
          >
            العودة إلى الأبناء
          </Link>

        </div>
      </header>

      <section className="parent-child-data-content">

        <div className="student-profile-card">

          <div className="student-profile-avatar">
            {(student.first_name || "ط").charAt(0)}
          </div>

          <h2>{fullName || "بيانات الطالب"}</h2>

          <p className="student-profile-username">
            اسم المستخدم: {student.username || "غير متوفر"}
          </p>

        </div>

        <div className="student-data-card">

          <div className="student-data-card-header">
            <h2>المعلومات الشخصية</h2>
          </div>

          <div className="student-data-grid">

            <div className="student-data-item">
              <span>الاسم واللقب</span>
              <strong>
                {fullName || "غير متوفر"}
              </strong>
            </div>

            <div className="student-data-item">
              <span>تاريخ الميلاد</span>
              <strong>
                {student.birth_date || "غير متوفر"}
              </strong>
            </div>

            <div className="student-data-item">
              <span>مكان الميلاد</span>
              <strong>
                {student.birth_place || "غير متوفر"}
              </strong>
            </div>

            <div className="student-data-item">
              <span>مكان الإقامة</span>
              <strong>
                {student.residence || "غير متوفر"}
              </strong>
            </div>

            <div className="student-data-item">
              <span>اسم الولي</span>
              <strong>
                {student.guardian_name || "غير متوفر"}
              </strong>
            </div>

            <div className="student-data-item">
              <span>رقم هاتف الولي</span>
              <strong>
                {student.guardian_phone || "غير متوفر"}
              </strong>
            </div>

            <div className="student-data-full student-data-item">
              <span>اسم المستخدم</span>
              <strong>
                {student.username || "غير متوفر"}
              </strong>
            </div>

          </div>
        </div>

        <div className="student-data-notice">
          <span className="student-data-notice-icon">
            i
          </span>

          <p>
            هذه البيانات يتم إدارتها من طرف المدرسة،
            ولا يمكن لولي الأمر تعديلها من حسابه.
          </p>
        </div>

      </section>
    </main>
  );
}

export default ParentChildDataPage;