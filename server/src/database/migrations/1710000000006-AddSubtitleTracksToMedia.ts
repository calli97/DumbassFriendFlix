import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubtitleTracksToMedia1710000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`media\`
      ADD COLUMN \`subtitle_tracks\` JSON NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`media\`
      DROP COLUMN \`subtitle_tracks\`
    `);
  }
}
