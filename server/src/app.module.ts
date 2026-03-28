import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { buildDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Async TypeORM configuration driven by ConfigService
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildDatabaseConfig,
    }),

    // Rate limiting — default values, overridden per-route where needed
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    UsersModule,
    AuthModule,
    MediaModule,
  ],
})
export class AppModule {}
