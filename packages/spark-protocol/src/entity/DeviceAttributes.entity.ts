import { Column, Entity, PrimaryColumn } from 'typeorm';

import { JSON_TRANSFORMER } from '../JSON_TRANSFORMER';
import { EntityBase } from './EntityBase';

export enum Platform {
  CORE = 0,
  GCC = 3,
  PHOTON = 6,
  P1 = 8,
  ELECTRON = 10,
  ESP32 = 11,
  ARGON = 12,
  BORON = 13,
  XENON = 14,
  ESOMX = 15,
  ASOM = 22,
  BSOM = 23,
  XSOM = 24,
  B5SOM = 25,
  TRACKER = 26,
  TRACKERM = 28,
  RASPI = 31,
  P2 = 32,
  MSOM = 35,
  OAK = 82,
  DUO = 88,
  BLUZ = 103,
}

@Entity()
export class DeviceAttributes extends EntityBase {
  @PrimaryColumn()
  deviceID!: string;

  @Column({ type: 'varchar', nullable: true })
  appHash!: string | null;

  @Column({ type: 'varchar', nullable: true })
  claimCode!: string | null;

  @Column({ type: 'int', nullable: true })
  currentBuildTarget!: number | null;

  @Column({ type: 'varchar', nullable: true })
  functions: Array<string> | null | undefined;

  @Column({ type: 'varchar', nullable: true })
  imei!: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip!: string | null;

  @Column({ default: false })
  isCellular!: boolean;

  @Column({ type: 'varchar', nullable: true })
  lastIccid: string | undefined;

  @Column({ type: 'varchar', nullable: true })
  lastFlashedAppName!: string | null;

  @Column({ type: Date, nullable: true })
  lastHeard!: Date | null;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'int', nullable: true })
  ownerID!: number | null;

  @Column({ default: 0 })
  particleProductId!: number;

  @Column({ type: 'int', default: Platform.CORE })
  platformId!: Platform;

  @Column({ default: 0 })
  productFirmwareVersion!: number;

  @Column({ type: 'varchar', nullable: true })
  registrar!: string | null;

  @Column({
    type: 'varchar',
    default: '{}',
    transformer: JSON_TRANSFORMER,
  })
  variables!: Record<string, string>;

  @Column({ type: 'int', nullable: true })
  reservedFlags!: number | null;

  @Column({ default: false })
  isConnected!: boolean;
}
