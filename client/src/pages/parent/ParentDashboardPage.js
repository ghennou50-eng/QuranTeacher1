import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ParentDashboardPage.css";

const API_URL = "http://localhost:5000/api";

function ParentDashboardPage() {
  const navigate = useNavigate();

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddChild, setShowAddChild] = useState(false);
  const [username, setUsername] = useState("");
  const [savingChild, setSavingChild] = useState(false);
  const [error, setError] = useState("");

  // دالة مساعدة للحصول على التوكن الصحيح دائماً
  const getAuthToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("quranTeacherParentToken") ||
      localStorage.getItem("quranTeacherToken")
    );
  };

  useEffect(() => {
    const token = getAuthToken();
    const role = localStorage.getItem("quranTeacherRole");

    if (!token || role !== "parent") {
      navigate("/parent/login", { replace: true });
      return;
    }

    fetchChildren(token);
  }, [navigate]);

  const fetchChildren = async (currentToken) => {
    try {
      setLoading(true);
      setError("");

      const token = currentToken || getAuthToken();

      if (!token) {
        throw new Error("انتهت جلسة تسجيل الدخول.");
      }

      const response = await fetch(`${API_URL}/parent/children`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "تعذر جلب الأبناء.");
      }

      setChildren(Array.isArray(result.children) ? result.children : []);
    } catch (requestError) {
      console.error("Fetch parent children failed:", requestError);
      setError(requestError.message || "تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (event) => {
    event.preventDefault();

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("يرجى إدخال اسم مستخدم الطالب.");
      return;
    }

    const alreadyExists = children.some(
      (child) => child.username === cleanUsername
    );

    if (alreadyExists) {
      setError("هذا الطالب تمت إضافته من قبل.");
      return;
    }

    try {
      setSavingChild(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error("انتهت جلسة تسجيل الدخول.");
      }

      const response = await fetch(`${API_URL}/parent/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: cleanUsername,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "تعذر إضافة الطالب.");
      }

      setUsername("");
      setShowAddChild(false);

      // إعادة تحميل قائمة الأبناء فور الإضافة
      await fetchChildren(token);
    } catch (requestError) {
      console.error("Add child failed:", requestError);
      setError(requestError.message || "حدث خطأ أثناء إضافة الطالب.");
    } finally {
      setSavingChild(false);
    }
  };

  const closeAddChild = () => {
    setShowAddChild(false);
    setUsername("");
    setError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("quranTeacherParentToken");
    localStorage.removeItem("quranTeacherToken");
    localStorage.removeItem("quranTeacherRole");
    localStorage.removeItem("quranTeacherParent");
    localStorage.removeItem("user");

    navigate("/parent/login", { replace: true });
  };

  return (
    <main className="parent-dashboard-page">
      <header className="parent-dashboard-header">
        <div className="parent-dashboard-header-content">
          <div className="parent-dashboard-title">
            <div className="parent-dashboard-logo">و</div>
            <div>
              <h1>حساب ولي الأمر</h1>
              <p>متابعة الأبناء</p>
            </div>
          </div>

          <button
            type="button"
            className="parent-logout-button"
            onClick={handleLogout}
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      <section className="parent-dashboard-content">
        {error && !showAddChild && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 15px",
              border: "1px solid #e6b8b8",
              borderRadius: "9px",
              background: "#fff3f3",
              color: "#a34848",
              fontSize: "11px",
              lineHeight: "1.7",
            }}
          >
            {error}
          </div>
        )}

        <div className="parent-welcome">
          <div>
            <h2>أبنائي</h2>
            <p>يمكنك إضافة أبنائك باستخدام اسم المستخدم الخاص بالطالب.</p>
          </div>

          <button
            type="button"
            className="add-child-button"
            onClick={() => {
              setError("");
              setUsername("");
              setShowAddChild(true);
            }}
          >
            <span className="add-child-icon">+</span>
            <span>إضافة أبناء</span>
          </button>
        </div>

        {loading ? (
          <div className="parent-empty-state">
            <div className="parent-empty-icon">...</div>
            <h3>جارٍ تحميل الأبناء</h3>
            <p>يتم جلب بيانات أبنائك...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="parent-empty-state">
            <div className="parent-empty-icon">+</div>
            <h3>لم تتم إضافة أي ابن بعد</h3>
            <p>اضغط على زر "إضافة أبناء" وأدخل اسم المستخدم الخاص بالطالب.</p>

            <button
              type="button"
              onClick={() => {
                setError("");
                setUsername("");
                setShowAddChild(true);
              }}
              className="parent-empty-button"
            >
              إضافة ابن
            </button>
          </div>
        ) : (
          <div className="children-list">
            {children.map((child) => {
              const fullName = `${child.first_name} ${child.last_name}`;

              return (
                <div className="child-card" key={child.id}>
                  <div className="child-card-avatar">
                    {fullName.charAt(0)}
                  </div>

                  <div className="child-card-info">
                    <h3>{fullName}</h3>
                    <p>اسم المستخدم: {child.username}</p>
                    {child.teacher_name && (
                      <p>المعلم: {child.teacher_name}</p>
                    )}
                  </div>

                  <div className="child-card-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/parent/child/${child.id}/data`)}
                    >
                      بيانات الطالب
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/parent/child/${child.id}/progress`)
                      }
                    >
                      متابعة الطالب
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showAddChild && (
        <div className="parent-modal-overlay" onClick={closeAddChild}>
          <div
            className="parent-add-child-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="parent-modal-close"
              onClick={closeAddChild}
            >
              ×
            </button>

            <div className="parent-modal-header">
              <div className="parent-modal-icon">+</div>
              <h2>إضافة أبناء</h2>
              <p>أدخل اسم المستخدم الذي أعطتك إياه إدارة المدرسة.</p>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "10px 12px",
                  border: "1px solid #e6b8b8",
                  borderRadius: "8px",
                  background: "#fff3f3",
                  color: "#a34848",
                  fontSize: "11px",
                  lineHeight: "1.7",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleAddChild}>
              <div className="parent-modal-group">
                <label htmlFor="child-username">اسم مستخدم الطالب</label>

                <input
                  id="child-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="أدخل اسم مستخدم الطالب"
                  autoComplete="off"
                  required
                />
              </div>

              <button
                type="submit"
                className="parent-modal-submit"
                disabled={savingChild}
              >
                {savingChild ? "جارٍ إضافة الطالب..." : "إضافة الطالب"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default ParentDashboardPage;