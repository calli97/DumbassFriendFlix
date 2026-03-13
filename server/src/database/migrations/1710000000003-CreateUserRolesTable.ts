import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserRolesTable1710000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`user_roles\` (
        \`user_id\` VARCHAR(36) NOT NULL,
        \`role_id\` INT         NOT NULL,
        PRIMARY KEY (\`user_id\`, \`role_id\`),
        CONSTRAINT \`FK_user_roles_user\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_user_roles_role\`
          FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_roles\``);
  }
}
