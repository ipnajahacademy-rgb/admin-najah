import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/AdminLayout";
import Users from "./pages/Users";
import CategoryManager from "./pages/CategoryManager";
import CreateCourse from "./pages/CreateCourse";
import SectionManager from "./pages/SectionManager";

const isLoggedIn = () => !!localStorage.getItem("token");

// Blocks access to admin pages if there's no token — bounces to login.
function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
}

// Blocks access to the login page if already logged in — bounces to admin,
// and `replace` means the login page never sits in history to "go back" to.
function PublicRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/admin" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="users" element={<Users />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="sections" element={<SectionManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;