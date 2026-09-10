import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboardPage.css";

const API_URL = "https://quranteacher1.onrender.com/api";

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

  /*
   * ================================
   * الإضافات الجديدة
   * ================================
   */

  // حالة الموافقة التلقائية
  const [autoApprove, setAutoApprove] =
    useState(() => {
      return (
        localStorage.getItem(
          "adminAutoApproveSchools"
        ) === "true"
      );
    });

  // نستخدم Ref حتى لا تتأثر عملية الفحص
  // بتغيرات React في الـ state
  const autoApproveRef =
    useRef(autoApprove);

  // الطلبات التي شاهدناها من قبل
  const knownRequestIds =
    useRef(new Set());

  // لمنع اعتبار الطلبات القديمة "جديدة"
  const firstRequestsLoad =
    useRef(true);

  /*
   * تحديث Ref عند تغيير المفتاح
   */
  useEffect(() => {
    autoApproveRef.current =
      autoApprove;
  }, [autoApprove]);

  /*
   * طلب إذن إشعارات Chrome
   */
  const requestNotificationPermission =
    async () => {
      if (
        !("Notification" in window)
      ) {
        return;
      }

      if (
        Notification.permission ===
        "default"
      ) {
        try {
          await Notification.requestPermission();
        } catch (notificationError) {
          console.error(
            "Notification permission error:",
            notificationError
          );
        }
      }
    };

  /*
   * إشعار عند وصول مدرسة جديدة
   */
  const showNewSchoolNotification =
    (request) => {
      if (
        !("Notification" in window)
      ) {
        return;
      }

      if (
        Notification.permission !==
        "granted"
      ) {
        return;
      }

      const schoolName =
        request.association_name ||
        request.club_name ||
        "مدرسة جديدة";

      try {
        const notification =
          new Notification(
            "أهل القرآن - طلب مدرسة جديد",
            {
              body: `وصل طلب تسجيل جديد من ${schoolName}`,
              icon: "/favicon.ico",
              tag: `school-request-${request.id}`
            }
          );

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (notificationError) {
        console.error(
          "Show notification failed:",
          notificationError
        );
      }
    };

  /*
   * الموافقة على طلب باستخدام نفس API
   * الموجودة أصلًا في الموقع.
   *
   * هذه الدالة للإضافة التلقائية فقط.
   * زر الموافقة اليدوي الأصلي بقي كما هو
   * في handleApprove بالأسفل.
   */
  const approveAutomatically =
    async (request) => {
      try {
        const response = await fetch(
          `${API_URL}/schools/requests/${request.id}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "تعذر الموافقة التلقائية على الطلب."
          );
        }

        console.log(
          "Auto-approved school request:",
          request.id
        );

        /*
         * تحديث الطلب داخل القائمة مباشرة
         * بدون تغيير بقية البيانات.
         */
        setSchoolRequests(
          (currentRequests) =>
            currentRequests.map(
              (item) =>
                item.id === request.id
                  ? {
                      ...item,
                      status:
                        "approved"
                    }
                  : item
            )
        );

        return true;
      } catch (requestError) {
        console.error(
          "Automatic approval failed:",
          requestError
        );

        /*
         * لا نحذف الطلب من القائمة إذا فشلت
         * الموافقة، حتى يبقى ظاهرًا للموافقة اليدوية.
         */
        setError(
          requestError.message ||
            "تعذر تنفيذ الموافقة التلقائية."
        );

        return false;
      }
    };

  /*
   * ================================
   * الكود الأصلي - جلب الطلبات
   * ================================
   */

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/schools/requests`
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر جلب طلبات المدارس."
        );
      }

      const requests =
        Array.isArray(result.requests)
          ? result.requests
          : [];

      /*
       * ================================
       * الإضافة الجديدة:
       * اكتشاف الطلبات الجديدة
       * ================================
       */

      if (firstRequestsLoad.current) {
        /*
         * في أول تحميل لا نعتبر الطلبات الموجودة
         * طلبات جديدة، حتى لا يتم قبول الطلبات
         * القديمة تلقائيًا.
         */
        requests.forEach((request) => {
          knownRequestIds.current.add(
            request.id
          );
        });

        firstRequestsLoad.current =
          false;
      } else {
        const newRequests =
          requests.filter(
            (request) =>
              request.status ===
                "pending" &&
              !knownRequestIds.current.has(
                request.id
              )
          );

        /*
         * نسجل جميع الطلبات التي ظهرت
         */
        requests.forEach((request) => {
          knownRequestIds.current.add(
            request.id
          );
        });

        /*
         * التعامل مع الطلبات الجديدة
         */
        for (const newRequest of newRequests) {
          /*
           * إشعار Chrome
           */
          showNewSchoolNotification(
            newRequest
          );

          /*
           * الموافقة التلقائية
           */
          if (
            autoApproveRef.current
          ) {
            await approveAutomatically(
              newRequest
            );
          }
        }
      }

      /*
       * نفس السلوك الأصلي:
       * وضع الطلبات القادمة من API في state.
       */
      setSchoolRequests(
        requests
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

  /*
   * ================================
   * فحص الطلبات الجديدة كل 15 ثانية
   * ================================
   */
  useEffect(() => {
    const interval =
      setInterval(() => {
        fetchRequests();
      }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /*
   * ================================
   * الكود الأصلي - الموافقة اليدوية
   * لم نغير منطقها
   * ================================
   */

  const handleApprove = async (
    request
  ) => {
    const confirmed =
      window.confirm(
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
            "Content-Type":
              "application/json"
          }
        }
      );

      const result =
        await response.json();

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

  /*
   * ================================
   * الكود الأصلي - الرفض
   * ================================
   */

  const handleReject = async (
    request
  ) => {
    const reason =
      window.prompt(
        "أدخل سبب رفض طلب المدرسة:"
      );

    if (reason === null) {
      return;
    }

    const cleanReason =
      reason.trim();

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
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            reason: cleanReason
          })
        }
      );

      const result =
        await response.json();

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

  /*
   * ================================
   * الكود الأصلي - تفاصيل الطلب
   * ================================
   */

  const openRequestDetails =
    async (request) => {
      try {
        setError("");

        const response = await fetch(
          `${API_URL}/schools/requests/${request.id}`
        );

        const result =
          await response.json();

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

  /*
   * ================================
   * الإضافة الجديدة:
   * تشغيل / إيقاف الموافقة التلقائية
   * ================================
   */

  const handleAutoApproveChange =
    async (event) => {
      const enabled =
        event.target.checked;

      setAutoApprove(enabled);

      autoApproveRef.current =
        enabled;

      localStorage.setItem(
        "adminAutoApproveSchools",
        String(enabled)
      );

      /*
       * طلب إذن الإشعارات عند ضغط المستخدم
       * على المفتاح.
       */
      await requestNotificationPermission();
    };

  /*
   * ================================
   * الكود الأصلي
   * ================================
   */

  const logout = () => {
    navigate("/admin/login");
  };

  const pendingRequests =
    schoolRequests.filter(
      (request) =>
        request.status ===
        "pending"
    );

  const approvedRequests =
    schoolRequests.filter(
      (request) =>
        request.status ===
        "approved"
    );

  const rejectedRequests =
    schoolRequests.filter(
      (request) =>
        request.status ===
        "rejected"
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
              activeSection ===
              "requests"
                ? "admin-sidebar-item active"
                : "admin-sidebar-item"
            }
            onClick={() =>
              setActiveSection(
                "requests"
              )
            }
          >
            <span>+</span>
            طلبات المدارس
          </button>

          <button
            type="button"
            className={
              activeSection ===
              "schools"
                ? "admin-sidebar-item active"
                : "admin-sidebar-item"
            }
            onClick={() =>
              setActiveSection(
                "schools"
              )
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
                marginBottom:
                  "20px",
                padding:
                  "14px",
                borderRadius:
                  "10px",
                background:
                  "#fff3f3",
                border:
                  "1px solid #e6b8b8",
                color:
                  "#a34848",
                fontSize:
                  "13px"
              }}
            >
              {error}
            </div>
          )}

          {activeSection ===
            "requests" && (
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
                  {
                    pendingRequests.length
                  }{" "}
                  قيد المراجعة
                </div>

              </div>

              {/* =========================
                  الإضافة الجديدة:
                  الموافقة التلقائية
                 ========================= */}

              <div
                style={{
                  marginBottom:
                    "25px",
                  padding:
                    "18px 20px",
                  borderRadius:
                    "14px",
                  background:
                    autoApprove
                      ? "#eefaf1"
                      : "#f7f7f7",
                  border:
                    autoApprove
                      ? "1px solid #b9dfc2"
                      : "1px solid #e2e2e2",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap:
                    "20px",
                  flexWrap:
                    "wrap"
                }}
              >

                <div>
                  <h3
                    style={{
                      margin:
                        "0 0 6px",
                      fontSize:
                        "16px"
                    }}
                  >
                    الموافقة التلقائية
                  </h3>

                  <p
                    style={{
                      margin:
                        "0",
                      color:
                        "#777",
                      fontSize:
                        "13px"
                    }}
                  >
                    عند التفعيل، سيتم قبول
                    طلبات المدارس الجديدة
                    تلقائيًا باستخدام نظام
                    الموافقة الحالي.
                  </p>

                  <div
                    style={{
                      marginTop:
                        "7px",
                      fontSize:
                        "12px",
                      fontWeight:
                        "600",
                      color:
                        autoApprove
                          ? "#278044"
                          : "#888"
                    }}
                  >
                    {autoApprove
                      ? "● الموافقة التلقائية مفعلة"
                      : "● الموافقة اليدوية مفعلة"}
                  </div>
                </div>

                <label
                  style={{
                    position:
                      "relative",
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    cursor:
                      "pointer",
                    flexShrink:
                      "0"
                  }}
                >

                  <input
                    type="checkbox"
                    checked={
                      autoApprove
                    }
                    onChange={
                      handleAutoApproveChange
                    }
                    style={{
                      position:
                        "absolute",
                      opacity:
                        "0",
                      pointerEvents:
                        "none"
                    }}
                  />

                  <span
                    style={{
                      width:
                        "54px",
                      height:
                        "30px",
                      borderRadius:
                        "30px",
                      background:
                        autoApprove
                          ? "#2e9b50"
                          : "#cfcfcf",
                      position:
                        "relative",
                      transition:
                        "0.2s"
                    }}
                  >

                    <span
                      style={{
                        position:
                          "absolute",
                        top:
                          "3px",
                        left:
                          autoApprove
                            ? "27px"
                            : "3px",
                        width:
                          "24px",
                        height:
                          "24px",
                        borderRadius:
                          "50%",
                        background:
                          "#fff",
                        boxShadow:
                          "0 2px 5px rgba(0,0,0,0.2)",
                        transition:
                          "0.2s"
                      }}
                    />

                  </span>

                </label>

              </div>

              {loading ? (
                <div className="admin-empty-state">
                  <h3>
                    جارٍ تحميل الطلبات...
                  </h3>
                </div>
              ) : pendingRequests.length ===
                0 ? (
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
                        key={
                          request.id
                        }
                      >

                        <div className="admin-request-main">

                          <div className="admin-school-icon">
                            م
                          </div>

                          <div className="admin-request-info">

                            <h3>
                              {
                                request.association_name
                              }
                            </h3>

                            <p>
                              {
                                request.club_name
                              }
                            </p>

                            <div className="admin-request-location">
                              {
                                request.wilaya
                              }{" "}
                              -{" "}
                              {
                                request.municipality
                              }{" "}
                              -{" "}
                              {
                                request.district
                              }
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
                  marginTop:
                    "25px",
                  display:
                    "flex",
                  gap:
                    "10px",
                  flexWrap:
                    "wrap"
                }}
              >
                <div className="admin-count">
                  الكل:{" "}
                  {
                    schoolRequests.length
                  }
                </div>

                <div className="admin-count">
                  مقبولة:{" "}
                  {
                    approvedRequests.length
                  }
                </div>

                <div className="admin-count">
                  مرفوضة:{" "}
                  {
                    rejectedRequests.length
                  }
                </div>
              </div>

            </>
          )}

          {activeSection ===
            "schools" && (
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
                  navigate(
                    "/admin/schools"
                  )
                }
                style={{
                  border:
                    "none",
                  minHeight:
                    "40px",
                  padding:
                    "0 16px",
                  borderRadius:
                    "8px",
                  cursor:
                    "pointer"
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
            setSelectedRequest(
              null
            )
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
                  setSelectedRequest(
                    null
                  )
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
                      width:
                        "100%",
                      height:
                        "100%",
                      objectFit:
                        "cover",
                      borderRadius:
                        "10px"
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
                      width:
                        "100%",
                      height:
                        "100%",
                      objectFit:
                        "cover",
                      borderRadius:
                        "10px"
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
