import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Session } from '../modules/sessions/entities/session.entity';
import { Category } from '../modules/categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [User, Session, Category],
        synchronize: false,
        logging: config.get<boolean>('database.logging'),
        ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
        poolSize: config.get<number>('database.poolSize'),
        extra: {
          max: config.get<number>('database.poolSize'),
          connectionTimeoutMillis: 10_000,
          idleTimeoutMillis: 30_000,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
