import { InstitutionDto } from '../../common/dto/institution.dto';

export class MyInstitutionsResponseDto {
  page: number;
  limit: number;
  total: number;
  data: InstitutionDto[];
}
