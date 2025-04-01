import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationCenter from '../common/NotificationCenter';
import { useApp } from '../../contexts/AppContext';

const AppLayout = () => {
  const { notifications } = useApp();

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      {notifications.length > 0 && <NotificationCenter />}
    </div>
  );
};

export default AppLayout;