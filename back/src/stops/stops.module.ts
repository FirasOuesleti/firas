import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cause } from '../causes/cause.entity';
import { Stop } from './stop.entity';
import { StopsController } from './stops.controller';
import { StopsService } from './stops.service';

@Module({
    imports: [TypeOrmModule.forFeature([Stop, Cause])],
    controllers: [StopsController],
    providers: [StopsService],
})
export class StopsModule { }
