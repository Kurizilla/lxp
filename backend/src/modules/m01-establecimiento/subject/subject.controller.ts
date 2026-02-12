import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../auth/auth.guard';

@Controller('v1/modules/m01/subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @Roles('admin')
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectService.create(createSubjectDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.subjectService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectService.update(BigInt(id), updateSubjectDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subjectService.remove(BigInt(id));
  }
}
