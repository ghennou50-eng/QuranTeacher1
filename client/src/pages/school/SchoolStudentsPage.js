import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./SchoolStudentsPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

function SchoolStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token =
    localStorage.getItem("quranTeacherToken");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "انتهت جلسة المدرسة. يرجى تسجيل الدخول من جديد."
        );
      }

      const response = await fetch(
        `${API_URL}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر جلب الطلاب."
        );
      }

      setStudents(
        Array.isArray(result.students)
          ? result.students
          : []
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.message ||
          "تعذر الاتصال بالخادم."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <main className="school-students-page">

      <header className="school-students-header">
        <div className="school-students-header-content">

          <div>
            <h1>
              طلاب المدرسة
            </h1>

            <p>
              عرض جميع الطلاب المسجلين في المدرسة
              والمعلمين المسؤولين عنهم.
            </p>
          </div>

          <Link
            to="/school/dashboard"
            className="school-students-back"
          >
            العودة إلى لوحة المدرسة
          </Link>

        </div>
      </header>

      <section className="school-students-content">

        {error && (
          <div className="school-students-error">
            {error}
          </div>
        )}

        <section className="school-students-list-card">

          <div className="school-student-section-header">

            <div>
              <h2>
                قائمة الطلاب
              </h2>

              <p>
                تتم إضافة وتعديل وحذف الطلاب من طرف
                المعلمين.
              </p>
            </div>

            <div className="school-students-count">
              {students.length} طلاب
            </div>

          </div>

          {loading ? (
            <div className="school-students-empty">
              جارٍ تحميل الطلاب...
            </div>
          ) : students.length === 0 ? (
            <div className="school-students-empty">
              لا يوجد طلاب مسجلون حاليًا.
            </div>
          ) : (
            <div className="school-students-list">

              {students.map((student) => (
                <article
                  className="school-student-row"
                  key={student.id}
                >

                  <div className="school-student-main">

                    <div className="school-student-avatar">
                      {student.first_name?.charAt(0) || "ط"}
                    </div>

                    <div>
                      <h3>
                        {student.first_name}{" "}
                        {student.last_name}
                      </h3>

                      <p>
                        اسم المستخدم:{" "}
                        <strong>
                          {student.username}
                        </strong>
                      </p>

                      <p>
                        المعلم:{" "}
                        <strong className="student-teacher-name">
                          {student.teacher_name ||
                            "غير مسند"}
                        </strong>
                      </p>

                    </div>

                  </div>

                  <div className="school-student-details">

                    <div>
                      <span>
                        الولي
                      </span>

                      <strong>
                        {student.guardian_name ||
                          "غير مسجل"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        الهاتف
                      </span>

                      <strong>
                        {student.guardian_phone ||
                          "غير مسجل"}
                      </strong>
                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

      </section>

    </main>
  );
}

export default SchoolStudentsPage;