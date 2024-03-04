import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EntityBase } from './EntityBase';
import { Product } from './Product.entity';

@Entity()
export class ProductDevice extends EntityBase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  isDenied!: boolean;

  @Column()
  isDevelopment!: boolean;

  @Column()
  @Index()
  deviceID!: string;

  @Column({ type: 'int', nullable: true })
  lockedFirmwareVersion!: number | null;

  @Column()
  notes!: string;

  @Column()
  @Index()
  productID!: number;

  @ManyToOne(() => Product, (product) => product.productDevices)
  product!: Product | null;

  @Column()
  isQuarantined!: boolean;

  @Column({ type: 'int', nullable: true })
  productFirmwareVersion!: number | null;
}
