import { Body, Controller, Get, Param, Patch, Post, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StopsService } from './stops.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { ListStopsQueryDto } from './dto/list-stops.query.dto';
import { DailyAnalyticsQueryDto } from './dto/daily-analytics.query.dto';

@ApiTags('stops')
@Controller('stops')
export class StopsController {
  constructor(private readonly stops: StopsService) { }

  // IMPORTANT: analytics routes must appear BEFORE parameterised routes

  @Get('analytics/daily')
  daily(@Query() q: DailyAnalyticsQueryDto) {
    return this.stops.getDailyStopsSummary(q);
  }

  @Get()
  list(@Query() q: ListStopsQueryDto) {
    return this.stops.findAll(q);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.stops.findOneDto(id);
  }

  @Post()
  create(@Body() dto: CreateStopDto) {
    return this.stops.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStopDto) {
    return this.stops.update(id, dto);
  }
}
