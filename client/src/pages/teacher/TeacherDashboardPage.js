import React, {
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherDashboardPage.css";
import TeacherProgressPanel from "./TeacherProgressPanel";

const API_URL = "http://localhost:5000/api";

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function TeacherDashboardPage() {
  const navigate = useNavigate();

  const [teacher, setTeacher] =
    useState(null);

  const [students, setStudents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [attendancePeriod, setAttendancePeriod] =
    useState("morning");

  const [attendanceDate, setAttendanceDate] =
    useState(getTodayDate());

  const [attendance, setAttendance] =
    useState({});

  const [attendanceLoading, setAttendanceLoading] =
    useState(false);

  const [attendanceSavingId, setAttendanceSavingId] =
    useState(null);

  const [showAddStudent, setShowAddStudent] =
    useState(false);

  const emptyStudentForm = {
    firstName: "",
    lastName: "",
    birthDate: "",
    birthPlace: "",
    residence: "",
    guardianName: "",
    guardianPhone: ""
  };

  const [newStudent, setNewStudent] =
    useState(emptyStudentForm);

  useEffect(() => {
    const token =
      localStorage.getItem(
        "quranTeacherToken"
      );

    const role =
      localStorage.getItem(
        "quranTeacherRole"
      );

    const savedTeacher =
      localStorage.getItem(
        "quranTeacherTeacher"
      );

    if (!token || role !== "teacher") {
      navigate(
        "/teacher/login",
        {
          replace: true
        }
      );

      return;
    }

    if (savedTeacher) {
      try {
        setTeacher(
          JSON.parse(savedTeacher)
        );
      } catch (parseError) {
        console.error(
          "Failed to read teacher data:",
          parseError
        );
      }
    }

    fetchStudents(token);
  }, [navigate]);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    } else {
      setAttendance({});
    }
  }, [
    students,
    attendanceDate,
    attendancePeriod
  ]);

  const fetchStudents =
    async (currentToken) => {
      try {
        setLoading(true);
        setError("");

        const token =
          currentToken ||
          localStorage.getItem(
            "quranTeacherToken"
          );

        if (!token) {
          throw new Error(
            "انتهت جلسة تسجيل الدخول."
          );
        }

        const response =
          await fetch(
            `${API_URL}/students`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "تعذر جلب الطلاب."
          );
        }

        setStudents(
          Array.isArray(
            result.students
          )
            ? result.students
            : []
        );
      } catch (requestError) {
        console.error(
          "Fetch students failed:",
          requestError
        );

        setError(
          requestError.message ||
            "تعذر الاتصال بالخادم."
        );
      } finally {
        setLoading(false);
      }
    };

  const fetchAttendance =
    async () => {
      try {
        setAttendanceLoading(true);

        const token =
          localStorage.getItem(
            "quranTeacherToken"
          );

        if (!token) {
          throw new Error(
            "انتهت جلسة تسجيل الدخول."
          );
        }

        const params =
          new URLSearchParams({
            date: attendanceDate,
            period:
              attendancePeriod
          });

        const response =
          await fetch(
            `${API_URL}/attendance?${params.toString()}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "تعذر جلب الحضور."
          );
        }

        const attendanceMap = {};

        result.attendance.forEach(
          (record) => {
            attendanceMap[
              String(
                record.student_id
              )
            ] = {
              id: record.id,
              present:
                Boolean(
                  record.present
                )
            };
          }
        );

        setAttendance(
          attendanceMap
        );
      } catch (requestError) {
        console.error(
          "Fetch attendance failed:",
          requestError
        );

        setError(
          requestError.message ||
            "تعذر جلب بيانات الحضور."
        );
      } finally {
        setAttendanceLoading(false);
      }
    };

  const saveAttendance =
    async (
      studentId,
      nextPresent
    ) => {
      try {
        setAttendanceSavingId(
          studentId
        );

        setError("");

        const token =
          localStorage.getItem(
            "quranTeacherToken"
          );

        if (!token) {
          throw new Error(
            "انتهت جلسة تسجيل الدخول."
          );
        }

        const response =
          await fetch(
            `${API_URL}/attendance`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`
              },
              body: JSON.stringify({
                studentId,
                date:
                  attendanceDate,
                period:
                  attendancePeriod,
                present:
                  nextPresent
              })
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "تعذر حفظ الحضور."
          );
        }

        setAttendance(
          (previous) => ({
            ...previous,
            [String(studentId)]: {
              id:
                result.attendance.id,
              present:
                Boolean(
                  result.attendance
                    .present
                )
            }
          })
        );
      } catch (requestError) {
        console.error(
          "Save attendance failed:",
          requestError
        );

        setError(
          requestError.message ||
            "حدث خطأ أثناء حفظ الحضور."
        );
      } finally {
        setAttendanceSavingId(
          null
        );
      }
    };

  const toggleAttendance =
    (studentId) => {
      const existing =
        attendance[
          String(studentId)
        ];

      const nextPresent =
        existing
          ? !existing.present
          : true;

      saveAttendance(
        studentId,
        nextPresent
      );
    };

  const handleNewStudentChange =
    (event) => {
      const {
        name,
        value
      } = event.target;

      setNewStudent(
        (previous) => ({
          ...previous,
          [name]: value
        })
      );
    };

  const openAddStudent =
    () => {
      setNewStudent({
        ...emptyStudentForm
      });

      setError("");
      setShowAddStudent(true);
    };

  const closeAddStudent =
    () => {
      setShowAddStudent(false);

      setNewStudent({
        ...emptyStudentForm
      });
    };

  const addStudent =
    async (event) => {
      event.preventDefault();

      if (
        !newStudent.firstName.trim() ||
        !newStudent.lastName.trim()
      ) {
        setError(
          "يرجى إدخال اسم ولقب الطالب."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        const token =
          localStorage.getItem(
            "quranTeacherToken"
          );

        if (!token) {
          throw new Error(
            "انتهت جلسة تسجيل الدخول."
          );
        }

        const response =
          await fetch(
            `${API_URL}/students`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`
              },
              body: JSON.stringify({
                firstName:
                  newStudent.firstName.trim(),

                lastName:
                  newStudent.lastName.trim(),

                birthDate:
                  newStudent.birthDate ||
                  null,

                birthPlace:
                  newStudent.birthPlace.trim(),

                residence:
                  newStudent.residence.trim(),

                guardianName:
                  newStudent.guardianName.trim(),

                guardianPhone:
                  newStudent.guardianPhone.trim()
              })
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "تعذر إضافة الطالب."
          );
        }

        closeAddStudent();

        await fetchStudents(
          token
        );

        setSelectedStudent(
          result.student
        );
      } catch (requestError) {
        console.error(
          "Create student failed:",
          requestError
        );

        setError(
          requestError.message ||
            "حدث خطأ أثناء إضافة الطالب."
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteStudent =
    async (student) => {
      const confirmed =
        window.confirm(
          `هل أنت متأكد من حذف الطالب "${student.first_name} ${student.last_name}"؟`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          student.id
        );

        setError("");

        const token =
          localStorage.getItem(
            "quranTeacherToken"
          );

        if (!token) {
          throw new Error(
            "انتهت جلسة تسجيل الدخول."
          );
        }

        const response =
          await fetch(
            `${API_URL}/students/${student.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "تعذر حذف الطالب."
          );
        }

        if (
          selectedStudent &&
          selectedStudent.id ===
            student.id
        ) {
          setSelectedStudent(
            null
          );
        }

        await fetchStudents(
          token
        );
      } catch (requestError) {
        console.error(
          "Delete student failed:",
          requestError
        );

        setError(
          requestError.message ||
            "حدث خطأ أثناء حذف الطالب."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  const logout =
    () => {
      localStorage.removeItem(
        "quranTeacherToken"
      );

      localStorage.removeItem(
        "quranTeacherRole"
      );

      localStorage.removeItem(
        "quranTeacherTeacher"
      );

      navigate(
        "/teacher/login",
        {
          replace: true
        }
      );
    };

  const teacherName =
    teacher?.fullName ||
    "المعلم";

  const teacherCode =
    teacher?.teacherCode ||
    "غير متوفر";

  const formatDateForDisplay =
    (dateString) => {
      if (!dateString) {
        return "";
      }

      const parts =
        String(
          dateString
        ).split("-");

      if (parts.length !== 3) {
        return String(
          dateString
        );
      }

      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

  return (
    <main className="teacher-dashboard">

      <header className="teacher-dashboard-header">

        <div>
          <span className="dashboard-label">
            حساب المعلم
          </span>

          <h1>
            لوحة المعلم
          </h1>

          <p>
            إدارة الطلاب والحضور ومتابعة الحفظ.
          </p>
        </div>

        <div className="teacher-header-actions">

          <div className="teacher-profile">

            <div className="teacher-avatar">
              {teacherName.charAt(0)}
            </div>

            <div>
              <strong>
                {teacherName}
              </strong>

              <span>
                معرف المعلم:{" "}
                {teacherCode}
              </span>
            </div>

          </div>

          <button
            className="logout-button"
            type="button"
            onClick={logout}
          >
            تسجيل الخروج
          </button>

        </div>

      </header>

      <section className="teacher-dashboard-content">

        {error && (
          <div
            style={{
              marginBottom:
                "18px",
              padding:
                "13px 16px",
              borderRadius:
                "10px",
              border:
                "1px solid #e6b8b8",
              background:
                "#fff3f3",
              color:
                "#a34848",
              fontSize:
                "12px",
              lineHeight:
                "1.7"
            }}
          >
            {error}
          </div>
        )}

        <div className="dashboard-toolbar">

          <div>
            <h2>
              تسجيل الحضور
            </h2>

            <p>
              اختر التاريخ والفترة ثم سجل حضور الطلاب.
            </p>
          </div>

          <button
            className="add-student-button"
            type="button"
            onClick={
              openAddStudent
            }
          >
            <span>
              +
            </span>

            إضافة طالب
          </button>

        </div>

        <div
          style={{
            marginBottom:
              "14px",
            padding:
              "12px 14px",
            border:
              "1px solid #e2e8e4",
            borderRadius:
              "10px",
            background:
              "#ffffff",
            display:
              "flex",
            alignItems:
              "center",
            gap:
              "12px",
            flexWrap:
              "wrap"
          }}
        >

          <label
            style={{
              color:
                "#536158",
              fontSize:
                "11px",
              fontWeight:
                "600"
            }}
          >
            التاريخ
          </label>

          <input
            type="date"
            value={
              attendanceDate
            }
            onChange={(event) =>
              setAttendanceDate(
                event.target.value
              )
            }
            style={{
              height:
                "38px",
              padding:
                "0 10px",
              border:
                "1px solid #d8dfda",
              borderRadius:
                "8px",
              outline:
                "none",
              color:
                "#26382d",
              fontFamily:
                "inherit"
            }}
          />

          <span
            style={{
              marginRight:
                "auto",
              color:
                "#7a847d",
              fontSize:
                "10px"
            }}
          >
            {formatDateForDisplay(
              attendanceDate
            )}
          </span>

        </div>

        <div className="attendance-tabs">

          <button
            type="button"
            className={
              attendancePeriod ===
              "morning"
                ? "active"
                : ""
            }
            onClick={() =>
              setAttendancePeriod(
                "morning"
              )
            }
          >
            الحضور الصباحي
          </button>

          <button
            type="button"
            className={
              attendancePeriod ===
              "evening"
                ? "active"
                : ""
            }
            onClick={() =>
              setAttendancePeriod(
                "evening"
              )
            }
          >
            الحضور المسائي
          </button>

        </div>

        <section className="students-card">

          <div className="students-card-header">

            <div>
              <h3>
                قائمة الطلاب
              </h3>

              <span>
                عدد الطلاب:{" "}
                {students.length}
              </span>
            </div>

            <span className="attendance-date">
              {formatDateForDisplay(
                attendanceDate
              )}
            </span>

          </div>

          <div className="students-list">

            {loading ? (
              <div
                style={{
                  padding:
                    "40px",
                  textAlign:
                    "center",
                  color:
                    "#7a847d",
                  fontSize:
                    "13px"
                }}
              >
                جارٍ تحميل الطلاب...
              </div>
            ) : students.length ===
              0 ? (
              <div
                style={{
                  padding:
                    "40px",
                  textAlign:
                    "center",
                  color:
                    "#7a847d",
                  fontSize:
                    "13px"
                }}
              >
                لا يوجد طلاب مسجلون لهذا المعلم.
              </div>
            ) : (
              students.map(
                (
                  student,
                  index
                ) => {

                  const record =
                    attendance[
                      String(
                        student.id
                      )
                    ];

                  const isPresent =
                    record
                      ? record.present
                      : false;

                  const attendanceSaving =
                    attendanceSavingId ===
                    student.id;

                  const fullName =
                    `${student.first_name} ${student.last_name}`;

                  return (
                    <div
                      className="student-row"
                      key={student.id}
                    >

                      <div className="student-number">
                        {index + 1}
                      </div>

                      <div
                        className="student-main"
                        onClick={() =>
                          setSelectedStudent(
                            student
                          )
                        }
                      >

                        <div className="student-avatar">
                          {fullName.charAt(
                            0
                          )}
                        </div>

                        <div>
                          <strong>
                            {fullName}
                          </strong>

                          <span>
                            {
                              student.username
                            }
                          </span>
                        </div>

                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "8px"
                        }}
                      >

                        <button
                          type="button"
                          className={
                            isPresent
                              ? "attendance-check checked"
                              : "attendance-check"
                          }
                          disabled={
                            attendanceSaving
                          }
                          onClick={() =>
                            toggleAttendance(
                              student.id
                            )
                          }
                          aria-label="تسجيل الحضور"
                        >
                          {attendanceSaving
                            ? "..."
                            : isPresent
                              ? "✓"
                              : ""}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteStudent(
                              student
                            )
                          }
                          disabled={
                            deletingId ===
                            student.id
                          }
                          style={{
                            minWidth:
                              "48px",
                            height:
                              "34px",
                            border:
                              "1px solid #d8a4a4",
                            borderRadius:
                              "7px",
                            background:
                              "#ffffff",
                            color:
                              "#a34848",
                            cursor:
                              "pointer"
                          }}
                        >
                          {deletingId ===
                          student.id
                            ? "..."
                            : "حذف"}
                        </button>

                      </div>

                    </div>
                  );
                }
              )
            )}

            {!loading &&
              students.length > 0 &&
              attendanceLoading && (
                <div
                  style={{
                    padding:
                      "10px 20px",
                    color:
                      "#7a847d",
                    fontSize:
                      "10px",
                    borderTop:
                      "1px solid #edf0ee"
                  }}
                >
                  جارٍ تحميل حالة الحضور...
                </div>
              )}

          </div>

        </section>

        {selectedStudent && (
          <section className="student-details-card">

            <div className="student-details-header">

              <div>
                <span>
                  بيانات الطالب
                </span>

                <h2>
                  {
                    selectedStudent.first_name
                  }{" "}
                  {
                    selectedStudent.last_name
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedStudent(
                    null
                  )
                }
              >
                إغلاق
              </button>

            </div>

            <div className="student-details-grid">

              <div>
                <span>
                  اسم المستخدم
                </span>

                <strong>
                  {
                    selectedStudent.username
                  }
                </strong>
              </div>

              <div>
                <span>
                  تاريخ الميلاد
                </span>

                <strong>
                  {
                    selectedStudent.birth_date ||
                    "غير مسجل"
                  }
                </strong>
              </div>

              <div>
                <span>
                  مكان الميلاد
                </span>

                <strong>
                  {
                    selectedStudent.birth_place ||
                    "غير مسجل"
                  }
                </strong>
              </div>

              <div>
                <span>
                  مكان الإقامة
                </span>

                <strong>
                  {
                    selectedStudent.residence ||
                    "غير مسجل"
                  }
                </strong>
              </div>

              <div>
                <span>
                  اسم الولي
                </span>

                <strong>
                  {
                    selectedStudent.guardian_name ||
                    "غير مسجل"
                  }
                </strong>
              </div>

              <div>
                <span>
                  هاتف الولي
                </span>

                <strong>
                  {
                    selectedStudent.guardian_phone ||
                    "غير مسجل"
                  }
                </strong>
              </div>

            </div>

            <div className="student-progress">

              <div>
                <span>
                  حضور اليوم
                </span>

                <strong>
                  {attendance[
                    String(
                      selectedStudent.id
                    )
                  ]?.present
                    ? "حاضر"
                    : "غير مسجل"}
                </strong>
              </div>

              <div>
                <span>
                  الفترة
                </span>

                <strong>
                  {
                    attendancePeriod ===
                    "morning"
                      ? "صباحية"
                      : "مسائية"
                  }
                </strong>
              </div>

              <div>
                <span>
                  التاريخ
                </span>

                <strong>
                  {formatDateForDisplay(
                    attendanceDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  الحفظ
                </span>

                <strong>
                  متابعة تفصيلية أسفل البيانات
                </strong>
              </div>

            </div>

            <TeacherProgressPanel
              student={
                selectedStudent
              }
            />

          </section>
        )}

      </section>

      {showAddStudent && (
        <div
          className="modal-overlay"
          onClick={
            closeAddStudent
          }
        >

          <div
            className="add-student-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span>
                  الطلاب
                </span>

                <h2>
                  إضافة طالب
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeAddStudent
                }
              >
                ×
              </button>

            </div>

            <form
              className="add-student-form"
              onSubmit={
                addStudent
              }
            >

              <div className="modal-form-grid">

                <div className="teacher-form-group">

                  <label>
                    الاسم
                  </label>

                  <input
                    name="firstName"
                    value={
                      newStudent.firstName
                    }
                    onChange={
                      handleNewStudentChange
                    }
                    autoComplete="off"
                    required
                  />

                </div>

                <div className="teacher-form-group">

                  <label>
                    اللقب
                  </label>

                  <input
                    name="lastName"
                    value={
                      newStudent.lastName
                    }
                    onChange={
                      handleNewStudentChange
                    }
                    autoComplete="off"
                    required
                  />

                </div>

                <div className="teacher-form-group">

                  <label>
                    تاريخ الميلاد
                  </label>

                  <input
                    type="date"
                    name="birthDate"
                    value={
                      newStudent.birthDate
                    }
                    onChange={
                      handleNewStudentChange
                    }
                  />

                </div>

                <div className="teacher-form-group">

                  <label>
                    مكان الميلاد
                  </label>

                  <input
                    name="birthPlace"
                    value={
                      newStudent.birthPlace
                    }
                    onChange={
                      handleNewStudentChange
                    }
                    autoComplete="off"
                  />

                </div>

                <div className="teacher-form-group">

                  <label>
                    مكان الإقامة
                  </label>

                  <input
                    name="residence"
                    value={
                      newStudent.residence
                    }
                    onChange={
                      handleNewStudentChange
                    }
                    autoComplete="off"
                  />

                </div>

                <div className="teacher-form-group">

                  <label>
                    اسم الولي
                  </label>

                  <input
                    name="guardianName"
                    value={
                      newStudent.guardianName
                    }
                    onChange={
                      handleNewStudentChange
                    }
                    autoComplete="off"
                  />

                </div>

                <div className="teacher-form-group full-width">

                  <label>
                    رقم هاتف الولي
                  </label>

                  <input
                    type="tel"
                    name="guardianPhone"
                    value={
                      newStudent.guardianPhone
                    }
                    onChange={
                      handleNewStudentChange
                    }
                    autoComplete="off"
                  />

                </div>

              </div>

              <button
                type="submit"
                className="save-student-button"
                disabled={
                  saving
                }
              >
                {saving
                  ? "جارٍ إضافة الطالب..."
                  : "إضافة الطالب"}
              </button>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}

export default TeacherDashboardPage;