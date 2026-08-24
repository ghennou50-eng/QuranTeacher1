import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AdminSchoolRequestPage.css";

function AdminSchoolRequestPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const request = location.state?.request || {
    id: 1,
    association: "جمعية النور",
    club: "نادي القرآن الكريم",
    phone: "0550000000",
    email: "contact@example.com",
    wilaya: "وهران",
    municipality: "وهران",
    district: "المدينة الجديدة",
    address: "وسط الحي",
    responsibleName: "محمد أحمد",
    responsiblePhone: "0550000000",
    submittedAt: "21 أغسطس 2026",
    status: "pending"
  };

  const handleApprove = () => {
    console.log("School request approved:", request);
    navigate("/admin");
  };

  const handleReject = () => {
    console.log("School request rejected:", request);
    navigate("/admin");
  };

  return (
    <main className="admin-school-request-page">

      <header className="admin-school-request-header">
        <div className="admin-school-request-header-content">

          <div>
            <h1>مراجعة طلب المدرسة</h1>
            <p>مراجعة معلومات المدرسة قبل اتخاذ القرار</p>
          </div>

          <Link
            to="/admin"
            className="admin-school-request-back"
          >
            العودة إلى لوحة التحكم
          </Link>

        </div>
      </header>

      <section className="admin-school-request-content">

        <div className="admin-school-request-status">
          <div className="admin-school-request-status-icon">
            !
          </div>

          <div>
            <strong>طلب في انتظار المراجعة</strong>
            <span>
              تم إرسال هذا الطلب بتاريخ {request.submittedAt}
            </span>
          </div>
        </div>

        <section className="admin-school-request-card">

          <div className="admin-school-request-card-header">
            <div>
              <h2>معلومات المدرسة</h2>
              <p>البيانات الأساسية التي قدمتها المدرسة</p>
            </div>
          </div>

          <div className="admin-school-request-grid">

            <div className="admin-school-request-item">
              <span>اسم الجمعية</span>
              <strong>{request.association}</strong>
            </div>

            <div className="admin-school-request-item">
              <span>اسم النادي</span>
              <strong>{request.club}</strong>
            </div>

            <div className="admin-school-request-item">
              <span>الولاية</span>
              <strong>{request.wilaya}</strong>
            </div>

            <div className="admin-school-request-item">
              <span>البلدية</span>
              <strong>{request.municipality}</strong>
            </div>

            <div className="admin-school-request-item">
              <span>الحي</span>
              <strong>{request.district}</strong>
            </div>

            <div className="admin-school-request-item">
              <span>العنوان</span>
              <strong>{request.address}</strong>
            </div>

          </div>

        </section>

        <section className="admin-school-request-card">

          <div className="admin-school-request-card-header">
            <div>
              <h2>معلومات التواصل</h2>
              <p>بيانات المسؤول عن المدرسة</p>
            </div>
          </div>

          <div className="admin-school-request-grid">

            <div className="admin-school-request-item">
              <span>اسم المسؤول</span>
              <strong>{request.responsibleName}</strong>
            </div>

            <div className="admin-school-request-item">
              <span>رقم الهاتف</span>
              <strong>{request.responsiblePhone}</strong>
            </div>

            <div className="admin-school-request-item">
              <span>رقم هاتف المدرسة</span>
              <strong>{request.phone}</strong>
            </div>

            <div className="admin-school-request-item">
              <span>البريد الإلكتروني</span>
              <strong className="ltr-text">
                {request.email}
              </strong>
            </div>

          </div>

        </section>

        <section className="admin-school-request-card">

          <div className="admin-school-request-card-header">
            <div>
              <h2>صور المدرسة</h2>
              <p>الصور التي أرفقتها المدرسة أثناء التسجيل</p>
            </div>
          </div>

          <div className="admin-school-request-images">

            <div className="admin-school-request-image">
              <div className="admin-school-request-image-placeholder">
                الصورة الخارجية للمدرسة
              </div>

              <span>الصورة الخارجية</span>
            </div>

            <div className="admin-school-request-image">
              <div className="admin-school-request-image-placeholder">
                الصورة الداخلية للمدرسة
              </div>

              <span>الصورة الداخلية</span>
            </div>

          </div>

        </section>

        <section className="admin-school-request-decision">

          <div>
            <h2>اتخاذ القرار</h2>
            <p>
              بعد مراجعة البيانات، يمكنك الموافقة على المدرسة أو رفض
              طلب التسجيل.
            </p>
          </div>

          <div className="admin-school-request-actions">

            <button
              type="button"
              className="admin-school-request-reject"
              onClick={handleReject}
            >
              رفض الطلب
            </button>

            <button
              type="button"
              className="admin-school-request-approve"
              onClick={handleApprove}
            >
              الموافقة على المدرسة
            </button>

          </div>

        </section>

      </section>

    </main>
  );
}

export default AdminSchoolRequestPage;