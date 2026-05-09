import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import BoardPage from "./pages/BoardPage";
import AdminPage from "./pages/AdminPage";

const PrivateRoute: React.FC<{
  children: React.ReactNode;
  adminOnly?: boolean;
}> = ({ children, adminOnly }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin")
    return <Navigate to="/board" replace />;
  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
    <Navbar />
    <main className="flex-1 overflow-auto">{children}</main>
  </div>
);

const App: React.FC = () => {
  const { token } = useAuthStore();
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            fontFamily: "inherit",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/board" /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/board" /> : <SignupPage />}
        />
        <Route
          path="/board"
          element={
            <PrivateRoute>
              <AppLayout>
                <BoardPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly>
              <AppLayout>
                <AdminPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to={token ? "/board" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
