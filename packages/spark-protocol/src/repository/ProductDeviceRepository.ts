import { Repository } from 'typeorm';

import { ProductDevice } from '../entity/ProductDevice.entity';
import { RepositoryBase } from './RepositoryBase';

type MutateProductDeviceDTO = Omit<
  ProductDevice,
  'createdAt' | 'updatedAt' | 'product'
>;

export class ProductDeviceRepository extends RepositoryBase<
  ProductDevice,
  MutateProductDeviceDTO
> {
  constructor(repository: Repository<ProductDevice>) {
    super(ProductDevice, repository);
  }

  async getFromDeviceID(deviceID: string): Promise<ProductDevice> {
    return this.repository.findOneByOrFail({ deviceID });
  }

  async deleteByProductID(productID: number): Promise<void> {
    const entities = await this.repository.findBy({ productID });
    await this.repository.remove(entities);
  }
}
