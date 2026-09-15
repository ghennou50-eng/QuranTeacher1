import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboardPage.css";

const API_URL = "https://quranteacher1-1.onrender.com/api";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("requests");
  const [schoolRequests, setSchoolRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [autoApprove, setAutoApprove] = useState(() => localStorage.getItem("adminAutoApproveSchools") === "true");
  const autoApproveRef = useRef(autoApprove);
  const knownRequestIds = useRef(new Set());
  const firstRequestsLoad = useRef(true);

  const getAuthToken = () => localStorage.getItem("quranTeacherAdminToken");

  const authHeaders = () => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const handleUnauthorized = (response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("quranTeacherAdminToken");
      localStorage.removeItem("quranTeacherAdmin");
      localStorage.removeItem("quranTeacherRole");
      navigate("/admin/login", { replace: true });
      return true;
    }
    return false;
  };

  useEffect(() => {
    autoApproveRef.current = autoApprove;
  }, [autoApprove]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    }
  };

  const showNewSchoolNotification = (request) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const schoolName = request.association_name || request.club_name || "مدرسة جديدة";
    try {
      const notification = new Notification("أهل القرآن - طلب مدرسة جديد", {
        body: `وصل طلب تسجيل جديد من ${schoolName}`,
        icon: "/favicon.ico",
        tag: `school-request-${request.id}`
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Show notification failed:", error);
    }
  };

  const approveAutomatically = async (request) => {
    try {
      const response = await fetch(`${API_URL}/schools/requests/${request.id}/approve`, {
        method: "POST",
        headers: authHeaders()
      });
      if (handleUnauthorized(response)) return false;
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر الموافقة التلقائية على الطلب.");
      setSchoolRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: "approved" } : item));
      return true;
    } catch (error) {
      console.error("Automatic approval failed:", error);
      setError(error.message || "تعذر تنفيذ الموافقة التلقائية.");
      return false;
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/schools/requests`, {
        method: "GET",
        headers: authHeaders()
      });
      if (handleUnauthorized(response)) return;
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر جلب طلبات المدارس.");

      const requests = Array.isArray(result.requests) ? result.requests : [];

      if (firstRequestsLoad.current) {
        requests.forEach((request) => knownRequestIds.current.add(request.id));
        firstRequestsLoad.current = false;
      } else {
        const newRequests = requests.filter((request) => request.status === "pending" && !knownRequestIds.current.has(request.id));
        requests.forEach((request) => knownRequestIds.current.add(request.id));
        for (const request of newRequests) {
          showNewSchoolNotification(request);
          if (autoApproveRef.current) await approveAutomatically(request);
        }
      }

      setSchoolRequests(requests);
    } catch (error) {
      console.error("Failed to fetch school requests:", error);
      setError(error.message || "تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (request) => {
    if (!window.confirm(`هل تريد الموافقة على طلب "${request.association_name}"؟`)) return;
    try {
      setProcessingId(request.id);
      setError("");
      const response = await fetch(`${API_URL}/schools/requests/${request.id}/approve`, {
        method: "POST",
        headers: authHeaders()
      });
      if (handleUnauthorized(response)) return;
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر الموافقة على الطلب.");
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error("Approve school request failed:", error);
      setError(error.message || "حدث خطأ أثناء الموافقة على الطلب.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt("أدخل سبب رفض طلب المدرسة:");
    if (reason === null) return;
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError("يجب إدخال سبب رفض الطلب.");
      return;
    }
    try {
      setProcessingId(request.id);
      setError("");
      const response = await fetch(`${API_URL}/schools/requests/${request.id}/reject`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason: cleanReason })
      });
      if (handleUnauthorized(response)) return;
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر رفض الطلب.");
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error("Reject school request failed:", error);
      setError(error.message || "حدث خطأ أثناء رفض الطلب.");
    } finally {
      setProcessingId(null);
    }
  };

  const openRequestDetails = async (request) => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/schools/requests/${request.id}`, {
        method: "GET",
        headers: authHeaders()
      });
      if (handleUnauthorized(response)) return;
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر جلب تفاصيل الطلب.");
      setSelectedRequest(result.request);
    } catch (error) {
      console.error("Get school request failed:", error);
      setError(error.message || "تعذر جلب تفاصيل الطلب.");
    }
  };

  const handleAutoApproveChange = async (event) => {
    const enabled = event.target.checked;
    setAutoApprove(enabled);
    autoApproveRef.current = enabled;
    localStorage.setItem("adminAutoApproveSchools", String(enabled));
    await requestNotificationPermission();
  };

  const logout = () => {
    localStorage.removeItem("quranTeacherAdminToken");
    localStorage.removeItem("quranTeacherAdmin");
    localStorage.removeItem("quranTeacherRole");
    navigate("/admin/login", { replace: true });
  };

  const pendingRequests = schoolRequests.filter((request) => request.status === "pending");
  const approvedRequests = schoolRequests.filter((request) => request.status === "approved");
  const rejectedRequests = schoolRequests.filter((request) => request.status === "rejected");

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">
          <div className="admin-dashboard-brand">
            <div className="admin-dashboard-logo">QT</div>
            <div><h1>إدارة التطبيق</h1><p>لوحة تحكم مسير النظام</p></div>
          </div>
          <button type="button" className="admin-logout-button" onClick={logout}>تسجيل الخروج</button>
        </div>
      </header>

      <div className="admin-dashboard-layout">
        <aside className="admin-sidebar">
          <button type="button" className={activeSection === "requests" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => setActiveSection("requests")}>
            <span>+</span> طلبات المدارس
          </button>
          <button type="button" className={activeSection === "schools" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => setActiveSection("schools")}>
            <span>▣</span> المدارس
          </button>
        </aside>

        <section className="admin-dashboard-content">
          {error && <div style={{ marginBottom: "20px", padding: "14px", borderRadius: "10px", background: "#fff3f3", border: "1px solid #e6b8b8", color: "#a34848", fontSize: "13px" }}>{error}</div>}

          {activeSection === "requests" && (
            <>
              <div className="admin-page-heading">
                <div><h2>طلبات تسجيل المدارس</h2><p>مراجعة الطلبات الفعلية الواردة من المدارس.</p></div>
                <div className="admin-count">{pendingRequests.length} قيد المراجعة</div>
              </div>

              <div style={{ marginBottom: "25px", padding: "18px 20px", borderRadius: "14px", background: autoApprove ? "#eefaf1" : "#f7f7f7", border: autoApprove ? "1px solid #b9dfc2" : "1px solid #e2e2e2", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px" }}>الموافقة التلقائية</h3>
                  <p style={{ margin: "0", color: "#777", fontSize: "13px" }}>عند التفعيل، سيتم قبول طلبات المدارس الجديدة تلقائيًا باستخدام نظام الموافقة الحالي.</p>
                  <div style={{ marginTop: "7px", fontSize: "12px", fontWeight: "600", color: autoApprove ? "#278044" : "#888" }}>{autoApprove ? "● الموافقة التلقائية مفعلة" : "● الموافقة اليدوية مفعلة"}</div>
                </div>
                <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer", flexShrink: "0" }}>
                  <input type="checkbox" checked={autoApprove} onChange={handleAutoApproveChange} style={{ position: "absolute", opacity: "0", pointerEvents: "none" }} />
                  <span style={{ width: "54px", height: "30px", borderRadius: "30px", background: autoApprove ? "#2e9b50" : "#cfcfcf", position: "relative", transition: "0.2s" }}>
                    <span style={{ position: "absolute", top: "3px", left: autoApprove ? "27px" : "3px", width: "24px", height: "24px", borderRadius: "50%", background: "#fff", boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "0.2s" }} />
                  </span>
                </label>
              </div>

              {loading ? <div className="admin-empty-state"><h3>جارٍ تحميل الطلبات...</h3></div> : pendingRequests.length === 0 ? (
                <div className="admin-empty-state"><div className="admin-empty-icon">✓</div><h3>لا توجد طلبات جديدة</h3><p>ستظهر هنا طلبات المدارس التي تنتظر موافقة المسير.</p></div>
              ) : (
                <div className="admin-requests-list">
                  {pendingRequests.map((request) => (
                    <article className="admin-request-card" key={request.id}>
                      <div className="admin-request-main">
                        <div className="admin-school-icon">م</div>
                        <div className="admin-request-info">
                          <h3>{request.association_name}</h3>
                          <p>{request.club_name}</p>
                          <div className="admin-request-location">{request.wilaya} - {request.municipality} - {request.district}</div>
                        </div>
                      </div>
                      <div className="admin-request-actions">
                        <button type="button" className="admin-view-button" onClick={() => openRequestDetails(request)} disabled={processingId === request.id}>عرض الطلب</button>
                        <button type="button" className="admin-approve-button" onClick={() => handleApprove(request)} disabled={processingId === request.id}>{processingId === request.id ? "جارٍ..." : "موافقة"}</button>
                        <button type="button" className="admin-reject-button" onClick={() => handleReject(request)} disabled={processingId === request.id}>رفض</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div style={{ marginTop: "25px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div className="admin-count">الكل: {schoolRequests.length}</div>
                <div className="admin-count">مقبولة: {approvedRequests.length}</div>
                <div className="admin-count">مرفوضة: {rejectedRequests.length}</div>
              </div>
            </>
          )}

          {activeSection === "schools" && (
            <div className="admin-page-heading">
              <div><h2>المدارس</h2><p>انتقل إلى صفحة المدارس المسجلة لإدارتها.</p></div>
              <button type="button" className="admin-approve-button" onClick={() => navigate("/admin/schools")} style={{ border: "none", minHeight: "40px", padding: "0 16px", borderRadius: "8px", cursor: "pointer" }}>عرض المدارس</button>
            </div>
          )}
        </section>
      </div>

      {selectedRequest && (
        <div className="admin-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div><h2>تفاصيل طلب المدرسة</h2><p>مراجعة البيانات قبل اتخاذ القرار</p></div>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-detail-item"><span>اسم الجمعية</span><strong>{selectedRequest.association_name}</strong></div>
              <div className="admin-detail-item"><span>اسم النادي</span><strong>{selectedRequest.club_name}</strong></div>
              <div className="admin-detail-item"><span>رقم الهاتف</span><strong>{selectedRequest.phone}</strong></div>
              <div className="admin-detail-item"><span>الولاية</span><strong>{selectedRequest.wilaya}</strong></div>
              <div className="admin-detail-item"><span>البلدية</span><strong>{selectedRequest.municipality}</strong></div>
              <div className="admin-detail-item"><span>الحي</span><strong>{selectedRequest.district}</strong></div>
              <div className="admin-school-images">
                <div className="admin-school-image">
                  {selectedRequest.inside_image_url && <img src={`${API_URL.replace("/api", "")}${selectedRequest.inside_image_url}`} alt="الصورة الداخلية للمدرسة" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />}
                </div>
                <div className="admin-school-image">
                  {selectedRequest.outside_image_url && <img src={`${API_URL.replace("/api", "")}${selectedRequest.outside_image_url}`} alt="الصورة الخارجية للمدرسة" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />}
                </div>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-reject-button" onClick={() => handleReject(selectedRequest)} disabled={processingId === selectedRequest.id}>رفض الطلب</button>
              <button type="button" className="admin-approve-button" onClick={() => handleApprove(selectedRequest)} disabled={processingId === selectedRequest.id}>{processingId === selectedRequest.id ? "جارٍ..." : "الموافقة على المدرسة"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminDashboardPage;
