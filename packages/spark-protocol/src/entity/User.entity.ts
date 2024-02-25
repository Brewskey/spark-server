import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { JSON_TRANSFORMER } from '../JSON_TRANSFORMER';
import { EntityBase } from './EntityBase';
import { Organization } from './Organization.entity';

export enum UserRole {
  Administrator = 'administrator',
  Default = 'default',
}

export type TokenObject = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
  scope?: string;
};

@Entity()
export class User extends EntityBase {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToMany(() => Organization, (organization) => organization.users)
  organizations!: Organization[] | null;

  @Column({
    type: 'varchar',
    transformer: JSON_TRANSFORMER,
    default: '[]',
  })
  accessTokens!: Array<TokenObject>;

  @Column()
  passwordHash!: string;

  @Column({ type: 'varchar', default: UserRole.Default })
  role!: UserRole;

  @Column()
  salt!: string;

  @Column({ unique: true })
  @Index()
  userName!: string;
}
