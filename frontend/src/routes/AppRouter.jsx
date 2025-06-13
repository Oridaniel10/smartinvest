import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import ChatPage from "../pages/ChatPage";
import ProtectedRoute from "../components/profile/ProtectedRoute";
import UserPage from "../pages/UserPage";
import NotFound from "../pages/NotFound";
import StockPage from '../pages/StockPage';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/users/:username" element={<UserPage />} />
      <Route path="/not-found" element={<NotFound />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        {/* Add other protected routes here in the future */}
      </Route>

      <Route path="/stock/:symbol" element={<StockPage />} />

      {/* Redirect to home for any unmatched route */}
      <Route path="*" element={<Navigate to="/not-found" />} />
    </Routes>
  );
}

export default AppRouter; 