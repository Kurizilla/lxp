import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { CreateInscriptionDto, UpdateInscriptionDto } from './dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';

@Controller('api/v1/modules/m01/inscriptions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class InscriptionController {
  constructor(private readonly inscriptionService: InscriptionService) {}

  @Post()
  create(@Body() createInscriptionDto: CreateInscriptionDto) {
    return this.inscriptionService.create(createInscriptionDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.inscriptionService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inscriptionService.findOne(BigInt(id));
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.inscriptionService.findByUser(BigInt(userId), paginationDto);
  }

  @Get('classroom/:classroomId')
  findByClassroom(
    @Param('classroomId', ParseIntPipe) classroomId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.inscriptionService.findByClassroom(BigInt(classroomId), paginationDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInscriptionDto: UpdateInscriptionDto,
  ) {
    return this.inscriptionService.update(BigInt(id), updateInscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inscriptionService.remove(BigInt(id));
  }
}
