import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboardPage.css";

const API_URL = "http://localhost:5000/api";

function AdminDashboardPage() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] =
    useState("requests");

  const [schoolRequests, setSchoolRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [processingId, setProcessingId] =
    useState(null);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/schools/requests`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر جلب طلبات المدارس."
        );
      }

      setSchoolRequests(
        Array.isArray(result.requests)
          ? result.requests
          : []
      );
    } catch (requestError) {
      console.error(
        "Failed to fetch school requests:",
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request) => {
    const confirmed = window.confirm(
      `هل تريد الموافقة على طلب "${request.association_name}"؟`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(request.id);
      setError("");

      const response = await fetch(
        `${API_URL}/schools/requests/${request.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر الموافقة على الطلب."
        );
      }

      setSelectedRequest(null);

      await fetchRequests();
    } catch (requestError) {
      console.error(
        "Approve school request failed:",
        requestError
      );

      setError(
        requestError.message ||
          "حدث خطأ أثناء الموافقة على الطلب."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt(
      "أدخل سبب رفض طلب المدرسة:"
    );

    if (reason === null) {
      return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {
      setError(
        "يجب إدخال سبب رفض الطلب."
      );
      return;
    }

    try {
      setProcessingId(request.id);
      setError("");

      const response = await fetch(
        `${API_URL}/schools/requests/${request.id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reason: cleanReason
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر رفض الطلب."
        );
      }

      setSelectedRequest(null);

      await fetchRequests();
    } catch (requestError) {
      console.error(
        "Reject school request failed:",
        requestError
      );

      setError(
        requestError.message ||
          "حدث خطأ أثناء رفض الطلب."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openRequestDetails = async (request) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/schools/requests/${request.id}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر جلب تفاصيل الطلب."
        );
      }

      setSelectedRequest(
        result.request
      );
    } catch (requestError) {
      console.error(
        "Get school request failed:",
        requestError
      );

      setError(
        requestError.message ||
          "تعذر جلب تفاصيل الطلب."
      );
    }
  };

  const logout = () => {
    navigate("/admin/login");
  };

  const pendingRequests =
    schoolRequests.filter(
      (request) =>
        request.status === "pending"
    );

  const approvedRequests =
    schoolRequests.filter(
      (request) =>
        request.status === "approved"
    );

  const rejectedRequests =
    schoolRequests.filter(
      (request) =>
        request.status === "rejected"
    );

  return (
    <main className="admin-dashboard-page">

      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">

          <div className="admin-dashboard-brand">

            <div className="admin-dashboard-logo">
              QT
            </div>

            <div>
              <h1>
                إدارة التطبيق
              </h1>

              <p>
                لوحة تحكم مسير النظام
              </p>
            </div>

          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            تسجيل الخروج
          </button>

        </div>
      </header>

      <div className="admin-dashboard-layout">

        <aside className="admin-sidebar">

          <button
            type="button"
            className={
              activeSection === "requests"
                ? "admin-sidebar-item active"
                : "admin-sidebar-item"
            }
            onClick={() =>
              setActiveSection("requests")
            }
          >
            <span>+</span>
            طلبات المدارس
          </button>

          <button
            type="button"
            className={
              activeSection === "schools"
                ? "admin-sidebar-item active"
                : "admin-sidebar-item"
            }
            onClick={() =>
              setActiveSection("schools")
            }
          >
            <span>▣</span>
            المدارس
          </button>

        </aside>

        <section className="admin-dashboard-content">

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "14px",
                borderRadius: "10px",
                background: "#fff3f3",
                border: "1px solid #e6b8b8",
                color: "#a34848",
                fontSize: "13px"
              }}
            >
              {error}
            </div>
          )}

          {activeSection === "requests" && (
            <>

              <div className="admin-page-heading">

                <div>
                  <h2>
                    طلبات تسجيل المدارس
                  </h2>

                  <p>
                    مراجعة الطلبات الفعلية
                    الواردة من المدارس.
                  </p>
                </div>

                <div className="admin-count">
                  {pendingRequests.length} قيد
                  المراجعة
                </div>

              </div>

              {loading ? (
                <div className="admin-empty-state">
                  <h3>
                    جارٍ تحميل الطلبات...
                  </h3>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="admin-empty-state">

                  <div className="admin-empty-icon">
                    ✓
                  </div>

                  <h3>
                    لا توجد طلبات جديدة
                  </h3>

                  <p>
                    ستظهر هنا طلبات المدارس
                    التي تنتظر موافقة المسير.
                  </p>

                </div>
              ) : (
                <div className="admin-requests-list">

                  {pendingRequests.map(
                    (request) => (
                      <article
                        className="admin-request-card"
                        key={request.id}
                      >

                        <div className="admin-request-main">

                          <div className="admin-school-icon">
                            م
                          </div>

                          <div className="admin-request-info">

                            <h3>
                              {request.association_name}
                            </h3>

                            <p>
                              {request.club_name}
                            </p>

                            <div className="admin-request-location">
                              {request.wilaya} -{" "}
                              {request.municipality} -{" "}
                              {request.district}
                            </div>

                          </div>

                        </div>

                        <div className="admin-request-actions">

                          <button
                            type="button"
                            className="admin-view-button"
                            onClick={() =>
                              openRequestDetails(
                                request
                              )
                            }
                            disabled={
                              processingId ===
                              request.id
                            }
                          >
                            عرض الطلب
                          </button>

                          <button
                            type="button"
                            className="admin-approve-button"
                            onClick={() =>
                              handleApprove(
                                request
                              )
                            }
                            disabled={
                              processingId ===
                              request.id
                            }
                          >
                            {processingId ===
                            request.id
                              ? "جارٍ..."
                              : "موافقة"}
                          </button>

                          <button
                            type="button"
                            className="admin-reject-button"
                            onClick={() =>
                              handleReject(
                                request
                              )
                            }
                            disabled={
                              processingId ===
                              request.id
                            }
                          >
                            رفض
                          </button>

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}

              <div
                style={{
                  marginTop: "25px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap"
                }}
              >
                <div className="admin-count">
                  الكل: {schoolRequests.length}
                </div>

                <div className="admin-count">
                  مقبولة: {approvedRequests.length}
                </div>

                <div className="admin-count">
                  مرفوضة: {rejectedRequests.length}
                </div>
              </div>

            </>
          )}

          {activeSection === "schools" && (
            <div className="admin-page-heading">

              <div>
                <h2>
                  المدارس
                </h2>

                <p>
                  انتقل إلى صفحة المدارس
                  المسجلة لإدارتها.
                </p>
              </div>

              <button
                type="button"
                className="admin-approve-button"
                onClick={() =>
                  navigate("/admin/schools")
                }
                style={{
                  border: "none",
                  minHeight: "40px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                عرض المدارس
              </button>

            </div>
          )}

        </section>

      </div>

      {selectedRequest && (
        <div
          className="admin-modal-overlay"
          onClick={() =>
            setSelectedRequest(null)
          }
        >

          <div
            className="admin-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-modal-header">

              <div>
                <h2>
                  تفاصيل طلب المدرسة
                </h2>

                <p>
                  مراجعة البيانات قبل اتخاذ
                  القرار
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setSelectedRequest(null)
                }
              >
                ×
              </button>

            </div>

            <div className="admin-modal-body">

              <div className="admin-detail-item">
                <span>
                  اسم الجمعية
                </span>

                <strong>
                  {
                    selectedRequest.association_name
                  }
                </strong>
              </div>

              <div className="admin-detail-item">
                <span>
                  اسم النادي
                </span>

                <strong>
                  {
                    selectedRequest.club_name
                  }
                </strong>
              </div>

              <div className="admin-detail-item">
                <span>
                  رقم الهاتف
                </span>

                <strong>
                  {
                    selectedRequest.phone
                  }
                </strong>
              </div>

              <div className="admin-detail-item">
                <span>
                  الولاية
                </span>

                <strong>
                  {
                    selectedRequest.wilaya
                  }
                </strong>
              </div>

              <div className="admin-detail-item">
                <span>
                  البلدية
                </span>

                <strong>
                  {
                    selectedRequest.municipality
                  }
                </strong>
              </div>

              <div className="admin-detail-item">
                <span>
                  الحي
                </span>

                <strong>
                  {
                    selectedRequest.district
                  }
                </strong>
              </div>

              <div className="admin-school-images">

                <div className="admin-school-image">
                  <img
                    src={
                      selectedRequest.inside_image_url
                        ? `${API_URL.replace(
                            "/api",
                            ""
                          )}${selectedRequest.inside_image_url}`
                        : ""
                    }
                    alt="الصورة الداخلية للمدرسة"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "10px"
                    }}
                  />
                </div>

                <div className="admin-school-image">
                  <img
                    src={
                      selectedRequest.outside_image_url
                        ? `${API_URL.replace(
                            "/api",
                            ""
                          )}${selectedRequest.outside_image_url}`
                        : ""
                    }
                    alt="الصورة الخارجية للمدرسة"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "10px"
                    }}
                  />
                </div>

              </div>

            </div>

            <div className="admin-modal-actions">

              <button
                type="button"
                className="admin-reject-button"
                onClick={() =>
                  handleReject(
                    selectedRequest
                  )
                }
                disabled={
                  processingId ===
                  selectedRequest.id
                }
              >
                رفض الطلب
              </button>

              <button
                type="button"
                className="admin-approve-button"
                onClick={() =>
                  handleApprove(
                    selectedRequest
                  )
                }
                disabled={
                  processingId ===
                  selectedRequest.id
                }
              >
                {processingId ===
                selectedRequest.id
                  ? "جارٍ..."
                  : "الموافقة على المدرسة"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

export default AdminDashboardPage;