import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SchoolRegisterPage.css";

const API_URL =
  "http://localhost:5000/api";

function SchoolRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      associationName: "",
      clubName: "",
      phone: "",
      wilaya: "",
      municipality: "",
      neighborhood: "",
      password: "",
      confirmPassword: ""
    });

  const [insideImage, setInsideImage] =
    useState(null);

  const [outsideImage, setOutsideImage] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const handleChange =
    (event) => {
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

  const handleImageChange =
    (event, setter) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setter(file);
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        formData.password !==
        formData.confirmPassword
      ) {
        alert(
          "كلمتا المرور غير متطابقتين."
        );

        return;
      }

      if (
        !insideImage ||
        !outsideImage
      ) {
        alert(
          "يرجى إضافة الصورة الداخلية والخارجية للمدرسة."
        );

        return;
      }

      try {
        setSubmitting(true);

        const data =
          new FormData();

        data.append(
          "associationName",
          formData.associationName
        );

        data.append(
          "clubName",
          formData.clubName
        );

        data.append(
          "phone",
          formData.phone
        );

        data.append(
          "wilaya",
          formData.wilaya
        );

        data.append(
          "municipality",
          formData.municipality
        );

        data.append(
          "neighborhood",
          formData.neighborhood
        );

        data.append(
          "password",
          formData.password
        );

        data.append(
          "insideImage",
          insideImage
        );

        data.append(
          "outsideImage",
          outsideImage
        );

        const response =
          await fetch(
            `${API_URL}/schools/register`,
            {
              method: "POST",
              body: data
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "تعذر إرسال الطلب."
          );
        }

        alert(
          "تم إرسال طلب تسجيل المدرسة بنجاح. ستتم مراجعته من إدارة المنصة."
        );

        navigate(
          "/school/login"
        );
      } catch (error) {
        console.error(
          "School registration failed:",
          error
        );

        alert(
          error.message ||
            "حدث خطأ أثناء إرسال الطلب."
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <main className="school-register-page">
      <section className="school-register-card">

        <div className="school-register-header">

          <div className="school-register-logo">
            م
          </div>

          <h1>
            إنشاء حساب مدرسة
          </h1>

          <p>
            أدخل معلومات المدرسة لإرسال
            طلب التسجيل إلى إدارة المنصة.
          </p>

        </div>

        <form
          className="school-register-form"
          onSubmit={handleSubmit}
        >

          <div className="form-section">

            <h2>
              معلومات المدرسة
            </h2>

            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="associationName">
                  اسم الجمعية
                </label>

                <input
                  id="associationName"
                  name="associationName"
                  type="text"
                  value={
                    formData.associationName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="اسم الجمعية"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="clubName">
                  اسم النادي
                </label>

                <input
                  id="clubName"
                  name="clubName"
                  type="text"
                  value={
                    formData.clubName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="اسم النادي"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  رقم هاتف المدرسة
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="رقم الهاتف"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="wilaya">
                  الولاية
                </label>

                <input
                  id="wilaya"
                  name="wilaya"
                  type="text"
                  value={
                    formData.wilaya
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="الولاية"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="municipality">
                  البلدية
                </label>

                <input
                  id="municipality"
                  name="municipality"
                  type="text"
                  value={
                    formData.municipality
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="البلدية"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="neighborhood">
                  الحي
                </label>

                <input
                  id="neighborhood"
                  name="neighborhood"
                  type="text"
                  value={
                    formData.neighborhood
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="الحي"
                  required
                />
              </div>

            </div>
          </div>

          <div className="form-section">

            <h2>
              صور المدرسة
            </h2>

            <p className="section-description">
              أضف صورة واضحة من داخل المدرسة
              وصورة واضحة من خارجها.
            </p>

            <div className="image-upload-grid">

              <label className="image-upload-box">

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    handleImageChange(
                      event,
                      setInsideImage
                    )
                  }
                  required
                />

                <span className="upload-icon">
                  +
                </span>

                <strong>
                  صورة داخلية
                </strong>

                <small>
                  JPG أو PNG أو WebP - حتى 5MB
                </small>

                {insideImage && (
                  <span className="selected-file">
                    {insideImage.name}
                  </span>
                )}

              </label>

              <label className="image-upload-box">

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    handleImageChange(
                      event,
                      setOutsideImage
                    )
                  }
                  required
                />

                <span className="upload-icon">
                  +
                </span>

                <strong>
                  صورة خارجية
                </strong>

                <small>
                  JPG أو PNG أو WebP - حتى 5MB
                </small>

                {outsideImage && (
                  <span className="selected-file">
                    {outsideImage.name}
                  </span>
                )}

              </label>

            </div>
          </div>

          <div className="form-section">

            <h2>
              بيانات الدخول
            </h2>

            <div className="form-grid">

              <div className="form-group">

                <label htmlFor="password">
                  كلمة المرور
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="أنشئ كلمة مرور"
                  minLength={6}
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="confirmPassword">
                  تأكيد كلمة المرور
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="أعد كتابة كلمة المرور"
                  minLength={6}
                  required
                />

              </div>

            </div>
          </div>

          <div className="registration-notice">

            <strong>
              تنبيه
            </strong>

            <p>
              بعد إرسال الطلب، لن تتمكن
              المدرسة من الدخول إلى حسابها
              حتى تتم مراجعة الطلب والموافقة
              عليه من إدارة المنصة.
            </p>

          </div>

          <button
            type="submit"
            className="register-submit-button"
            disabled={submitting}
          >
            {submitting
              ? "جارٍ إرسال الطلب..."
              : "إرسال طلب التسجيل"}
          </button>

        </form>

        <div className="register-footer">

          <span>
            لديك حساب بالفعل؟
          </span>

          <Link
            to="/school/login"
          >
            تسجيل الدخول
          </Link>

        </div>

      </section>
    </main>
  );
}

export default SchoolRegisterPage;