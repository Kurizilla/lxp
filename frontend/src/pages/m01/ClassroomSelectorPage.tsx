import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, LoadingSpinner, Input } from '../../components/ui';
import { useM01AuthStore } from '../../stores/m01AuthStore';
import { m01AuthService } from '../../services/m01AuthService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import type { Classroom } from '../../types/api.types';

export function ClassroomSelectorPage() {
  const navigate = useNavigate();
  const {
    selectedInstitution,
    classrooms,
    setClassrooms,
    setSelectedClassroom,
    selectedClassroom,
  } = useM01AuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    selectedClassroom?.id || null
  );

  // Redirect if no institution selected
  useEffect(() => {
    if (!selectedInstitution) {
      navigate('/m01/select-institution');
    }
  }, [selectedInstitution, navigate]);

  const fetchClassrooms = useCallback(async () => {
    if (!selectedInstitution) return;

    setIsLoading(true);
    try {
      const response = await m01AuthService.getClassrooms(
        selectedInstitution.id
      );
      setClassrooms(response.data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load classrooms';
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedInstitution, setClassrooms]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleSelect = (classroom: Classroom) => {
    setSelectedId(classroom.id);
  };

  const handleContinue = () => {
    const selected = classrooms.find((c) => c.id === selectedId);
    if (selected) {
      setSelectedClassroom(selected);
      showSuccessToast('Selection complete');
      // Navigate to dashboard or main app
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    setSelectedClassroom(null);
    showSuccessToast('Continuing without classroom selection');
    navigate('/dashboard');
  };

  const filteredClassrooms = classrooms.filter(
    (classroom) =>
      classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group classrooms by grade
  const groupedClassrooms = filteredClassrooms.reduce(
    (acc, classroom) => {
      const grade = classroom.grade;
      if (!acc[grade]) {
        acc[grade] = [];
      }
      acc[grade].push(classroom);
      return acc;
    },
    {} as Record<string, Classroom[]>
  );

  const sortedGrades = Object.keys(groupedClassrooms).sort();

  if (!selectedInstitution) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            to="/m01/select-institution"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Change institution
          </Link>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Select Classroom
            </h1>
            <p className="mt-2 text-gray-600">
              Choose a classroom at{' '}
              <span className="font-medium">{selectedInstitution.name}</span>
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" className="mx-auto" />
            <p className="mt-4 text-center text-gray-600">
              Loading classrooms...
            </p>
          </div>
        ) : classrooms.length === 0 ? (
          <Card className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No classrooms found
            </h3>
            <p className="mt-2 text-gray-500">
              This institution doesn&apos;t have any classrooms assigned to you.
            </p>
            <div className="mt-6 space-y-3">
              <Button onClick={handleSkip}>Continue without classroom</Button>
              <div>
                <Link
                  to="/m01/select-institution"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Select a different institution
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Search */}
            <div className="mb-6">
              <Input
                placeholder="Search classrooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md mx-auto"
              />
            </div>

            {/* Classroom List Grouped by Grade */}
            {filteredClassrooms.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-500">
                  No classrooms match your search
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {sortedGrades.map((grade) => (
                  <div key={grade}>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                      {grade}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {groupedClassrooms[grade].map((classroom) => (
                        <ClassroomCard
                          key={classroom.id}
                          classroom={classroom}
                          isSelected={selectedId === classroom.id}
                          onSelect={() => handleSelect(classroom)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Button
                variant="secondary"
                onClick={handleSkip}
                className="sm:min-w-[160px]"
              >
                Skip for now
              </Button>
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedId}
                className="sm:min-w-[200px]"
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ClassroomCardProps {
  classroom: Classroom;
  isSelected: boolean;
  onSelect: () => void;
}

function ClassroomCard({
  classroom,
  isSelected,
  onSelect,
}: ClassroomCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSelected ? 'bg-primary-100' : 'bg-gray-100'
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                isSelected ? 'text-primary-600' : 'text-gray-400'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h4
              className={`font-medium ${
                isSelected ? 'text-primary-900' : 'text-gray-900'
              }`}
            >
              {classroom.name}
            </h4>
            <p
              className={`text-sm ${
                isSelected ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              {classroom.code}
              {classroom.section && ` - ${classroom.section}`}
            </p>
          </div>
        </div>
        {isSelected && (
          <svg
            className="w-5 h-5 text-primary-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
