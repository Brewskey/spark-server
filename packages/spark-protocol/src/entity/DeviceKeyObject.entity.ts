import { Column, Entity, PrimaryColumn } from 'typeorm';

import { EntityBase } from './EntityBase';

export enum DeviceKeyAlgorithm {
  ECC = 'ecc',
  RSA = 'rsa',
}

@Entity()
export class DeviceKeyObject extends EntityBase {
  @PrimaryColumn()
  deviceID!: string;

  @Column({ type: 'varchar' })
  algorithm!: DeviceKeyAlgorithm;

  @Column()
  key!: Buffer;
}
