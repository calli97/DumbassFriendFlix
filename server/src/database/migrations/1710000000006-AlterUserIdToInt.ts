import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Changes users.id from VARCHAR(36) (UUID) to INT AUTO_INCREMENT,
 * and updates the user_roles foreign key accordingly.
 */
export class AlterUserIdToInt1710000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the foreign key on user_roles that references users.id
    await queryRunner.query(`
      ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_user_roles_user\`
    `);

    // 2. Drop the primary key on users so we can change its type
    await queryRunner.query(`
      ALTER TABLE \`users\` DROP PRIMARY KEY
    `);

    // 3. Change users.id to INT AUTO_INCREMENT
    await queryRunner.query(`
      ALTER TABLE \`users\`
        MODIFY COLUMN \`id\` INT NOT NULL AUTO_INCREMENT,
        ADD PRIMARY KEY (\`id\`)
    `);

    // 4. Change user_roles.user_id to INT to match the new type
    await queryRunner.query(`
      ALTER TABLE \`user_roles\`
        MODIFY COLUMN \`user_id\` INT NOT NULL
    `);

    // 5. Re-add the foreign key
    await queryRunner.query(`
      ALTER TABLE \`user_roles\`
        ADD CONSTRAINT \`FK_user_roles_user\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_user_roles_user\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_roles\`
        MODIFY COLUMN \`user_id\` VARCHAR(36) NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\` DROP PRIMARY KEY
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\`
        MODIFY COLUMN \`id\` VARCHAR(36) NOT NULL,
        ADD PRIMARY KEY (\`id\`)
    `);
    await queryRunner.query(`
      ALTER TABLE \`user_roles\`
        ADD CONSTRAINT \`FK_user_roles_user\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    `);
  }
}
