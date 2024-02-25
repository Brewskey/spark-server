import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initialize1708819642195 implements MigrationInterface {
  name = 'Initialize1708819642195';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "user" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "access_tokens" varchar NOT NULL DEFAULT (\'[]\'), "password_hash" varchar NOT NULL, "role" varchar NOT NULL DEFAULT (\'default\'), "salt" varchar NOT NULL, "user_name" varchar NOT NULL, CONSTRAINT "UQ_d34106f8ec1ebaf66f4f8609dd6" UNIQUE ("user_name"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_d34106f8ec1ebaf66f4f8609dd" ON "user" ("user_name") ',
    );
    await queryRunner.query(
      'CREATE TABLE "product_config" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "organization_id" integer, "product_id" integer NOT NULL)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_116e37d344e5c666adb0c98cce" ON "product_config" ("organization_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_271be22b8b9ff09e64da2b29e2" ON "product_config" ("product_id") ',
    );
    await queryRunner.query(
      'CREATE TABLE "product_firmware" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "is_current" boolean NOT NULL, "data" blob NOT NULL, "description" varchar NOT NULL, "device_count" integer NOT NULL, "name" varchar NOT NULL, "product_id" integer NOT NULL, "size" integer NOT NULL, "title" varchar NOT NULL, "version" integer NOT NULL)',
    );
    await queryRunner.query(
      'CREATE TABLE "device_attributes" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "device_id" varchar PRIMARY KEY NOT NULL, "app_hash" varchar, "claim_code" varchar, "current_build_target" integer, "functions" varchar, "imei" varchar, "ip" varchar, "is_cellular" boolean NOT NULL DEFAULT (0), "last_iccid" varchar, "last_flashed_app_name" varchar, "last_heard" datetime, "name" varchar NOT NULL, "owner_id" integer, "particle_product_id" integer NOT NULL DEFAULT (0), "platform_id" integer NOT NULL DEFAULT (0), "product_firmware_version" integer NOT NULL DEFAULT (0), "registrar" varchar, "variables" varchar NOT NULL DEFAULT (\'{}\'), "reserved_flags" integer, "is_connected" boolean NOT NULL DEFAULT (0))',
    );
    await queryRunner.query(
      'CREATE TABLE "product_device" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "is_denied" boolean NOT NULL, "is_development" boolean NOT NULL, "device_id" varchar NOT NULL, "locked_firmware_version" integer, "notes" varchar NOT NULL, "product_id" integer NOT NULL, "is_quarantined" boolean NOT NULL, "product_firmware_version" integer NOT NULL)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_70f03fb512e5804e4b3a233b15" ON "product_device" ("device_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_2a658ea788ff3454f8d9abb342" ON "product_device" ("product_id") ',
    );
    await queryRunner.query(
      'CREATE TABLE "product" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "product_config_id" integer NOT NULL, "description" varchar NOT NULL, "latest_firmware_version" integer NOT NULL, "name" varchar NOT NULL, "owner_id" integer NOT NULL, "organization_id" integer, "platform_id" varchar NOT NULL, "slug" varchar NOT NULL, "type" varchar NOT NULL)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_c2eedda8bf0194e1fb299ee742" ON "product" ("owner_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_856d7e7672c2a22652daf70e1e" ON "product" ("organization_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_8cfaf4a1e80806d58e3dbe6922" ON "product" ("slug") ',
    );
    await queryRunner.query(
      'CREATE TABLE "organization" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL)',
    );
    await queryRunner.query(
      'CREATE TABLE "webhook" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "auth" varchar, "device_id" varchar, "error_response_topic" varchar, "event" varchar NOT NULL, "form" varchar, "headers" varchar, "json" varchar, "is_from_my_devices" boolean NOT NULL DEFAULT (0), "has_no_defaults" boolean NOT NULL DEFAULT (0), "owner_id" integer NOT NULL, "organization_id" integer, "product_id_or_slug" varchar, "query" varchar, "should_reject_unauthorized" boolean NOT NULL DEFAULT (0), "request_type" varchar NOT NULL, "response_template" varchar, "response_topic" varchar, "url" varchar NOT NULL)',
    );
    await queryRunner.query(
      'CREATE TABLE "device_key_object" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "device_id" varchar PRIMARY KEY NOT NULL, "algorithm" varchar NOT NULL, "key" blob NOT NULL)',
    );
    await queryRunner.query(
      'CREATE TABLE "user_to_organization" ("organization_id" integer NOT NULL, "user_id" integer NOT NULL, PRIMARY KEY ("organization_id", "user_id"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_0fe9ab029fd616083a984fd8aa" ON "user_to_organization" ("organization_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_d90b4b8e84599eab31a0cbe7ba" ON "user_to_organization" ("user_id") ',
    );
    await queryRunner.query(
      'CREATE TABLE "temporary_product_firmware" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "is_current" boolean NOT NULL, "data" blob NOT NULL, "description" varchar NOT NULL, "device_count" integer NOT NULL, "name" varchar NOT NULL, "product_id" integer NOT NULL, "size" integer NOT NULL, "title" varchar NOT NULL, "version" integer NOT NULL, CONSTRAINT "FK_f099cae6c02f2928c42dd9dc76c" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)',
    );
    await queryRunner.query(
      'INSERT INTO "temporary_product_firmware"("created_at", "updated_at", "id", "is_current", "data", "description", "device_count", "name", "product_id", "size", "title", "version") SELECT "created_at", "updated_at", "id", "is_current", "data", "description", "device_count", "name", "product_id", "size", "title", "version" FROM "product_firmware"',
    );
    await queryRunner.query('DROP TABLE "product_firmware"');
    await queryRunner.query(
      'ALTER TABLE "temporary_product_firmware" RENAME TO "product_firmware"',
    );
    await queryRunner.query('DROP INDEX "IDX_70f03fb512e5804e4b3a233b15"');
    await queryRunner.query('DROP INDEX "IDX_2a658ea788ff3454f8d9abb342"');
    await queryRunner.query(
      'CREATE TABLE "temporary_product_device" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "is_denied" boolean NOT NULL, "is_development" boolean NOT NULL, "device_id" varchar NOT NULL, "locked_firmware_version" integer, "notes" varchar NOT NULL, "product_id" integer NOT NULL, "is_quarantined" boolean NOT NULL, "product_firmware_version" integer NOT NULL, CONSTRAINT "FK_2a658ea788ff3454f8d9abb342d" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)',
    );
    await queryRunner.query(
      'INSERT INTO "temporary_product_device"("created_at", "updated_at", "id", "is_denied", "is_development", "device_id", "locked_firmware_version", "notes", "product_id", "is_quarantined", "product_firmware_version") SELECT "created_at", "updated_at", "id", "is_denied", "is_development", "device_id", "locked_firmware_version", "notes", "product_id", "is_quarantined", "product_firmware_version" FROM "product_device"',
    );
    await queryRunner.query('DROP TABLE "product_device"');
    await queryRunner.query(
      'ALTER TABLE "temporary_product_device" RENAME TO "product_device"',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_70f03fb512e5804e4b3a233b15" ON "product_device" ("device_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_2a658ea788ff3454f8d9abb342" ON "product_device" ("product_id") ',
    );
    await queryRunner.query('DROP INDEX "IDX_0fe9ab029fd616083a984fd8aa"');
    await queryRunner.query('DROP INDEX "IDX_d90b4b8e84599eab31a0cbe7ba"');
    await queryRunner.query(
      'CREATE TABLE "temporary_user_to_organization" ("organization_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "FK_0fe9ab029fd616083a984fd8aaa" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_d90b4b8e84599eab31a0cbe7bad" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, PRIMARY KEY ("organization_id", "user_id"))',
    );
    await queryRunner.query(
      'INSERT INTO "temporary_user_to_organization"("organization_id", "user_id") SELECT "organization_id", "user_id" FROM "user_to_organization"',
    );
    await queryRunner.query('DROP TABLE "user_to_organization"');
    await queryRunner.query(
      'ALTER TABLE "temporary_user_to_organization" RENAME TO "user_to_organization"',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_0fe9ab029fd616083a984fd8aa" ON "user_to_organization" ("organization_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_d90b4b8e84599eab31a0cbe7ba" ON "user_to_organization" ("user_id") ',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_d90b4b8e84599eab31a0cbe7ba"');
    await queryRunner.query('DROP INDEX "IDX_0fe9ab029fd616083a984fd8aa"');
    await queryRunner.query(
      'ALTER TABLE "user_to_organization" RENAME TO "temporary_user_to_organization"',
    );
    await queryRunner.query(
      'CREATE TABLE "user_to_organization" ("organization_id" integer NOT NULL, "user_id" integer NOT NULL, PRIMARY KEY ("organization_id", "user_id"))',
    );
    await queryRunner.query(
      'INSERT INTO "user_to_organization"("organization_id", "user_id") SELECT "organization_id", "user_id" FROM "temporary_user_to_organization"',
    );
    await queryRunner.query('DROP TABLE "temporary_user_to_organization"');
    await queryRunner.query(
      'CREATE INDEX "IDX_d90b4b8e84599eab31a0cbe7ba" ON "user_to_organization" ("user_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_0fe9ab029fd616083a984fd8aa" ON "user_to_organization" ("organization_id") ',
    );
    await queryRunner.query('DROP INDEX "IDX_2a658ea788ff3454f8d9abb342"');
    await queryRunner.query('DROP INDEX "IDX_70f03fb512e5804e4b3a233b15"');
    await queryRunner.query(
      'ALTER TABLE "product_device" RENAME TO "temporary_product_device"',
    );
    await queryRunner.query(
      'CREATE TABLE "product_device" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "is_denied" boolean NOT NULL, "is_development" boolean NOT NULL, "device_id" varchar NOT NULL, "locked_firmware_version" integer, "notes" varchar NOT NULL, "product_id" integer NOT NULL, "is_quarantined" boolean NOT NULL, "product_firmware_version" integer NOT NULL)',
    );
    await queryRunner.query(
      'INSERT INTO "product_device"("created_at", "updated_at", "id", "is_denied", "is_development", "device_id", "locked_firmware_version", "notes", "product_id", "is_quarantined", "product_firmware_version") SELECT "created_at", "updated_at", "id", "is_denied", "is_development", "device_id", "locked_firmware_version", "notes", "product_id", "is_quarantined", "product_firmware_version" FROM "temporary_product_device"',
    );
    await queryRunner.query('DROP TABLE "temporary_product_device"');
    await queryRunner.query(
      'CREATE INDEX "IDX_2a658ea788ff3454f8d9abb342" ON "product_device" ("product_id") ',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_70f03fb512e5804e4b3a233b15" ON "product_device" ("device_id") ',
    );
    await queryRunner.query(
      'ALTER TABLE "product_firmware" RENAME TO "temporary_product_firmware"',
    );
    await queryRunner.query(
      'CREATE TABLE "product_firmware" ("created_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated_at" datetime NOT NULL DEFAULT (datetime(\'now\')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "is_current" boolean NOT NULL, "data" blob NOT NULL, "description" varchar NOT NULL, "device_count" integer NOT NULL, "name" varchar NOT NULL, "product_id" integer NOT NULL, "size" integer NOT NULL, "title" varchar NOT NULL, "version" integer NOT NULL)',
    );
    await queryRunner.query(
      'INSERT INTO "product_firmware"("created_at", "updated_at", "id", "is_current", "data", "description", "device_count", "name", "product_id", "size", "title", "version") SELECT "created_at", "updated_at", "id", "is_current", "data", "description", "device_count", "name", "product_id", "size", "title", "version" FROM "temporary_product_firmware"',
    );
    await queryRunner.query('DROP TABLE "temporary_product_firmware"');
    await queryRunner.query('DROP INDEX "IDX_d90b4b8e84599eab31a0cbe7ba"');
    await queryRunner.query('DROP INDEX "IDX_0fe9ab029fd616083a984fd8aa"');
    await queryRunner.query('DROP TABLE "user_to_organization"');
    await queryRunner.query('DROP TABLE "device_key_object"');
    await queryRunner.query('DROP TABLE "webhook"');
    await queryRunner.query('DROP TABLE "organization"');
    await queryRunner.query('DROP INDEX "IDX_8cfaf4a1e80806d58e3dbe6922"');
    await queryRunner.query('DROP INDEX "IDX_856d7e7672c2a22652daf70e1e"');
    await queryRunner.query('DROP INDEX "IDX_c2eedda8bf0194e1fb299ee742"');
    await queryRunner.query('DROP TABLE "product"');
    await queryRunner.query('DROP INDEX "IDX_2a658ea788ff3454f8d9abb342"');
    await queryRunner.query('DROP INDEX "IDX_70f03fb512e5804e4b3a233b15"');
    await queryRunner.query('DROP TABLE "product_device"');
    await queryRunner.query('DROP TABLE "device_attributes"');
    await queryRunner.query('DROP TABLE "product_firmware"');
    await queryRunner.query('DROP INDEX "IDX_271be22b8b9ff09e64da2b29e2"');
    await queryRunner.query('DROP INDEX "IDX_116e37d344e5c666adb0c98cce"');
    await queryRunner.query('DROP TABLE "product_config"');
    await queryRunner.query('DROP INDEX "IDX_d34106f8ec1ebaf66f4f8609dd"');
    await queryRunner.query('DROP TABLE "user"');
  }
}
