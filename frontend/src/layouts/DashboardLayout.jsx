import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="layout-wrapper">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`main-container ${!sidebarOpen ? 'full-width' : ''}`}>
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="content-area">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        .layout-wrapper {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-base);
        }

        .main-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0; /* Prevents flex items from overflowing */
          transition: margin-left var(--transition-normal);
        }

        .content-area {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
