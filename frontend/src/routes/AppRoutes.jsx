import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { SearchPage } from '../pages/SearchPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { MyReservationsPage } from '../pages/MyReservationsPage';
import { OperatorDashboardPage } from '../pages/OperatorDashboardPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/my-reservations" element={<MyReservationsPage />} />
      <Route path="/operator" element={<OperatorDashboardPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
    </Routes>
  );
};
