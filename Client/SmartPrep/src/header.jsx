import React from 'react';

const RawImg = ({ image, altText, className }) => {
  return <img src={image} alt={altText} className={className} />;
};

const NavBar = ({ isSecondary = false }) => {
  const items = isSecondary
    ? ['Team', 'Pricing', 'Buy Premium']
    : ['About', 'Technologies', 'Products', 'Discover'];

  return (
    <div className={`nav-bar ${isSecondary ? 'nav-bar-2' : ''}`}>
      {items.map((item, index) => (
        <div key={index} className="nav-item">
          {item}
        </div>
      ))}
      {isSecondary && <div className="get-started">Get Started</div>}
      <style jsx>{`
        .nav-bar {
          display: flex;
          gap: 24px;
          align-items: center;
          color: #fff;
          cursor: pointer;
          font: 14px "Poppins", sans-serif;
        }
        .nav-bar-2 {
          display: flex;
          align-items: center;
        }
        @media (max-width: 991px) {
          .nav-bar,
          .nav-bar-2 {
            gap: 16px;
          }
        }
        @media (max-width: 640px) {
          .nav-bar,
          .nav-bar-2 {
            display: none;
          }
        }
        .nav-item {
          transition: transform 0.2s ease;
        }
        .nav-item:hover {
          transform: scale(1.1);
        }
        .get-started {
          color: #000;
          background-color: #fff;
          padding: 14px 34px;
          border-radius: 55px;
          font: 500 16px "Poppins", sans-serif;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .get-started:hover {
          animation: pulse 0.8s infinite;
        }
        @media (max-width: 640px) {
          .get-started {
            padding: 10px 24px;
            font-size: 14px;
          }
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

const Logo = () => {
  return (
    <div className="logo">
      <RawImg
        image="https://cdn.builder.io/api/v1/image/assets/TEMP/7a61c456db2d140b6cd59cf12f5fcf71accbfcbbe0a54f71e7d93005240461e2?apiKey=067c5bb5a47e48ceb34000b3d7a35b79&"
        altText="SmartPrep AI Logo"
        className="logo-icon"
      />
      <div className="logo-text">
        <div className="smart-prep">SmartPrep</div>
        <div className="ai">AI</div>
      </div>
      <style jsx>{`
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          animation: fadeIn 1s ease-out;
        }
        .logo-icon {
          width: 31px;
          height: 31px;
        }
        .logo-text {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #fff;
          font-size: 22px;
        }
        .smart-prep {
          font-family: "Manrope", sans-serif;
          font-weight: 500;
        }
        .ai {
          font-family: "Poppins", sans-serif;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const Header = () => {
  return (
    <div className="header">
      <NavBar />
      <Logo />
      <NavBar isSecondary />
      <style jsx>{`
        .header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 66px;
          background-color: #4b4acf;
          animation: fadeInDown 1s ease-out;
        }
        @media (max-width: 991px) {
          .header {
            padding: 16px 20px;
          }
        }
        @media (max-width: 640px) {
          .header {
            padding: 12px 16px;
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const ErrorContent = () => {
  return (
    <div className="error-content">
      <RawImg
        image="https://cdn.builder.io/api/v1/image/assets/TEMP/dbf8eab722ad40781cf37740c528631721280e5af75ef833c7214345304e6cfb?apiKey=067c5bb5a47e48ceb34000b3d7a35b79&"
        altText="Error Icon"
        className="error-icon"
      />
      <div className="error-text">Error</div>
      <style jsx>{`
        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 229px;
          animation: fadeIn 1s ease-out;
        }
        @media (max-width: 991px) {
          .error-content {
            margin-top: 100px;
          }
        }
        @media (max-width: 640px) {
          .error-content {
            margin-top: 60px;
          }
        }
        .error-icon {
          width: 296px;
          height: 296px;
          margin-bottom: 20px;
          animation: bounce 2s infinite;
        }
        @media (max-width: 640px) {
          .error-icon {
            width: 200px;
            height: 200px;
          }
        }
        .error-text {
          color: #000;
          letter-spacing: 0.97px;
          font: 900 40px "Roboto", sans-serif;
        }
        @media (max-width: 640px) {
          .error-text {
            font-size: 32px;
          }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const App = () => {
  return (
    <div>
      <Header />
      <ErrorContent />
    </div>
  );
};

export default App;
