import { Body, Controller, Get, Param, Patch, Post, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CausesService } from './causes.service';
import { CreateCauseDto } from './dto/create-cause.dto';
import { UpdateCauseDto } from './dto/update-cause.dto';
import { ListCausesQueryDto } from './dto/list-causes.query.dto';
import { CausesStatsQueryDto } from './dto/causes-stats.query.dto';

@ApiTags('causes')
@Controller('causes')
export class CausesController {
  constructor(private readonly causes: CausesService) { }

  @Get()
  findAll(@Query() q: ListCausesQueryDto) {
    return this.causes.findAll(q);
  }

  @Get('stats')
  getStats(@Query() q: CausesStatsQueryDto) {
    return this.causes.getStats(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.causes.findOneDto(id);
  }

  @Post()
  async create(@Body() dto: CreateCauseDto) {
    const cause = await this.causes.create(dto);
    return this.causes.findOneDto(Number(cause.id));
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCauseDto) {
    await this.causes.update(id, dto);
    return this.causes.findOneDto(id);
  }
}
