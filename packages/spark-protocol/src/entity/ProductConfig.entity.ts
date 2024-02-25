import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EntityBase } from './EntityBase';
import { Organization } from './Organization.entity';
import { Product } from './Product.entity';

@Entity()
export class ProductConfig extends EntityBase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  @Index()
  organizationID!: number | null;

  @ManyToOne(() => Organization, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  organization!: Organization | null;

  @Column()
  @Index()
  productID!: number;

  @OneToOne(() => Product)
  product!: Product | null;
}
