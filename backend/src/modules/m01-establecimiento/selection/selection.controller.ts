import { Controller, Get, Param, Query, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { SelectionService } from './selection.service';
import { MyInstitutionsQueryDto, MyInstitutionsResponseDto } from './dto';
import { InstitutionDto } from '../common/dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';

@Controller('v1/modules/m01/selection')
export class SelectionController {
  constructor(private readonly selectionService: SelectionService) {}

  /**
   * GET /api/v1/modules/m01/selection/my-institutions
   * Returns institutions filtered by user's classrooms/establishments
   */
  @Get('my-institutions')
  async getMyInstitutions(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: MyInstitutionsQueryDto,
  ): Promise<MyInstitutionsResponseDto> {
    // Use user.userId if authenticated, otherwise use mock for @Public endpoints
    const userId = user?.userId ?? BigInt(1);
    return this.selectionService.getMyInstitutions(userId, query);
  }

  /**
   * GET /api/v1/modules/m01/selection/my-institutions/:id
   * Returns a specific institution by ID (if user has access)
   */
  @Get('my-institutions/:id')
  async getInstitutionById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InstitutionDto> {
    const userId = user?.userId ?? BigInt(1);
    const institution = await this.selectionService.getInstitutionById(userId, id);

    if (!institution) {
      throw new NotFoundException({
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with ID ${id} not found or access denied`,
      });
    }

    return institution;
  }
}
