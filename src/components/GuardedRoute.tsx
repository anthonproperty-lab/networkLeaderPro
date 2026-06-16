import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Splash from '../pages/Splash';

export const GuardedRoute: React.FC = () => {
  const { user, initialized, checkUser } = useAuthStore();

  useEffect(() => {
    if (!initialized) checkUser();
  }, [initialized, checkUser]);

  if (!initialized) return <Splash />;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
