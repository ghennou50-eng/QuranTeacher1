import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="brand-mark">
            <span>ق</span>
          </div>

          <h1>معلم القرآن</h1>

          <p className="hero-description">
            منصة تجمع مدارس القرآن الكريم والمعلمين وأولياء الأمور
            لمتابعة تعليم الطلاب وحفظهم وحضورهم بسهولة وأمان.
          </p>

          <div className="account-options">
            <Link to="/school/login" className="account-card">
              <div className="account-icon">🏫</div>
              <div>
                <h2>مدرسة</h2>
                <p>إدارة المدرسة والمعلمين والطلاب</p>
              </div>
              <span className="card-arrow">←</span>
            </Link>

            <Link to="/teacher/login" className="account-card">
              <div className="account-icon">👨‍🏫</div>
              <div>
                <h2>معلم</h2>
                <p>إدارة الطلاب وتسجيل الحضور والحفظ</p>
              </div>
              <span className="card-arrow">←</span>
            </Link>

            <Link to="/parent/login" className="account-card">
              <div className="account-icon">👨‍👩‍👦</div>
              <div>
                <h2>ولي أمر</h2>
                <p>متابعة الأبناء والحضور والحفظ</p>
              </div>
              <span className="card-arrow">←</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;