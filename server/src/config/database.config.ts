import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export function buildDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 3306),
    username: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', 'password'),
    database: configService.get<string>('DB_DATABASE', 'dumbassfriendflix'),
    // Resolve entity files from both source and compiled output
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    // Resolve migration files from both source and compiled output
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
    migrationsRun: configService.get<string>('NODE_ENV') === 'production',
    logging: configService.get<string>('NODE_ENV') === 'development',
  };
}
