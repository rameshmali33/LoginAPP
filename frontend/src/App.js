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
import EmployeeProfile from "./pages/EmployeeProfile";
import ProfileLinkRequest from "./pages/ProfileLinkRequest";
import ProfileLinkRequestsAdmin from "./pages/ProfileLinkRequestsAdmin";
import LeaveManagement from "./pages/LeaveManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import AssetManagement from "./pages/AssetManagement";
import Notifications from "./pages/Notifications";
import AuditLogs from "./pages/AuditLogs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
        <Route path="/create-employee" element={<ProtectedRoute><CreateEmployee /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
        <Route path="/edit-employee/:id" element={<ProtectedRoute><EditEmployee /></ProtectedRoute>} />
        <Route path="/upload-images/:employeeId" element={<ProtectedRoute><UploadImages /></ProtectedRoute>} />
        <Route path="/assign-skills/:employeeId" element={<ProtectedRoute><AssignSkills /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><EmployeeReport /></ProtectedRoute>} />
        <Route path="/employees/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
        <Route path="/request-profile-link" element={<ProtectedRoute><ProfileLinkRequest /></ProtectedRoute>} />
        <Route path="/profile-link-requests" element={<ProtectedRoute><ProfileLinkRequestsAdmin /></ProtectedRoute>} />
        <Route path="/leaves" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendanceManagement /></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><AssetManagement /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
