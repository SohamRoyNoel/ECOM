import { MigrationInterface, QueryRunner } from 'typeorm';
import * as argon2 from 'argon2';
import { DEMO_USERS } from '../seeds/demo-users.data';
import { CATEGORIES } from '../seeds/categories.data';

const DEMO_PASSWORD = process.env.SEED_DEMO_USER_PASSWORD || 'Password@2026';

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
    //  Categories
    const categorySlugToId = new Map<string, number>();
    for (const category of CATEGORIES) {
      const result: { id: number }[] = await queryRunner.query(
        `INSERT INTO "categories" ("name", "slug") VALUES ($1, $2) RETURNING "id"`,
        [category.name, category.slug],
      );
      categorySlugToId.set(category.slug, result[0].id);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users"`);
    await queryRunner.query(`DELETE FROM "categories"`);
  }
}
