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
import { InscriptionService } from './inscription.service';
import { CreateInscriptionDto, UpdateInscriptionDto } from './dto';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../auth/auth.guard';

@Controller('v1/modules/m01/inscriptions')
export class InscriptionController {
  constructor(private readonly inscriptionService: InscriptionService) {}

  @Post()
  @Roles('admin')
  create(@Body() createInscriptionDto: CreateInscriptionDto) {
    return this.inscriptionService.create(createInscriptionDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.inscriptionService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inscriptionService.findOne(BigInt(id));
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationQueryDto,
  ) {
    return this.inscriptionService.findByUser(BigInt(userId), paginationDto);
  }

  @Get('classroom/:classroomId')
  findByClassroom(
    @Param('classroomId', ParseIntPipe) classroomId: number,
    @Query() paginationDto: PaginationQueryDto,
  ) {
    return this.inscriptionService.findByClassroom(BigInt(classroomId), paginationDto);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInscriptionDto: UpdateInscriptionDto,
  ) {
    return this.inscriptionService.update(BigInt(id), updateInscriptionDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inscriptionService.remove(BigInt(id));
  }
}
