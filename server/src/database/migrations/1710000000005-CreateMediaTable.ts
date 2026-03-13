import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMediaTable1710000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`media\` (
        \`id\`            INT           NOT NULL AUTO_INCREMENT,
        \`title\`         VARCHAR(255)  NOT NULL,
        \`path\`          VARCHAR(1000) NOT NULL,
        \`original_name\` VARCHAR(255)  NOT NULL,
        \`mime_type\`     VARCHAR(100)  NOT NULL,
        \`created_at\`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`media\``);
  }
}
