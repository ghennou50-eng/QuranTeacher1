import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./SchoolTeachersPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

function SchoolTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [passwordTeacher, setPasswordTeacher] = useState(null);
  const [deletingTeacher, setDeletingTeacher] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: ""
  });

  const token = localStorage.getItem("quranTeacherToken");

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "انتهت جلسة المدرسة. يرجى تسجيل الدخول من جديد."
        );
      }

      const response = await fetch(
        `${API_URL}/teachers`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "تعذر جلب المعلمين."
        );
      }

      setTeachers(
        Array.isArray(result.teachers)
          ? result.teachers
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
    fetchTeachers();
  }, []);

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      password: ""
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingTeacher(null);
    setShowAddModal(true);
    setError("");
  };

  const openEditModal = (teacher) => {
    setFormData({
      fullName: teacher.full_name || "",
      phone: teacher.phone || "",
      password: ""
    });

    setEditingTeacher(teacher);
    setShowAddModal(true);
    setError("");
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingTeacher(null);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSaveTeacher = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!token) {
        throw new Error(
          "انتهت جلسة المدرسة. يرجى تسجيل الدخول من جديد."
        );
      }

      if (!formData.fullName.trim()) {
        throw new Error("اسم المعلم مطلوب.");
      }

      if (!editingTeacher && formData.password.length < 6) {
        throw new Error(
          "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
        );
      }

      const isEditing = Boolean(editingTeacher);

      const url = isEditing
        ? `${API_URL}/teachers/${editingTeacher.id}`
        : `${API_URL}/teachers`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          ...(isEditing
            ? {}
            : {
                password: formData.password
              })
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر حفظ بيانات المعلم."
        );
      }

      closeModal();
      await fetchTeachers();
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.message ||
          "حدث خطأ أثناء حفظ بيانات المعلم."
      );
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwordTeacher) {
      return;
    }

    const password = window.prompt(
      "أدخل كلمة المرور الجديدة للمعلم:"
    );

    if (password === null) {
      return;
    }

    if (password.length < 6) {
      setError(
        "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
      );
      return;
    }

    try {
      setProcessingId(passwordTeacher.id);
      setError("");

      const response = await fetch(
        `${API_URL}/teachers/${passwordTeacher.id}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ password })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر تغيير كلمة المرور."
        );
      }

      setPasswordTeacher(null);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.message ||
          "حدث خطأ أثناء تغيير كلمة المرور."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const toggleStatus = async (teacher) => {
    try {
      setProcessingId(teacher.id);
      setError("");

      const response = await fetch(
        `${API_URL}/teachers/${teacher.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            isActive: !teacher.is_active
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر تغيير حالة الحساب."
        );
      }

      await fetchTeachers();
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.message ||
          "حدث خطأ أثناء تغيير حالة الحساب."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const deleteTeacher = async () => {
    if (!deletingTeacher) {
      return;
    }

    try {
      setProcessingId(deletingTeacher.id);
      setError("");

      const response = await fetch(
        `${API_URL}/teachers/${deletingTeacher.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر حذف المعلم."
        );
      }

      setDeletingTeacher(null);
      await fetchTeachers();
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.message ||
          "حدث خطأ أثناء حذف المعلم."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="school-teachers-page">

      <header className="school-teachers-header">
        <div className="school-teachers-header-content">

          <div>
            <h1>معلمو المدرسة</h1>
            <p>
              إدارة حسابات المعلمين التابعين للمدرسة.
            </p>
          </div>

          <Link
            to="/school/dashboard"
            className="school-teachers-back"
          >
            العودة إلى لوحة المدرسة
          </Link>

        </div>
      </header>

      <section className="school-teachers-content">

        {error && (
          <div className="school-teachers-error">
            {error}
          </div>
        )}

        <section className="school-teachers-list-card">

          <div className="school-teacher-section-header">

            <div>
              <h2>المعلمون</h2>
              <p>
                جميع المعلمين المسجلين فعليًا في هذه المدرسة.
              </p>
            </div>

            <div className="school-teachers-header-actions">

              <div className="school-teachers-count">
                {teachers.length} معلمين
              </div>

              <button
                type="button"
                className="school-teacher-add-button"
                onClick={openAddModal}
              >
                + إضافة معلم
              </button>

            </div>

          </div>

          {loading ? (
            <div className="school-teachers-empty">
              جارٍ تحميل المعلمين...
            </div>
          ) : teachers.length === 0 ? (
            <div className="school-teachers-empty">
              لا يوجد أي معلم مسجل حاليًا.
            </div>
          ) : (
            <div className="school-teachers-list">

              {teachers.map((teacher) => (
                <article
                  className="school-teacher-row"
                  key={teacher.id}
                >

                  <div className="school-teacher-main">

                    <div className="school-teacher-avatar">
                      {teacher.full_name?.charAt(0) || "م"}
                    </div>

                    <div>
                      <h3>
                        {teacher.full_name}
                      </h3>

                      <p>
                        المعرف:{" "}
                        <strong>
                          {teacher.teacher_code}
                        </strong>
                      </p>

                      {teacher.phone && (
                        <p>
                          الهاتف: {teacher.phone}
                        </p>
                      )}
                    </div>

                  </div>

                  <div className="school-teacher-actions">

                    <span
                      className={
                        teacher.is_active
                          ? "school-teacher-status active"
                          : "school-teacher-status inactive"
                      }
                    >
                      {teacher.is_active
                        ? "نشط"
                        : "معطل"}
                    </span>

                    <button
                      type="button"
                      className="school-teacher-action-button"
                      onClick={() =>
                        openEditModal(teacher)
                      }
                    >
                      تعديل
                    </button>

                    <button
                      type="button"
                      className="school-teacher-action-button"
                      onClick={() => {
                        setPasswordTeacher(teacher);
                        setError("");
                      }}
                    >
                      كلمة المرور
                    </button>

                    <button
                      type="button"
                      className="school-teacher-action-button"
                      disabled={
                        processingId === teacher.id
                      }
                      onClick={() =>
                        toggleStatus(teacher)
                      }
                    >
                      {processingId === teacher.id
                        ? "..."
                        : teacher.is_active
                          ? "تعطيل"
                          : "تفعيل"}
                    </button>

                    <button
                      type="button"
                      className="school-teacher-delete-button"
                      onClick={() =>
                        setDeletingTeacher(teacher)
                      }
                    >
                      حذف
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

      </section>

      {showAddModal && (
        <div
          className="school-teacher-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="school-teacher-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="school-teacher-modal-header">

              <div>
                <span>
                  إدارة المعلمين
                </span>

                <h2>
                  {editingTeacher
                    ? "تعديل بيانات المعلم"
                    : "إضافة معلم"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              className="school-teacher-modal-form"
              onSubmit={handleSaveTeacher}
            >

              <div className="school-teacher-form-group">
                <label>
                  الاسم واللقب
                </label>

                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="school-teacher-form-group">
                <label>
                  رقم الهاتف
                </label>

                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {!editingTeacher && (
                <div className="school-teacher-form-group">
                  <label>
                    كلمة المرور
                  </label>

                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="school-teacher-save-button"
                disabled={saving}
              >
                {saving
                  ? "جارٍ الحفظ..."
                  : editingTeacher
                    ? "حفظ التعديلات"
                    : "إنشاء الحساب"}
              </button>

            </form>

          </div>
        </div>
      )}

      {passwordTeacher && (
        <div
          className="school-teacher-modal-overlay"
          onClick={() =>
            setPasswordTeacher(null)
          }
        >
          <div
            className="school-teacher-confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h2>
              تغيير كلمة المرور
            </h2>

            <p>
              سيتم تغيير كلمة مرور المعلم:
            </p>

            <strong>
              {passwordTeacher.full_name}
            </strong>

            <div className="school-teacher-confirm-actions">

              <button
                type="button"
                className="school-teacher-action-button"
                onClick={() =>
                  setPasswordTeacher(null)
                }
              >
                إلغاء
              </button>

              <button
                type="button"
                className="school-teacher-save-button"
                onClick={changePassword}
              >
                تغيير كلمة المرور
              </button>

            </div>

          </div>
        </div>
      )}

      {deletingTeacher && (
        <div
          className="school-teacher-modal-overlay"
          onClick={() =>
            setDeletingTeacher(null)
          }
        >
          <div
            className="school-teacher-confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h2>
              حذف المعلم
            </h2>

            <p>
              هل أنت متأكد من حذف حساب:
            </p>

            <strong>
              {deletingTeacher.full_name}
            </strong>

            <p className="school-teacher-delete-warning">
              سيتم حذف حساب دخول المعلم. الطلاب المرتبطون
              به سيبقون في المدرسة لكن سيصبحون بدون معلم
              حتى تتم إعادتهم إلى معلم آخر.
            </p>

            <div className="school-teacher-confirm-actions">

              <button
                type="button"
                className="school-teacher-action-button"
                onClick={() =>
                  setDeletingTeacher(null)
                }
              >
                إلغاء
              </button>

              <button
                type="button"
                className="school-teacher-delete-button"
                disabled={
                  processingId ===
                  deletingTeacher.id
                }
                onClick={deleteTeacher}
              >
                {processingId ===
                deletingTeacher.id
                  ? "جارٍ الحذف..."
                  : "حذف المعلم"}
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}

export default SchoolTeachersPage;