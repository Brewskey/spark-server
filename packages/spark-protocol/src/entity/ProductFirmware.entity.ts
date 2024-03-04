import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { EntityBase } from './EntityBase';
import { Product } from './Product.entity';

@Entity()
export class ProductFirmware extends EntityBase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  isCurrent!: boolean;

  @Column()
  data!: Buffer;

  @Column()
  description!: string;

  @Column()
  deviceCount!: number;

  @Column()
  name!: string;

  @Column()
  productID!: number;

  @ManyToOne(() => Product, (product) => product.productFirmwares)
  product!: Product | null;

  @Column()
  size!: number;

  @Column()
  title!: string;

  @Column()
  version!: number;
}
