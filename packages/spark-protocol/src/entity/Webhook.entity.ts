import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { JSON_TRANSFORMER } from '../JSON_TRANSFORMER';
import { EntityBase } from './EntityBase';
import { Organization } from './Organization.entity';

@Entity()
export class Webhook extends EntityBase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: JSON_TRANSFORMER,
  })
  auth!: {
    password: string;
    username: string;
  } | null;

  @Column({ type: 'varchar', nullable: true })
  deviceID!: string | null;

  @Column({ type: 'varchar', nullable: true })
  errorResponseTopic!: string | null;

  @Column()
  event!: string;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: JSON_TRANSFORMER,
  })
  form!: Record<string, unknown> | null;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: JSON_TRANSFORMER,
  })
  headers!: {
    [key: string]: string;
  } | null;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: JSON_TRANSFORMER,
  })
  json!: Record<string, unknown> | null;

  @Column({ default: false })
  isFromMyDevices!: boolean;

  @Column({ default: false })
  hasNoDefaults!: boolean;

  @Column()
  ownerID!: number;

  @Column({ nullable: true })
  organizationID!: number | null;

  @ManyToOne(() => Organization, (orgainzation) => orgainzation.webhooks, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  organization!: Organization | null;

  @Column({ type: 'varchar', nullable: true })
  productIdOrSlug!: string | number | null;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: JSON_TRANSFORMER,
  })
  query!: Record<string, unknown> | null;

  @Column({ default: false })
  shouldRejectUnauthorized!: boolean;

  @Column()
  requestType!: string;

  @Column({ type: 'varchar', nullable: true })
  responseTemplate!: string | null;

  @Column({ type: 'varchar', nullable: true })
  responseTopic!: string | null;

  @Column()
  url!: string;
}
