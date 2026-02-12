import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, LoadingSpinner, Input } from '../../components/ui';
import { useM01AuthStore } from '../../stores/m01AuthStore';
import { m01AuthService } from '../../services/m01AuthService';
import { showErrorToast } from '../../utils/toast';
import type { Institution } from '../../types/api.types';

export function InstitutionSelectorPage() {
  const navigate = useNavigate();
  const {
    user,
    institutions,
    setInstitutions,
    setSelectedInstitution,
    selectedInstitution,
  } = useM01AuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    selectedInstitution?.id || null
  );

  const fetchInstitutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await m01AuthService.getInstitutions();
      setInstitutions(response.data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load institutions';
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [setInstitutions]);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const handleSelect = (institution: Institution) => {
    setSelectedId(institution.id);
  };

  const handleContinue = () => {
    const selected = institutions.find((i) => i.id === selectedId);
    if (selected) {
      setSelectedInstitution(selected);
      navigate('/m01/select-classroom');
    }
  };

  const filteredInstitutions = institutions.filter(
    (institution) =>
      institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      institution.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Select Institution
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.name || 'User'}! Choose an institution to
            continue.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" className="mx-auto" />
            <p className="mt-4 text-center text-gray-600">
              Loading institutions...
            </p>
          </div>
        ) : institutions.length === 0 ? (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No institutions found
            </h3>
            <p className="mt-2 text-gray-500">
              You don&apos;t have access to any institutions yet.
            </p>
            <p className="mt-1 text-gray-500">
              Please contact your administrator for access.
            </p>
          </Card>
        ) : (
          <>
            {/* Search */}
            <div className="mb-6">
              <Input
                placeholder="Search institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md mx-auto"
              />
            </div>

            {/* Institution List */}
            <div className="space-y-3">
              {filteredInstitutions.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-gray-500">
                    No institutions match your search
                  </p>
                </Card>
              ) : (
                filteredInstitutions.map((institution) => (
                  <InstitutionCard
                    key={institution.id}
                    institution={institution}
                    isSelected={selectedId === institution.id}
                    onSelect={() => handleSelect(institution)}
                  />
                ))
              )}
            </div>

            {/* Continue Button */}
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedId}
                className="min-w-[200px]"
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

interface InstitutionCardProps {
  institution: Institution;
  isSelected: boolean;
  onSelect: () => void;
}

function InstitutionCard({
  institution,
  isSelected,
  onSelect,
}: InstitutionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center space-x-4">
        {institution.logoUrl ? (
          <img
            src={institution.logoUrl}
            alt={institution.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isSelected ? 'bg-primary-100' : 'bg-gray-100'
            }`}
          >
            <svg
              className={`w-6 h-6 ${
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={`font-medium truncate ${
                isSelected ? 'text-primary-900' : 'text-gray-900'
              }`}
            >
              {institution.name}
            </h3>
            {isSelected && (
              <svg
                className="w-5 h-5 text-primary-600 flex-shrink-0 ml-2"
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
          <p
            className={`text-sm ${
              isSelected ? 'text-primary-600' : 'text-gray-500'
            }`}
          >
            Code: {institution.code}
          </p>
          {institution.address && (
            <p className="text-sm text-gray-400 truncate mt-1">
              {institution.address}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
