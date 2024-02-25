import { ProductConfig } from '@brewskey/spark-protocol';
import { RepositoryBase } from '@brewskey/spark-protocol';
import { Repository } from 'typeorm';

type MutateProductConfigDTO = Omit<
  ProductConfig,
  'createdAt' | 'updatedAt' | 'organization'
>;
class ProductConfigRepository extends RepositoryBase<
  ProductConfig,
  MutateProductConfigDTO
> {
  constructor(repository: Repository<ProductConfig>) {
    super(ProductConfig, repository);
  }

  findByProductIDOrFail(productID: number): Promise<ProductConfig> {
    return this.repository.findOneByOrFail({ productID });
  }

  updateByID(): Promise<ProductConfig> {
    throw new Error('The method is not implemented');
  }
}

export default ProductConfigRepository;
