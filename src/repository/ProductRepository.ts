import { filterFalsyValues, Product } from '@brewskey/spark-protocol';
import { RepositoryBase } from '@brewskey/spark-protocol';
import { Repository } from 'typeorm';

type MutateProductDTO = Omit<
  Product,
  | 'createdAt'
  | 'updatedAt'
  | 'organization'
  | 'slug'
  | 'productConfigID'
  | 'latestFirmwareVersion'
  | 'productFirmwares'
  | 'productDevices'
> & { productConfigID?: number };

export class ProductRepository extends RepositoryBase<
  Product,
  MutateProductDTO & { slug: string }
> {
  constructor(repository: Repository<Product>) {
    super(Product, repository);
  }

  findByIDOrSlugOrFail(productIDOrSlug: string | number): Promise<Product> {
    return this.repository.findOneByOrFail(
      [
        !Number.isNaN(productIDOrSlug)
          ? {
              productID: Number(productIDOrSlug),
            }
          : null,
        { slug: productIDOrSlug.toString() },
      ].filter(filterFalsyValues),
    );
  }

  async create(model: Omit<MutateProductDTO, 'id'>): Promise<Product> {
    return super.create({
      ...model,
      slug: await this._getSlug(model),
    });
  }

  async updateByID(id: number, model: MutateProductDTO): Promise<Product> {
    return super.updateByID(id, {
      ...model,
      slug: await this._getSlug(model),
    });
  }

  _getSlug = async (
    product: Omit<MutateProductDTO, 'id'> & { id?: number | undefined },
  ): Promise<string> => {
    const slug = `${product.name?.trim()}}`
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text

    const existingProduct = await this.repository.findOneBy({ slug });

    if (existingProduct && existingProduct.id !== product.id) {
      throw new Error('Product name or version already in use');
    }

    return slug;
  };
}
