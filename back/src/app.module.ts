import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CausesModule } from './causes/causes.module';
import { StopsModule } from './stops/stops.module';
import { MetrageModule } from './métrage/metrage.module';
import { VitesseModule } from './vitesse/vitesse.module';

import { Cause } from './causes/cause.entity';
import { Stop } from './stops/stop.entity';
import { MetrageEntry } from './métrage/metrage.entity';
import { VitesseEntry } from './vitesse/vitesse.entity';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().default(3001),

        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(3306),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').required(),
        DB_NAME: Joi.string().required(),

        CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

        MICRO_STOP_MAX_SECONDS: Joi.number().integer().min(0).default(300),
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 60s
        limit: 120,  // 120 req/min per IP
      },
    ]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get('DB_HOST'),
        port: Number(cfg.get('DB_PORT')),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASSWORD'),
        database: cfg.get('DB_NAME'),
        entities: [Cause, Stop, MetrageEntry, VitesseEntry],
        synchronize: false,
      }),
    }),

    CausesModule,
    StopsModule,
    MetrageModule,
    VitesseModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
