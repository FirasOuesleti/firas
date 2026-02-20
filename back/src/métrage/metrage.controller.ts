import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MetrageService } from './metrage.service';
import { CreateMetrageDto } from './dto/create-metrage.dto';
import { MetrageRangeQueryDto } from './dto/metrage-range.query.dto';

@ApiTags('metrage')
@Controller('metrage')
export class MetrageController {
  constructor(private readonly metrage: MetrageService) { }

  @Get('daily')
  daily(@Query() q: MetrageRangeQueryDto) {
    return this.metrage.getDailySeries(q);
  }

  @Get('total')
  total(@Query() q: MetrageRangeQueryDto) {
    return this.metrage.getTotal(q);
  }

  @Post()
  create(@Body() dto: CreateMetrageDto) {
    return this.metrage.create(dto);
  }
}
