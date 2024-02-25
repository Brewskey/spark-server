import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

import { EntityBase } from '../entity/EntityBase';
import { objectAssign } from '../objectAssign';

export abstract class RepositoryBase<
  TEntity extends EntityBase,
  TMutator extends Omit<Partial<TEntity>, 'createdAt' | 'updatedAt'>,
  TKey extends string | number = number,
> {
  private primaryKey: string;

  constructor(
    private readonly Clazz: { new (): TEntity },
    protected readonly repository: Repository<TEntity>,
  ) {
    this.primaryKey = this.repository.metadata.primaryColumns[0].propertyName;
  }

  find(options?: FindManyOptions<TEntity> | undefined): Promise<TEntity[]> {
    return this.repository.find(options);
  }

  findOneByID(id: TKey): Promise<TEntity | null> {
    return this.repository.findOneBy({
      [this.primaryKey]: id,
    } as FindOptionsWhere<TEntity>);
  }

  findOneByIDOrFail(id: TKey): Promise<TEntity> {
    return this.repository.findOneByOrFail({
      [this.primaryKey]: id,
    } as FindOptionsWhere<TEntity>);
  }

  count(options?: FindManyOptions<TEntity> | undefined): Promise<number> {
    return this.repository.count(options);
  }

  create(mutator: Omit<TMutator, 'id'>): Promise<TEntity> {
    return this.repository.save(
      objectAssign(new this.Clazz(), mutator as unknown as Partial<TEntity>),
    );
  }

  async updateByID(id: TKey, mutator: TMutator): Promise<TEntity> {
    const entity = await this.findOneByIDOrFail(id);
    return this.repository.save<TEntity>(
      objectAssign<TEntity>(entity, mutator as unknown as Partial<TEntity>),
    );
  }

  async deleteByID(id: TKey): Promise<void> {
    const entity = await this.findOneByIDOrFail(id);
    await this.repository.remove(entity);
  }
}
