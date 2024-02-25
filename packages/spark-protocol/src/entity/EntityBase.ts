import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class EntityBase {
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
