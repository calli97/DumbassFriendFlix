import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesTable1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`roles\` (
        \`id\`   INT          NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(50)  NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_roles_name\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`roles\``);
  }
}
