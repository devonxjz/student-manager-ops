import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { HOME_BY_ROLE } from '@/lib/format';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import NotFoundPage from '@/pages/NotFoundPage';
import MyCreditsPage from '@/pages/student/MyCreditsPage';
import MyProfilePage from '@/pages/student/MyProfilePage';
import TeacherOverviewPage from '@/pages/teacher/TeacherOverviewPage';
import MyClassesPage from '@/pages/teacher/MyClassesPage';
import ClassStudentsPage from '@/pages/teacher/ClassStudentsPage';
import StudentResultsPage from '@/pages/teacher/StudentResultsPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import ClassesPage from '@/pages/admin/ClassesPage';
import TeachersPage from '@/pages/admin/TeachersPage';
import StudentsPage from '@/pages/admin/StudentsPage';
import CoursesPage from '@/pages/admin/CoursesPage';
import UsersPage from '@/pages/admin/UsersPage';

/** /app → chuyển tới trang chủ theo vai trò */
function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={HOME_BY_ROLE[user.role] || '/'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="app" element={<HomeRedirect />} />
          <Route path="password" element={<ChangePasswordPage />} />
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="me/credits" element={<MyCreditsPage />} />
            <Route path="me/profile" element={<MyProfilePage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['teacher']} />}>
            <Route path="teacher" element={<TeacherOverviewPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['teacher', 'admin']} />}>
            <Route path="teacher/classes" element={<MyClassesPage />} />
            <Route path="teacher/classes/:classId" element={<ClassStudentsPage />} />
            <Route path="teacher/classes/:classId/students/:id/results" element={<StudentResultsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="admin" element={<DashboardPage />} />
            <Route path="admin/classes" element={<ClassesPage />} />
            <Route path="admin/teachers" element={<TeachersPage />} />
            <Route path="admin/students" element={<StudentsPage />} />
            <Route path="admin/courses" element={<CoursesPage />} />
            <Route path="admin/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
