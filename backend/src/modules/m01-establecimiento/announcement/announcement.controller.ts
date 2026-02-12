import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto';
import { PaginationQueryDto } from '../../../common/dto';

@Controller('api/v1/modules/m01/announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  async create(@Body() dto: CreateAnnouncementDto) {
    return this.announcementService.create(dto);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.announcementService.findAll(query);
  }

  @Get('active')
  async findActive(@Query() query: PaginationQueryDto) {
    return this.announcementService.findActive(query);
  }

  @Get('sent/:creatorId')
  async getSentList(
    @Param('creatorId', ParseIntPipe) creatorId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.announcementService.getSentList(creatorId, query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.announcementService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.announcementService.delete(id);
  }
}
