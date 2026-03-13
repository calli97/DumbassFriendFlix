import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the two base roles (USER and ADMIN) into the roles table.
 * Uses INSERT IGNORE so re-running the migration is idempotent.
 */
export class SeedRoles1710000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT IGNORE INTO \`roles\` (\`name\`) VALUES ('USER'), ('ADMIN')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`roles\` WHERE \`name\` IN ('USER', 'ADMIN')
    `);
  }
}
