import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VitesseService } from './vitesse.service';
import { CreateVitesseDto } from './dto/create-vitesse.dto';
import { ListVitesseQueryDto } from './dto/list-vitesse.query.dto';
import { VitesseRangeQueryDto } from './dto/vitesse-range.query.dto';

@ApiTags('vitesse')
@Controller('vitesse')
export class VitesseController {
  constructor(private readonly vitesse: VitesseService) { }

  @Get()
  list(@Query() q: ListVitesseQueryDto) {
    return this.vitesse.list(q);
  }

  @Get('daily')
  daily(@Query() q: VitesseRangeQueryDto) {
    return this.vitesse.getDailySeries(q);
  }

  @Get('summary')
  summary(@Query() q: VitesseRangeQueryDto) {
    return this.vitesse.getSummary(q);
  }

  @Post()
  create(@Body() dto: CreateVitesseDto) {
    return this.vitesse.create(dto);
  }
}
