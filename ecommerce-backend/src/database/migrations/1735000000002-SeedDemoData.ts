import { MigrationInterface, QueryRunner } from 'typeorm';
import * as argon2 from 'argon2';
import { DEMO_USERS } from '../seeds/demo-users.data';
import { CATEGORIES } from '../seeds/categories.data';
import { generateProducts } from '../seeds/product-generator';

const PRODUCT_COUNT = parseInt(process.env.SEED_PRODUCT_COUNT || '5000', 10);
const DEMO_PASSWORD = process.env.SEED_DEMO_USER_PASSWORD || 'Password@2026';
const BATCH_SIZE = 500;

export class SeedDemoData1735000000002 implements MigrationInterface {
  name = 'SeedDemoData1735000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users
    const passwordHash = await argon2.hash(DEMO_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    for (const user of DEMO_USERS) {
      await queryRunner.query(
        `INSERT INTO "users" ("email", "username", "password_hash", "full_name", "role")
         VALUES ($1, $2, $3, $4, $5)`,
        [user.email, user.username, passwordHash, user.fullName, user.role],
      );
    }
    // Categories
    const categorySlugToId = new Map<string, number>();
    for (const category of CATEGORIES) {
      const result: { id: number }[] = await queryRunner.query(
        `INSERT INTO "categories" ("name", "slug") VALUES ($1, $2) RETURNING "id"`,
        [category.name, category.slug],
      );
      categorySlugToId.set(category.slug, result[0].id);
    }

    // Products
    const products = generateProducts(PRODUCT_COUNT);
    const insertedSkus: string[] = [];

    for (let start = 0; start < products.length; start += BATCH_SIZE) {
      const batch = products.slice(start, start + BATCH_SIZE);
      const values: string[] = [];
      const params: unknown[] = [];

      batch.forEach((p, idx) => {
        const categoryId = categorySlugToId.get(p.categorySlug);
        const base = idx * 8;
        values.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`,
        );
        params.push(
          p.name,
          p.description,
          p.sku,
          categoryId,
          p.price,
          p.currency,
          p.stockQuantity,
          p.imageUrl,
        );
        insertedSkus.push(p.sku);
      });

      await queryRunner.query(
        `INSERT INTO "products"
           ("name", "description", "sku", "category_id", "price", "currency", "stock_quantity", "image_url")
         VALUES ${values.join(', ')}`,
        params,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users"`);
    await queryRunner.query(`DELETE FROM "categories"`);
    await queryRunner.query(`DELETE FROM "products"`);
  }
}
