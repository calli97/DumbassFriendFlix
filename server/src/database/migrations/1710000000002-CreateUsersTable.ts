import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1710000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\`         INT          NOT NULL AUTO_INCREMENT,
        \`username\`   VARCHAR(100) NOT NULL,
        \`email\`      VARCHAR(255) NOT NULL,
        \`password\`   VARCHAR(255) NOT NULL,
        \`created_at\` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_users_username\` (\`username\`),
        UNIQUE KEY \`UQ_users_email\`    (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
  }
}
