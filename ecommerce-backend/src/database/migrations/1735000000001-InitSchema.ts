import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1735000000001 implements MigrationInterface {
  name = 'InitSchema1735000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('admin', 'customer')`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "username" varchar(100) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(255) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'customer',
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_username" ON "users" ("username")`);
        await queryRunner.query(
      `CREATE INDEX "IDX_sessions_active" ON "sessions" ("jti") WHERE "revoked_at" IS NULL`,
    );

    // categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "name" varchar(150) NOT NULL,
        "slug" varchar(160) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_categories_slug" ON "categories" ("slug")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
