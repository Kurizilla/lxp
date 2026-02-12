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
import { ClassroomService } from './classroom.service';
import { CreateClassroomDto, UpdateClassroomDto } from './dto';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../auth/auth.guard';

@Controller('v1/modules/m01/classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @Roles('admin')
  create(@Body() createClassroomDto: CreateClassroomDto) {
    return this.classroomService.create(createClassroomDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.classroomService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.classroomService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateClassroomDto: UpdateClassroomDto) {
    return this.classroomService.update(BigInt(id), updateClassroomDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.classroomService.remove(BigInt(id));
  }
}
