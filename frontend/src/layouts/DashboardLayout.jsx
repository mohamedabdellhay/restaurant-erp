import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const location = useLocation();
  const onAdmin = location.pathname.startsWith("/admin");

  if (user?.isPlatformOwner && !onAdmin) {
    return <Navigate to="/admin/overview" replace />;
  }

  if (user && !user.isPlatformOwner && onAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="layout-wrapper">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`main-container ${!sidebarOpen ? 'full-width' : ''}`}>
        <Header />

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      <style>{`
        .layout-wrapper {
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
          background-color: var(--bg-base);
        }

        .main-container {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 100vh;
          margin-inline-start: 260px;
          transition: margin-inline-start var(--transition-normal);
        }

        .main-container.full-width {
          margin-inline-start: 80px;
        }

        .content-area {
          flex: 1;
          min-width: 0;
          padding: 2rem;
          overflow: auto;
        }

        @media (max-width: 768px) {
          .content-area {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
