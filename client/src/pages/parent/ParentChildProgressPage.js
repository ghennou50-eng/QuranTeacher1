import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./ParentChildProgressPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

function ParentChildProgressPage() {
  const { id: studentId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTodayMemorization, setShowTodayMemorization] =
    useState(true);

  const [showMonthMemorization, setShowMonthMemorization] =
    useState(false);

  const [showAllMemorization, setShowAllMemorization] =
    useState(false);

  const getAuthToken = () => {
    return (
      localStorage.getItem("quranTeacherParentToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("quranTeacherToken")
    );
  };

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError("");

        if (!studentId || !Number.isInteger(Number(studentId))) {
          throw new Error("معرف الطالب غير صحيح.");
        }

        const token = getAuthToken();

        if (!token) {
          throw new Error("انتهت جلسة تسجيل الدخول.");
        }

        const response = await fetch(
          `${API_URL}/parent/children/${studentId}/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "حدث خطأ أثناء جلب متابعة الطالب."
          );
        }

        if (!result.success) {
          throw new Error(
            result.message ||
              "تعذر جلب متابعة الطالب."
          );
        }

        setData(result);
      } catch (err) {
        console.error(
          "Fetch student progress failed:",
          err
        );

        setError(
          err.message ||
            "حدث خطأ أثناء جلب متابعة الطالب."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [studentId]);

  if (loading) {
    return (
      <main className="parent-progress-page">
        <section className="parent-progress-content">
          <div className="progress-section">
            <div className="progress-notes">
              <p>جارٍ تحميل متابعة الطالب...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="parent-progress-page">
        <section className="parent-progress-content">
          <div className="progress-section">
            <div className="progress-notes">
              <h2>حدث خطأ</h2>

              <p>{error}</p>

              <Link
                to="/parent/dashboard"
                className="parent-progress-back"
              >
                العودة إلى الأبناء
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!data || !data.student) {
    return (
      <main className="parent-progress-page">
        <section className="parent-progress-content">
          <div className="progress-section">
            <div className="progress-notes">
              <p>لا توجد بيانات للطالب.</p>

              <Link
                to="/parent/dashboard"
                className="parent-progress-back"
              >
                العودة إلى الأبناء
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const student = data.student;

  const attendance = Array.isArray(data.attendance)
    ? data.attendance
    : [];

  const memorization = Array.isArray(
    data.memorization
  )
    ? data.memorization
    : [];

  const notes = Array.isArray(data.notes)
    ? data.notes
    : [];

  const fullName =
    `${student.first_name || ""} ${
      student.last_name || ""
    }`.trim();

  // =====================================================
  // الحضور
  // =====================================================

  const presentDays = new Set(
    attendance
      .filter(
        (item) =>
          item.present === true ||
          item.present === 1 ||
          item.present === "1"
      )
      .map((item) => item.attendance_date)
  ).size;

  const absentDays = new Set(
    attendance
      .filter(
        (item) =>
          item.present === false ||
          item.present === 0 ||
          item.present === "0"
      )
      .map((item) => item.attendance_date)
  ).size;

  const totalDays =
    presentDays + absentDays;

  const attendancePercentage =
    totalDays > 0
      ? Math.round(
          (presentDays / totalDays) * 100
        )
      : 0;

  // =====================================================
  // التواريخ
  // =====================================================

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const currentMonth = today.slice(0, 7);

  // =====================================================
  // الحصول على تاريخ الحفظ
  // =====================================================

  const getItemDate = (item) => {
    if (!item) {
      return "";
    }

    const possibleDate =
      item.memorization_date ||
      item.date ||
      item.created_at;

    if (!possibleDate) {
      return "";
    }

    return String(possibleDate).slice(0, 10);
  };

  // =====================================================
  // الحفظ اليومي
  // =====================================================

  const todayMemorization =
    memorization.filter((item) => {
      const itemDate = getItemDate(item);

      return itemDate === today;
    });

  // =====================================================
  // الحفظ الشهري
  // =====================================================

  const monthMemorization =
    memorization.filter((item) => {
      const itemDate = getItemDate(item);

      return itemDate.startsWith(
        currentMonth
      );
    });

  // =====================================================
  // جميع سجلات الحفظ
  // =====================================================

  const sortedMemorization =
    [...memorization].sort((a, b) => {
      const dateA = getItemDate(a);
      const dateB = getItemDate(b);

      return dateB.localeCompare(dateA);
    });

  const totalMemorization =
    memorization.length;

  // =====================================================
  // نص الحفظ
  // =====================================================

  const getMemorizationText = (items) => {
    if (!items || items.length === 0) {
      return "غير مسجل";
    }

    return items
      .map((item) => {
        const parts = [];

        if (item.surah) {
          parts.push(
            String(item.surah)
          );
        }

        if (
          item.from_ayah !== null &&
          item.from_ayah !== undefined &&
          item.to_ayah !== null &&
          item.to_ayah !== undefined
        ) {
          parts.push(
            `من الآية ${item.from_ayah} إلى ${item.to_ayah}`
          );
        }

        if (item.amount) {
          parts.push(
            String(item.amount)
          );
        }

        return (
          parts.join(" - ") ||
          "تم تسجيل الحفظ"
        );
      })
      .join("، ");
  };

  // =====================================================
  // بطاقة سجل الحفظ
  // =====================================================

  const renderMemorizationItem = (
    item,
    index
  ) => {
    const itemDate =
      getItemDate(item);

    return (
      <div
        key={
          item.id ||
          `${itemDate}-${index}`
        }
        className="memorization-record"
      >
        <div className="memorization-record-header">
          <strong>
            {item.surah ||
              "حفظ جديد"}
          </strong>

          {itemDate && (
            <span>
              {itemDate}
            </span>
          )}
        </div>

        <div className="memorization-record-details">
          {item.from_ayah !== null &&
            item.from_ayah !== undefined &&
            item.to_ayah !== null &&
            item.to_ayah !== undefined && (
              <p>
                <strong>
                  الآيات:
                </strong>{" "}
                من {item.from_ayah} إلى{" "}
                {item.to_ayah}
              </p>
            )}

          {item.amount && (
            <p>
              <strong>
                المقدار:
              </strong>{" "}
              {item.amount}
            </p>
          )}

          {item.notes && (
            <p>
              <strong>
                ملاحظة:
              </strong>{" "}
              {item.notes}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="parent-progress-page">

      {/* =================================================
          الرأس
      ================================================= */}

      <header className="parent-progress-header">
        <div className="parent-progress-header-content">

          <div>
            <h1>متابعة الطالب</h1>

            <p>
              متابعة الحضور والحفظ والتقدم
            </p>
          </div>

          <Link
            to="/parent/dashboard"
            className="parent-progress-back"
          >
            العودة إلى الأبناء
          </Link>

        </div>
      </header>

      <section className="parent-progress-content">

        {/* =================================================
            بيانات الطالب
        ================================================= */}

        <div className="progress-student-card">

          <div className="progress-student-avatar">
            {(student.first_name ||
              "ط").charAt(0)}
          </div>

          <div>
            <h2>
              {fullName ||
                "بيانات الطالب"}
            </h2>

            <p>
              اسم المستخدم:{" "}
              {student.username ||
                "غير متوفر"}
            </p>
          </div>

        </div>

        {/* =================================================
            الحضور
        ================================================= */}

        <div className="progress-section">

          <div className="progress-section-title">
            <h2>الحضور</h2>

            <span>
              السجلات المتوفرة
            </span>
          </div>

          <div className="attendance-grid">

            <div className="attendance-card">
              <span>
                أيام الحضور
              </span>

              <strong>
                {presentDays}
              </strong>
            </div>

            <div className="attendance-card">
              <span>
                أيام الغياب
              </span>

              <strong>
                {absentDays}
              </strong>
            </div>

            <div className="attendance-card">
              <span>
                نسبة الحضور
              </span>

              <strong>
                {attendancePercentage}%
              </strong>
            </div>

          </div>

        </div>

        {/* =================================================
            الحفظ
        ================================================= */}

        <div className="progress-section">

          <div className="progress-section-title">
            <h2>الحفظ</h2>

            <span>
              اضغط على أي بطاقة لعرض التفاصيل
            </span>
          </div>

          <div className="memorization-grid">

            {/* اليوم */}

            <button
              type="button"
              className="memorization-card"
              onClick={() =>
                setShowTodayMemorization(
                  (value) => !value
                )
              }
            >

              <div className="memorization-icon">
                ش
              </div>

              <div>
                <span>
                  الحفظ لهذا اليوم
                </span>

                <strong>
                  {todayMemorization.length >
                  0
                    ? getMemorizationText(
                        todayMemorization
                      )
                    : "غير مسجل"}
                </strong>
              </div>

            </button>

            {/* الشهر */}

            <button
              type="button"
              className="memorization-card"
              onClick={() =>
                setShowMonthMemorization(
                  (value) => !value
                )
              }
            >

              <div className="memorization-icon">
                أ
              </div>

              <div>
                <span>
                  الحفظ لهذا الشهر
                </span>

                <strong>
                  {monthMemorization.length >
                  0
                    ? `${monthMemorization.length} سجل`
                    : "غير مسجل"}
                </strong>
              </div>

            </button>

            {/* الكل */}

            <button
              type="button"
              className="memorization-card"
              onClick={() =>
                setShowAllMemorization(
                  (value) => !value
                )
              }
            >

              <div className="memorization-icon">
                ك
              </div>

              <div>
                <span>
                  المحفوظ الكلي
                </span>

                <strong>
                  {totalMemorization > 0
                    ? `${totalMemorization} سجل`
                    : "غير مسجل"}
                </strong>
              </div>

            </button>

          </div>

          {/* =================================================
              حفظ اليوم
          ================================================= */}

          {showTodayMemorization && (
            <div className="progress-notes">

              <h3>
                حفظ اليوم
              </h3>

              {todayMemorization.length ===
              0 ? (
                <p>
                  لا توجد سجلات حفظ مسجلة
                  لهذا اليوم.
                </p>
              ) : (
                todayMemorization.map(
                  renderMemorizationItem
                )
              )}

            </div>
          )}

          {/* =================================================
              حفظ الشهر
          ================================================= */}

          {showMonthMemorization && (
            <div className="progress-notes">

              <h3>
                حفظ هذا الشهر
              </h3>

              {monthMemorization.length ===
              0 ? (
                <p>
                  لا توجد سجلات حفظ في
                  هذا الشهر.
                </p>
              ) : (
                monthMemorization.map(
                  renderMemorizationItem
                )
              )}

            </div>
          )}

          {/* =================================================
              كل الحفظ
          ================================================= */}

          {showAllMemorization && (
            <div className="progress-notes">

              <h3>
                جميع سجلات الحفظ
              </h3>

              {sortedMemorization.length ===
              0 ? (
                <p>
                  لا توجد سجلات حفظ
                  مسجلة حالياً.
                </p>
              ) : (
                sortedMemorization.map(
                  renderMemorizationItem
                )
              )}

            </div>
          )}

        </div>

        {/* =================================================
            سجل الحفظ الكامل
        ================================================= */}

        <div className="progress-section">

          <div className="progress-section-title">
            <h2>
              سجل الحفظ
            </h2>

            <span>
              جميع السجلات
            </span>
          </div>

          <div className="progress-notes">

            {sortedMemorization.length ===
            0 ? (
              <p>
                لا توجد سجلات حفظ
                مسجلة حالياً.
              </p>
            ) : (
              sortedMemorization.map(
                renderMemorizationItem
              )
            )}

          </div>

        </div>

        {/* =================================================
            ملاحظات المعلم
        ================================================= */}

        <div className="progress-section">

          <div className="progress-section-title">
            <h2>
              ملاحظات إضافية
            </h2>

            <span>
              من المعلم
            </span>
          </div>

          <div className="progress-notes">

            {notes.length === 0 ? (
              <p>
                لا توجد ملاحظات مسجلة
                حالياً.
              </p>
            ) : (
              notes
                .slice(0, 10)
                .map((item) => (
                  <div
                    key={item.id}
                  >
                    <p>
                      {item.note}
                    </p>

                    {item.teacher_name && (
                      <small>
                        المعلم:{" "}
                        {item.teacher_name}
                      </small>
                    )}
                  </div>
                ))
            )}

          </div>

        </div>

        {/* =================================================
            تنبيه
        ================================================= */}

        <div className="progress-read-only-notice">

          <span className="progress-notice-icon">
            i
          </span>

          <p>
            هذه المعلومات للعرض فقط ويتم
            تحديثها من طرف المعلم وإدارة
            المدرسة.
          </p>

        </div>

      </section>
    </main>
  );
}

export default ParentChildProgressPage;