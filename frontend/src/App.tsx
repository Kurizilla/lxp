import { Routes, Route, Navigate } from 'react-router-dom';
import AdminUsersPage from './pages/m01/AdminUsersPage';
import AdminRolesPage from './pages/m01/AdminRolesPage';
import AdminEstablishmentsPage from './pages/m01/AdminEstablishmentsPage';
import AdminClassroomsPage from './pages/m01/AdminClassroomsPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/roles" element={<AdminRolesPage />} />
        <Route path="/admin/establishments" element={<AdminEstablishmentsPage />} />
        <Route path="/admin/classrooms" element={<AdminClassroomsPage />} />
      </Routes>
    </div>
  );
}

export default App;
