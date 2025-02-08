import React from 'react';

const Sidebar = () => {
  return (
    <>
      {/* Include Tabler Icons and Google Fonts */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <div className="sidebar">
        <div className="logo">
          <span>SmartPrep</span>
          <small>Your Study Companion</small>
        </div>

        <div className="nav-item-active">
          <i className="ti ti-dashboard i" />
          <span>Dashboard</span>
        </div>
        <div className="nav-item">
          <i className="ti ti-book i" />
          <span>Courses</span>
        </div>
        <div className="nav-item">
          <i className="ti ti-edit i" />
          <span>Practice Exams</span>
        </div>
        <div className="nav-item">
          <i className="ti ti-bar-chart i" />
          <span>Progress</span>
        </div>
        <div className="nav-item">
          <i className="ti ti-settings i" />
          <span>Settings</span>
        </div>

        <div className="sub-item">Profile</div>
        <div className="sub-item">Notifications</div>
        <div className="sub-item">Help Center</div>

        <div className="pro-card">
          <div className="pro-card-title">Unlock SmartPrep PRO</div>
          <div className="pro-card-text">
            Elevate your study experience with advanced analytics and personalized learning paths.
          </div>
          <button className="pro-card-button">Upgrade Now</button>
        </div>

        <div className="user-section">
          <div className="user-info">
            <i className="ti ti-user-circle user-avatar" />
            <div className="user-name">Alex Johnson</div>
          </div>
          <i className="ti ti-logout logout-icon" />
        </div>
      </div>

      <style jsx>{`
        /* Entrance Animation */
        @keyframes slideIn {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .sidebar {
          width: 310px;
          background-color: #fff;
          border-radius: 20px;
          box-shadow: 0 17px 40px 4px rgba(112, 144, 176, 0.11);
          padding: 52px 27px 26px;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.5s ease-out forwards;
        }
        @media (max-width: 991px) {
          .sidebar {
            width: 280px;
          }
        }
        @media (max-width: 640px) {
          .sidebar {
            width: 100%;
            padding: 30px 20px;
          }
        }

        .logo {
          text-align: center;
          margin-bottom: 40px;
          font: 700 26px Poppins, sans-serif;
          color: #1b2559;
        }
        .logo small {
          display: block;
          font: 400 14px "Plus Jakarta Sans", sans-serif;
          color: #718096;
        }

        .nav-item-active,
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          color: #718096;
          cursor: pointer;
          transition: all 0.3s ease;
          font: 500 16px "Plus Jakarta Sans", sans-serif;
        }
        @media (max-width: 640px) {
          .nav-item-active,
          .nav-item {
            padding: 10px 14px;
          }
        }
        .nav-item-active {
          background-color: rgba(107, 70, 255, 0.1);
          border-radius: 10px;
          color: #1b2559;
        }
        .nav-item:hover,
        .nav-item-active:hover {
          background-color: rgba(107, 70, 255, 0.15);
          border-radius: 10px;
          transform: scale(1.02);
        }
        .i {
          font-size: 20px;
        }

        .sub-item {
          color: #718096;
          padding: 11px 45px;
          cursor: pointer;
          transition: all 0.3s ease;
          font: 500 14px "Plus Jakarta Sans", sans-serif;
        }
        .sub-item:hover {
          color: #1b2559;
          transform: translateX(5px);
        }
        @media (max-width: 640px) {
          .sub-item {
            padding: 10px 14px;
          }
        }

        .pro-card {
          background: linear-gradient(135deg, #6b46ff, #4f28db);
          border-radius: 16px;
          padding: 32px 20px;
          text-align: center;
          margin: 20px 0;
          color: #fff;
          transition: transform 0.3s ease;
        }
        .pro-card:hover {
          transform: scale(1.02);
        }
        @media (max-width: 640px) {
          .pro-card {
            padding: 24px 16px;
          }
        }
        .pro-card-title {
          margin-bottom: 10px;
          font: 700 18px "Plus Jakarta Sans", sans-serif;
        }
        .pro-card-text {
          margin-bottom: 20px;
          font: 500 14px/1.5 "Plus Jakarta Sans", sans-serif;
        }
        .pro-card-button {
          border-radius: 45px;
          padding: 10px 24px;
          color: #fff;
          border: none;
          cursor: pointer;
          width: fit-content;
          margin: 0 auto;
          transition: background-color 0.3s ease;
          background-color: rgba(255, 255, 255, 0.14);
          font: 600 14px "Plus Jakarta Sans", sans-serif;
        }
        .pro-card-button:hover {
          background-color: rgba(255, 255, 255, 0.25);
        }

        .user-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 30px;
          padding: 14px;
          box-shadow: 14px 17px 40px 4px rgba(112, 144, 176, 0.08);
          margin-top: 20px;
          background-color: #fff;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .user-avatar {
          font-size: 34px;
          color: #6b46ff;
        }
        .user-name {
          color: #1b2559;
          font: 700 14px "Plus Jakarta Sans", sans-serif;
        }
        .logout-icon {
          font-size: 24px;
          padding: 8px;
          cursor: pointer;
          transition: transform 0.3s ease;
          color: #718096;
        }
        .logout-icon:hover {
          transform: rotate(90deg);
          color: #1b2559;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
