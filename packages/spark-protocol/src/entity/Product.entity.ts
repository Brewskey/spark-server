import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Platform } from './DeviceAttributes.entity';
import { EntityBase } from './EntityBase';
import { Organization } from './Organization.entity';
import { ProductConfig } from './ProductConfig.entity';
import { ProductDevice } from './ProductDevice.entity';
import { ProductFirmware } from './ProductFirmware.entity';

export enum ProductType {
  Consumer,
  Hobbyist,
  Industrial,
}

@Entity()
export class Product extends EntityBase {
  @PrimaryGeneratedColumn()
  id!: number; // This should always be swapped out with product_id when sent to the client,

  @Column()
  productConfigID!: number;

  @OneToOne(() => ProductConfig)
  productConfig!: ProductConfig | null;

  @Column({ default: '' })
  description!: string;

  @Column({ default: '' })
  hardwareVersion!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  @Index()
  organizationID!: number | null;

  @ManyToOne(() => Organization, (organization) => organization.products, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  organization!: Organization | null;

  @Column({ type: 'int' })
  platformID!: Platform;

  @Column()
  @Index()
  slug!: string;

  @Column({ type: 'varchar' })
  type!: ProductType;

  @OneToMany(
    () => ProductFirmware,
    (productFirmware) => productFirmware.product,
  )
  productFirmwares!: ProductFirmware[] | null;

  @OneToMany(() => ProductDevice, (productDevice) => productDevice.product)
  productDevices!: ProductDevice[] | null;
}
