import { Injectable } from '@nestjs/common';
import { MyInstitutionsQueryDto, MyInstitutionsResponseDto } from './dto';
import { InstitutionDto } from '../common/dto';

@Injectable()
export class SelectionService {
  /**
   * Get institutions filtered by user context (user_classrooms/establishments)
   * This is a stub implementation that returns mock data
   * In production, this would query the database filtering by user's associations
   */
  async getMyInstitutions(
    userId: bigint,
    query: MyInstitutionsQueryDto,
  ): Promise<MyInstitutionsResponseDto> {
    const { page = 1, limit = 10, search } = query;

    // Stub data - simulates institutions associated with the user
    const mockInstitutions: InstitutionDto[] = [
      {
        id: 1,
        name: 'Escuela Básica Municipal N°1',
        rbd: '10001-5',
        address: 'Av. Principal 123',
        commune: 'Santiago',
        region: 'Metropolitana',
        classrooms: [
          { id: 1, name: '1° Básico A', grade: '1°', section: 'A', establishmentId: 1 },
          { id: 2, name: '2° Básico A', grade: '2°', section: 'A', establishmentId: 1 },
          { id: 3, name: '3° Básico A', grade: '3°', section: 'A', establishmentId: 1 },
        ],
      },
      {
        id: 2,
        name: 'Liceo Técnico Industrial',
        rbd: '10002-3',
        address: 'Calle Secundaria 456',
        commune: 'Providencia',
        region: 'Metropolitana',
        classrooms: [
          { id: 4, name: '1° Medio A', grade: '1°M', section: 'A', establishmentId: 2 },
          { id: 5, name: '2° Medio A', grade: '2°M', section: 'A', establishmentId: 2 },
        ],
      },
      {
        id: 3,
        name: 'Colegio Particular Subvencionado San José',
        rbd: '10003-1',
        address: 'Pasaje Los Álamos 789',
        commune: 'Las Condes',
        region: 'Metropolitana',
        classrooms: [
          { id: 6, name: 'Pre-Kinder', grade: 'PK', section: 'A', establishmentId: 3 },
          { id: 7, name: 'Kinder', grade: 'K', section: 'A', establishmentId: 3 },
        ],
      },
    ];

    // Filter by search term if provided
    let filteredInstitutions = mockInstitutions;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInstitutions = mockInstitutions.filter(
        (inst) =>
          inst.name.toLowerCase().includes(searchLower) ||
          inst.rbd?.toLowerCase().includes(searchLower) ||
          inst.commune?.toLowerCase().includes(searchLower),
      );
    }

    // Apply pagination
    const total = filteredInstitutions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredInstitutions.slice(startIndex, endIndex);

    return {
      page,
      limit,
      total,
      data: paginatedData,
    };
  }

  /**
   * Get a specific institution by ID for the user
   */
  async getInstitutionById(
    userId: bigint,
    institutionId: number,
  ): Promise<InstitutionDto | null> {
    // Stub implementation - would verify user has access to this institution
    const institutions = await this.getMyInstitutions(userId, { page: 1, limit: 100 });
    return institutions.data.find((inst) => inst.id === institutionId) || null;
  }
}
