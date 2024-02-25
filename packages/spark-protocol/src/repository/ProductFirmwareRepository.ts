import { FindOneOptions, Repository } from 'typeorm';

import { ProductFirmware } from '../entity/ProductFirmware.entity';
import { RepositoryBase } from './RepositoryBase';

type MutateProductFirmwareDTO = Omit<
  ProductFirmware,
  'id' | 'version' | 'createdAt' | 'updatedAt' | 'product'
>;

export class ProductFirmwareRepository extends RepositoryBase<
  ProductFirmware,
  MutateProductFirmwareDTO
> {
  constructor(repository: Repository<ProductFirmware>) {
    super(ProductFirmware, repository);
  }

  async findOne(
    options: FindOneOptions<ProductFirmware>,
  ): Promise<ProductFirmware | null> {
    return this.repository.findOne(options);
  }

  async deleteByProductID(productID: number): Promise<void> {
    const entities = await this.repository.findBy({ productID });
    await this.repository.remove(entities);
  }
}
