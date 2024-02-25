import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EntityBase } from './EntityBase';
import { Product } from './Product.entity';
import { User } from './User.entity';
import { Webhook } from './Webhook.entity';

@Entity()
export class Organization extends EntityBase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToMany(() => User, (user) => user.organizations)
  @JoinTable({ name: 'user_to_organization' })
  users!: User[] | null;

  @OneToMany(() => Product, (product) => product.organization, {
    nullable: true,
  })
  products!: Product[] | null;

  @OneToMany(() => Webhook, (webhook) => webhook.organization, {
    nullable: true,
  })
  webhooks!: Webhook[] | null;
}
