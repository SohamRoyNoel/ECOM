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

  // sessions
  await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "jti" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "ip_address" varchar(64) NULL,
        "user_agent" varchar(512) NULL,
        "last_activity_at" timestamptz NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
  `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_sessions_jti" ON "sessions" ("jti")`);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")`);
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

    // products
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" BIGSERIAL NOT NULL,
        "name" varchar(300) NOT NULL,
        "description" text NULL,
        "sku" varchar(64) NOT NULL,
        "category_id" int NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'USD',
        "stock_quantity" int NOT NULL DEFAULT 0,
        "image_url" varchar(512) NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "products" ADD COLUMN "search_vector" tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("description", '')), 'B')
      ) STORED
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_products_sku" ON "products" ("sku")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_products_category_id_id" ON "products" ("category_id", "id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_products_active_id" ON "products" ("is_active", "id")`);

    // Full-text search 
    await queryRunner.query(
      `CREATE INDEX "IDX_products_search_vector" ON "products" USING GIN ("search_vector")`,
    );
    // Trigram indexes for typo-tolerant ILIKE / similarity() fuzzy matching.
    await queryRunner.query(
      `CREATE INDEX "IDX_products_name_trgm" ON "products" USING GIN ("name" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_description_trgm" ON "products" USING GIN ("description" gin_trgm_ops)`,
    );

    // sponsored_items
    await queryRunner.query(`
      CREATE TABLE "sponsored_items" (
        "id" SERIAL NOT NULL,
        "product_id" bigint NOT NULL,
        "priority" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "starts_at" timestamptz NULL,
        "ends_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sponsored_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sponsored_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sponsored_items_active_priority" ON "sponsored_items" ("is_active", "priority")`,
    );
    // Prevent the same product from being enrolled as a sponsored item twice.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sponsored_items_product_id" ON "sponsored_items" ("product_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
