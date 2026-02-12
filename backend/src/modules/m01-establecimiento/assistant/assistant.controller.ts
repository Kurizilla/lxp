import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantQueryDto, AssistantResponseDto } from './dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';

@Controller('v1/modules/m01/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  /**
   * POST /api/v1/modules/m01/assistant/query
   * Process an assistant query and return contextual help
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  async query(
    @CurrentUser() user: CurrentUserPayload,
    @Body() queryDto: AssistantQueryDto,
  ): Promise<AssistantResponseDto> {
    return this.assistantService.query(user.userId, queryDto);
  }
}
