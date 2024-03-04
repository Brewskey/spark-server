import {
  DeviceAttributeRepository,
  objectAssign,
  Platform,
  Product,
  ProductConfig,
  ProductDeviceRepository,
  ProductType,
} from '@brewskey/spark-protocol';
import { In } from 'typeorm';

import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import formatDeviceAttributesToApi, { DeviceAPIType } from '../lib/deviceToAPI';
import { ProductRepository } from '../repository/ProductRepository';
import Controller from './Controller';
import { HttpResult } from './types';

const MISSING_FIELDS = [
  'description',
  'hardware_version',
  'name',
  'org',
  'platform_id',
  'type',
] as const;

const PUT_MISSING_FIELDS = [
  'config_id',
  'description',
  'hardware_version',
  'id',
  'name',
  'org',
  'platform_id',
  'type',
] as const;

type MutateProductDTO = {
  description: string;
  hardware_version: string;
  name: string;
  platform_id: Platform;
  type: ProductType;
  org: number | null;
  config_id?: number | null;
};

class ProductsControllerV2 extends Controller {
  constructor(
    private readonly deviceAttributeRepository: DeviceAttributeRepository,
    private readonly productRepository: ProductRepository,
    private readonly productDeviceRepository: ProductDeviceRepository,
  ) {
    super();
  }

  @httpVerb('get')
  @route('/v2/products/count')
  async countProducts(): Promise<HttpResult<number>> {
    const count = await this.productRepository.count();
    return this.ok(count);
  }

  @httpVerb('get')
  @route('/v2/products')
  async getProducts(): Promise<HttpResult<Product[]>> {
    const { skip, take } = this.request.query;
    const products = await this.productRepository.find({
      skip: Number.isFinite(skip) ? Number(skip) : undefined,
      take: Number.isFinite(take) ? Number(take) : undefined,
    });
    return this.ok(products);
  }

  @httpVerb('post')
  @route('/v2/products')
  async createProduct(
    productModel: MutateProductDTO,
  ): Promise<HttpResult<Product>> {
    if (!productModel) {
      return this.bad('You must provide a product');
    }

    const missingFields = MISSING_FIELDS.filter(
      (key) => !productModel[key] && productModel[key] !== 0,
    );
    if (missingFields.length) {
      return this.bad(`Missing fields: ${missingFields.join(', ')}`);
    }

    const product = await this.productRepository.create({
      ...productModel,
      productConfig: objectAssign(new ProductConfig(), {
        organizationID: productModel.org ?? null,
      }),
      organizationID: productModel.org ?? null,
      platformID: productModel.platform_id,
      hardwareVersion: productModel.hardware_version,
    });

    return this.ok(product);
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug')
  async getProduct(productIDOrSlug: string): Promise<HttpResult<Product>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);

    return this.ok(product);
  }

  @httpVerb('put')
  @route('/v2/products/:productIDOrSlug')
  async updateProduct(
    productIDOrSlug: string,
    productModel: MutateProductDTO & { id: number },
  ): Promise<HttpResult<Product>> {
    if (!productModel) {
      return this.bad('You must provide a product');
    }

    const missingFields = PUT_MISSING_FIELDS.filter(
      (key) => !productModel[key] && productModel[key] !== 0,
    );
    if (missingFields.length) {
      return this.bad(`Missing fields: ${missingFields.join(', ')}`);
    }

    let product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    product = await this.productRepository.updateByID(product.id, {
      ...product,
      ...productModel,
    });

    return this.ok(product);
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/devices/count')
  async countDevices(productIDOrSlug: string): Promise<HttpResult<number>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);

    const count = await this.productDeviceRepository.count({
      where: { productID: product.id },
    });

    return this.ok(count);
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/devices')
  async getDevices(
    productIDOrSlug: string,
  ): Promise<HttpResult<DeviceAPIType[]>> {
    const { skip, take } = this.request.query;
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const productDevices = await this.productDeviceRepository.find({
      select: { deviceID: true },
      where: { productID: product.id },
      skip: Number.isFinite(skip) ? Number(skip) : undefined,
      take: Number.isFinite(take) ? Number(take) : undefined,
    });

    const deviceIDs = productDevices.map(
      (productDevice) => productDevice.deviceID,
    );

    const deviceAttributesList = await this.deviceAttributeRepository.find({
      where: { deviceID: In(deviceIDs) },
    });

    const devices = productDevices.map(({ deviceID, ...other }) => {
      const deviceAttributes = deviceAttributesList.find(
        (item) => deviceID === item.deviceID,
      );
      return {
        ...formatDeviceAttributesToApi(deviceAttributes),
        ...other,
        id: deviceID,
        product_id: product.id,
      };
    });

    return this.ok(devices);
  }
}

export default ProductsControllerV2;
