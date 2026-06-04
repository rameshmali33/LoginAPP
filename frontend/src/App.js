import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Departments from "./pages/Departments";
import Skills from "./pages/Skills";
import CreateEmployee from "./pages/CreateEmployee";
import EmployeeList from "./pages/EmployeeList";
import EditEmployee from "./pages/EditEmployee";
import UploadImages from "./pages/UploadImages";
import AssignSkills from "./pages/AssignSkills";
import EmployeeReport from "./pages/EmployeeReport";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route
          path="/departments"
           element={<Departments />}
        />

        <Route path="/skills" element={<Skills />} />

        <Route path="/create-employee" element={<CreateEmployee />} />

        <Route path="/employees" element={<EmployeeList />} />

        <Route path="/edit-employee/:id" element={<EditEmployee />} />

        <Route path="/upload-images/:employeeId" element={<UploadImages />} />

        <Route path="/assign-skills/:employeeId" element={<AssignSkills />} />

        <Route path="/report" element={<EmployeeReport />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;