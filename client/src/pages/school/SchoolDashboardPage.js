import React, {
  useEffect,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import "./SchoolDashboardPage.css";

function SchoolDashboardPage() {
  const navigate =
    useNavigate();

  const [school, setSchool] =
    useState(null);

  const [isEditing, setIsEditing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [formData, setFormData] =
    useState({
      associationName: "",
      clubName: "",
      phone: "",
      wilaya: "",
      municipality: "",
      district: ""
    });

  useEffect(() => {
    const savedSchool =
      localStorage.getItem(
        "quranTeacherSchool"
      );

    const role =
      localStorage.getItem(
        "quranTeacherRole"
      );

    const token =
      localStorage.getItem(
        "quranTeacherToken"
      );

    if (
      !token ||
      role !== "school"
    ) {
      navigate(
        "/school/login",
        {
          replace: true
        }
      );

      return;
    }

    if (savedSchool) {
      try {
        const parsedSchool =
          JSON.parse(
            savedSchool
          );

        const normalizedSchool = {
          ...parsedSchool,

          associationName:
            parsedSchool.associationName ||
            parsedSchool.association_name ||
            "",

          clubName:
            parsedSchool.clubName ||
            parsedSchool.club_name ||
            "",

          phone:
            parsedSchool.phone ||
            "",

          wilaya:
            parsedSchool.wilaya ||
            "",

          municipality:
            parsedSchool.municipality ||
            "",

          district:
            parsedSchool.district ||
            parsedSchool.neighborhood ||
            ""
        };

        setSchool(
          normalizedSchool
        );

        setFormData({
          associationName:
            normalizedSchool.associationName,

          clubName:
            normalizedSchool.clubName,

          phone:
            normalizedSchool.phone,

          wilaya:
            normalizedSchool.wilaya,

          municipality:
            normalizedSchool.municipality,

          district:
            normalizedSchool.district
        });

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

    navigate(
      "/school/login",
      {
        replace: true
      }
    );
  };

  const handleEditOpen = () => {
    setMessage("");
    setError("");

    setFormData({
      associationName:
        school.associationName || "",

      clubName:
        school.clubName || "",

      phone:
        school.phone || "",

      wilaya:
        school.wilaya || "",

      municipality:
        school.municipality || "",

      district:
        school.district || ""
    });

    setIsEditing(true);
  };

  const handleEditClose = () => {
    if (isSaving) {
      return;
    }

    setIsEditing(false);
    setMessage("");
    setError("");
  };

  const handleChange = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value
      })
    );
  };

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !formData.associationName.trim() ||
      !formData.clubName.trim() ||
      !formData.phone.trim() ||
      !formData.wilaya.trim() ||
      !formData.municipality.trim() ||
      !formData.district.trim()
    ) {
      setError(
        "يرجى ملء جميع معلومات المدرسة."
      );

      return;
    }

    const token =
      localStorage.getItem(
        "quranTeacherToken"
      );

    if (!token) {
      navigate(
        "/school/login",
        {
          replace: true
        }
      );

      return;
    }

    if (!school.id) {
      setError(
        "تعذر تحديد المدرسة."
      );

      return;
    }

    setIsSaving(true);

    try {
      const API_URL =
        process.env.REACT_APP_API_URL ||
        "http://localhost:5000/api";

      const response =
        await fetch(
          `${API_URL}/schools/${school.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify(
              formData
            )
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "تعذر تحديث معلومات المدرسة."
        );
      }

      const updatedSchool = {
        ...school,

        ...data.school,

        associationName:
          data.school.associationName,

        clubName:
          data.school.clubName,

        phone:
          data.school.phone,

        wilaya:
          data.school.wilaya,

        municipality:
          data.school.municipality,

        district:
          data.school.district
      };

      setSchool(
        updatedSchool
      );

      localStorage.setItem(
        "quranTeacherSchool",
        JSON.stringify(
          updatedSchool
        )
      );

      setMessage(
        "تم تحديث معلومات المدرسة بنجاح."
      );

      setIsEditing(false);

    } catch (error) {
      console.error(
        "Update school error:",
        error
      );

      setError(
        error.message ||
        "تعذر تحديث معلومات المدرسة."
      );

    } finally {
      setIsSaving(false);
    }
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
                {school.associationName ||
                  "المدرسة"}
              </h1>

              <p>
                {school.clubName ||
                  "نادي القرآن الكريم"}
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

        {message && (
          <div className="school-dashboard-success">
            {message}
          </div>
        )}

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

            <div className="school-info-card-actions">

              <span className="school-active-badge">
                الحساب مفعل
              </span>

              <button
                type="button"
                className="school-edit-button"
                onClick={
                  handleEditOpen
                }
              >
                تعديل المعلومات
              </button>

            </div>

          </div>

          <div className="school-info-grid">

            <div className="school-info-item">

              <span>
                اسم الجمعية
              </span>

              <strong>
                {school.associationName ||
                  "غير متوفر"}
              </strong>

            </div>

            <div className="school-info-item">

              <span>
                اسم النادي
              </span>

              <strong>
                {school.clubName ||
                  "غير متوفر"}
              </strong>

            </div>

            <div className="school-info-item">

              <span>
                رقم الهاتف
              </span>

              <strong>
                {school.phone ||
                  "غير متوفر"}
              </strong>

            </div>

            <div className="school-info-item">

              <span>
                الولاية
              </span>

              <strong>
                {school.wilaya ||
                  "غير متوفر"}
              </strong>

            </div>

            <div className="school-info-item">

              <span>
                البلدية
              </span>

              <strong>
                {school.municipality ||
                  "غير متوفر"}
              </strong>

            </div>

            <div className="school-info-item">

              <span>
                الحي
              </span>

              <strong>
                {school.district ||
                  "غير متوفر"}
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

          <div className="school-section-card">

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

      {isEditing && (
        <div className="school-edit-overlay">

          <div className="school-edit-modal">

            <div className="school-edit-modal-header">

              <div>

                <h2>
                  تعديل معلومات المدرسة
                </h2>

                <p>
                  قم بتعديل البيانات ثم اضغط حفظ.
                </p>

              </div>

              <button
                type="button"
                className="school-edit-close"
                onClick={
                  handleEditClose
                }
                disabled={
                  isSaving
                }
              >
                ×
              </button>

            </div>

            <form
              className="school-edit-form"
              onSubmit={
                handleSave
              }
            >

              <div className="school-edit-grid">

                <div className="school-edit-field">

                  <label>
                    اسم الجمعية
                  </label>

                  <input
                    type="text"
                    name="associationName"
                    value={
                      formData.associationName
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="school-edit-field">

                  <label>
                    اسم النادي
                  </label>

                  <input
                    type="text"
                    name="clubName"
                    value={
                      formData.clubName
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="school-edit-field">

                  <label>
                    رقم الهاتف
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="school-edit-field">

                  <label>
                    الولاية
                  </label>

                  <input
                    type="text"
                    name="wilaya"
                    value={
                      formData.wilaya
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="school-edit-field">

                  <label>
                    البلدية
                  </label>

                  <input
                    type="text"
                    name="municipality"
                    value={
                      formData.municipality
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="school-edit-field">

                  <label>
                    الحي
                  </label>

                  <input
                    type="text"
                    name="district"
                    value={
                      formData.district
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

              </div>

              {error && (
                <div className="school-edit-error">
                  {error}
                </div>
              )}

              <div className="school-edit-actions">

                <button
                  type="button"
                  className="school-edit-cancel"
                  onClick={
                    handleEditClose
                  }
                  disabled={
                    isSaving
                  }
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="school-edit-save"
                  disabled={
                    isSaving
                  }
                >
                  {isSaving
                    ? "جارٍ الحفظ..."
                    : "حفظ التغييرات"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}

export default SchoolDashboardPage;
