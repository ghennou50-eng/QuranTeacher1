import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminSchoolsPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

function AdminSchoolsPage() {
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [changingStatusId, setChangingStatusId] =
    useState(null);

  const getAuthToken = () => {
    return (
      localStorage.getItem("quranTeacherAdminToken") ||
      localStorage.getItem("quranTeacherToken") ||
      localStorage.getItem("token")
    );
  };

  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      const response = await fetch(
        `${API_URL}/schools`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر جلب قائمة المدارس."
        );
      }

      setSchools(
        Array.isArray(result.schools)
          ? result.schools
          : []
      );
    } catch (err) {
      console.error(
        "Fetch schools failed:",
        err
      );

      setError(
        err.message ||
          "حدث خطأ أثناء جلب المدارس."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const toggleSchoolStatus = async (school) => {
    try {
      setChangingStatusId(school.id);
      setError("");

      const token = getAuthToken();

      const response = await fetch(
        `${API_URL}/schools/${school.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: !school.is_active,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر تغيير حالة المدرسة."
        );
      }

      setSchools((currentSchools) =>
        currentSchools.map((item) =>
          item.id === school.id
            ? {
                ...item,
                is_active:
                  result.school.is_active,
              }
            : item
        )
      );
    } catch (err) {
      console.error(
        "Change school status failed:",
        err
      );

      setError(
        err.message ||
          "حدث خطأ أثناء تغيير حالة المدرسة."
      );
    } finally {
      setChangingStatusId(null);
    }
  };

  const deleteSchool = async (school) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف مدرسة "${school.club_name}" نهائيًا؟\n\nسيتم حذف حساب المدرسة أيضًا.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(school.id);
      setError("");

      const token = getAuthToken();

      const response = await fetch(
        `${API_URL}/schools/${school.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر حذف المدرسة."
        );
      }

      setSchools((currentSchools) =>
        currentSchools.filter(
          (item) => item.id !== school.id
        )
      );
    } catch (err) {
      console.error(
        "Delete school failed:",
        err
      );

      setError(
        err.message ||
          "حدث خطأ أثناء حذف المدرسة."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSchools = schools.filter(
    (school) => {
      const searchValue = search
        .trim()
        .toLowerCase();

      if (!searchValue) {
        return true;
      }

      return (
        String(
          school.club_name || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          school.association_name || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          school.wilaya || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          school.municipality || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          school.district || ""
        )
          .toLowerCase()
          .includes(searchValue)
      );
    }
  );

  return (
    <main className="admin-schools-page">

      <header className="admin-schools-header">
        <div className="admin-schools-header-content">

          <div className="admin-schools-brand">

            <div className="admin-schools-logo">
              QT
            </div>

            <div>
              <h1>إدارة المدارس</h1>

              <p>
                المدارس المسجلة في المنصة
              </p>
            </div>

          </div>

          <Link
            to="/admin"
            className="admin-schools-back"
          >
            لوحة التحكم
          </Link>

        </div>
      </header>

      <section className="admin-schools-content">

        <div className="admin-schools-heading">

          <div>
            <h2>المدارس</h2>

            <p>
              إدارة المدارس المسجلة في المنصة.
            </p>
          </div>

          <div className="admin-schools-count">
            {schools.length} مدارس
          </div>

        </div>

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 15px",
              border: "1px solid #e6b8b8",
              borderRadius: "9px",
              background: "#fff3f3",
              color: "#a34848",
              fontSize: "12px",
              lineHeight: "1.7",
            }}
          >
            {error}
          </div>
        )}

        <div className="admin-schools-toolbar">

          <div className="admin-schools-search">

            <span>⌕</span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث عن مدرسة أو جمعية أو ولاية..."
            />

          </div>

        </div>

        {loading ? (
          <div className="admin-schools-empty">

            <h3>
              جارٍ تحميل المدارس...
            </h3>

            <p>
              يتم جلب المدارس من قاعدة البيانات.
            </p>

          </div>
        ) : (
          <div className="admin-schools-list">

            {filteredSchools.length === 0 ? (
              <div className="admin-schools-empty">

                <div className="admin-schools-empty-icon">
                  ⌕
                </div>

                <h3>
                  لم يتم العثور على مدارس
                </h3>

                <p>
                  لا توجد مدارس مسجلة مطابقة للبحث.
                </p>

              </div>
            ) : (
              filteredSchools.map(
                (school) => (
                  <article
                    className="admin-school-card"
                    key={school.id}
                  >

                    <div className="admin-school-main">

                      <div className="admin-school-avatar">
                        م
                      </div>

                      <div className="admin-school-info">

                        <h3>
                          {school.club_name}
                        </h3>

                        <p>
                          {school.association_name}
                        </p>

                        <div className="admin-school-location">
                          {school.wilaya} -{" "}
                          {school.municipality} -{" "}
                          {school.district}
                        </div>

                      </div>

                    </div>

                    <div className="admin-school-meta">

                      <div className="admin-school-phone">
                        <span>
                          الهاتف
                        </span>

                        <strong>
                          {school.phone}
                        </strong>
                      </div>

                      <div
                        className={
                          school.is_active
                            ? "admin-school-status active"
                            : "admin-school-status inactive"
                        }
                      >
                        {school.is_active
                          ? "نشطة"
                          : "متوقفة"}
                      </div>

                      <button
                        type="button"
                        className={
                          school.is_active
                            ? "admin-school-toggle deactivate"
                            : "admin-school-toggle activate"
                        }
                        disabled={
                          changingStatusId ===
                          school.id
                        }
                        onClick={() =>
                          toggleSchoolStatus(
                            school
                          )
                        }
                      >
                        {changingStatusId ===
                        school.id
                          ? "جارٍ..."
                          : school.is_active
                          ? "تعطيل"
                          : "تفعيل"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteSchool(school)
                        }
                        disabled={
                          deletingId ===
                          school.id
                        }
                        style={{
                          marginTop: "8px",
                          padding:
                            "8px 14px",
                          border: "none",
                          borderRadius: "7px",
                          background:
                            "#b94a48",
                          color: "#fff",
                          cursor:
                            deletingId ===
                            school.id
                              ? "wait"
                              : "pointer",
                        }}
                      >
                        {deletingId ===
                        school.id
                          ? "جارٍ الحذف..."
                          : "حذف المدرسة"}
                      </button>

                    </div>

                  </article>
                )
              )
            )}

          </div>
        )}

        <div className="admin-schools-note">

          <div className="admin-schools-note-icon">
            i
          </div>

          <p>
            المدارس المعروضة هنا يتم جلبها مباشرة
            من قاعدة البيانات.
          </p>

        </div>

      </section>

    </main>
  );
}

export default AdminSchoolsPage;