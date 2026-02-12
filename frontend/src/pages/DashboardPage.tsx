import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { useM01AuthStore } from '../stores/m01AuthStore';
import { m01AuthService } from '../services/m01AuthService';
import { showSuccessToast } from '../utils/toast';

export function DashboardPage() {
  const {
    user,
    selectedInstitution,
    selectedClassroom,
    logout,
  } = useM01AuthStore();

  const handleLogout = async () => {
    try {
      await m01AuthService.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      logout();
      showSuccessToast('Logged out successfully');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              {selectedInstitution && (
                <p className="text-sm text-gray-500">
                  {selectedInstitution.name}
                  {selectedClassroom && ` - ${selectedClassroom.name}`}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name || 'User'}
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions Card */}
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link to="/m01/select-institution">
                <Button variant="secondary" fullWidth>
                  Change Institution
                </Button>
              </Link>
              <Link to="/m01/select-classroom">
                <Button variant="secondary" fullWidth>
                  Change Classroom
                </Button>
              </Link>
              <Link to="/m01/sessions">
                <Button variant="secondary" fullWidth>
                  Manage Sessions
                </Button>
              </Link>
            </div>
          </Card>

          {/* User Info Card */}
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Your Account
            </h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="text-gray-900">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Role:</span>
                <p className="text-gray-900 capitalize">
                  {user?.role || 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          {/* Selection Info Card */}
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Current Selection
            </h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Institution:</span>
                <p className="text-gray-900">
                  {selectedInstitution?.name || 'Not selected'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Classroom:</span>
                <p className="text-gray-900">
                  {selectedClassroom?.name || 'Not selected'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
