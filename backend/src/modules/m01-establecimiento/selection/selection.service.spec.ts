import { Test, TestingModule } from '@nestjs/testing';
import { SelectionService } from './selection.service';

describe('SelectionService', () => {
  let service: SelectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SelectionService],
    }).compile();

    service = module.get<SelectionService>(SelectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyInstitutions', () => {
    it('should return paginated institutions', async () => {
      const result = await service.getMyInstitutions(BigInt(1), {
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter institutions by search term', async () => {
      const result = await service.getMyInstitutions(BigInt(1), {
        page: 1,
        limit: 10,
        search: 'Municipal',
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].name).toContain('Municipal');
    });

    it('should return empty data for non-matching search', async () => {
      const result = await service.getMyInstitutions(BigInt(1), {
        page: 1,
        limit: 10,
        search: 'nonexistent',
      });

      expect(result.data.length).toBe(0);
    });
  });

  describe('getInstitutionById', () => {
    it('should return institution by ID', async () => {
      const result = await service.getInstitutionById(BigInt(1), 1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it('should return null for non-existing institution', async () => {
      const result = await service.getInstitutionById(BigInt(1), 999);

      expect(result).toBeNull();
    });
  });
});
