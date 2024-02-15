/* eslint-disable */

import type DeviceManager from '../managers/DeviceManager';
import type {
  IOrganizationRepository,
  IProductConfigRepository,
  IProductRepository,
  Product,
} from '../types';

import Controller from './Controller';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import formatDeviceAttributesToApi from '../lib/deviceToAPI';
import {
  IDeviceAttributeRepository,
  IProductDeviceRepository,
  IProductFirmwareRepository,
  ProductFirmware,
} from 'spark-protocol';

const MISSING_FIELDS = [
  'description',
  'hardware_version',
  'name',
  'platform_id',
  'type',
] as const;

const PUT_MISSING_FIELDS = [
  'config_id',
  'description',
  'hardware_version',
  'id',
  'name',
  'organization',
  'platform_id',
  'type',
] as const;

class ProductsControllerV2 extends Controller {
  _deviceAttributeRepository: IDeviceAttributeRepository;
  _deviceManager: DeviceManager;
  _organizationRepository: IOrganizationRepository;
  _productConfigRepository: IProductConfigRepository;
  _productDeviceRepository: IProductDeviceRepository;
  _productFirmwareRepository: IProductFirmwareRepository;
  _productRepository: IProductRepository;

  constructor(
    deviceManager: DeviceManager,
    deviceAttributeRepository: IDeviceAttributeRepository,
    organizationRepository: IOrganizationRepository,
    productRepository: IProductRepository,
    productConfigRepository: IProductConfigRepository,
    productDeviceRepository: IProductDeviceRepository,
    productFirmwareRepository: IProductFirmwareRepository,
  ) {
    super();

    this._deviceManager = deviceManager;
    this._deviceAttributeRepository = deviceAttributeRepository;
    this._organizationRepository = organizationRepository;
    this._productConfigRepository = productConfigRepository;
    this._productDeviceRepository = productDeviceRepository;
    this._productFirmwareRepository = productFirmwareRepository;
    this._productRepository = productRepository;
  }

  @httpVerb('get')
  @route('/v2/products/count')
  async countProducts(): Promise<any> {
    const count = await this._productRepository.count();
    return this.ok(count);
  }

  @httpVerb('get')
  @route('/v2/products')
  async getProducts(): Promise<any> {
    const { skip, take } = this.request.query;
    const products = await this._productRepository.getMany(null, {
      skip,
      take,
    });
    return this.ok(products.map((product) => this._formatProduct(product)));
  }

  @httpVerb('post')
  @route('/v2/products')
  async createProduct(productModel: Partial<Product>): Promise<any> {
    if (!productModel) {
      return this.bad('You must provide a product');
    }

    const missingFields = MISSING_FIELDS.filter(
      (key) => !productModel[key] && productModel[key] !== 0,
    );
    if (missingFields.length) {
      return this.bad(`Missing fields: ${missingFields.join(', ')}`);
    }

    const organizations = await this._organizationRepository.getByUserID(
      this.user.id,
    );
    if (!organizations.length) {
      return this.bad("You don't have access to any organizations");
    }

    const organizationID = organizations[0].id;
    productModel.organization = organizationID;
    const product = await this._productRepository.create(productModel);
    const config = await this._productConfigRepository.create({
      org_id: organizationID,
      product_id: product.id,
    });
    product.config_id = config.id;
    await this._productRepository.updateByID(product.id, product);

    return this.ok(this._formatProduct(product));
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug')
  async getProduct(productIDOrSlug: string): Promise<any> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad('Product does not exist', 404);
    }

    return this.ok(this._formatProduct(product));
  }

  @httpVerb('put')
  @route('/v2/products/:productIDOrSlug')
  async updateProduct(
    productIDOrSlug: string,
    productModel: Partial<Product>,
  ): Promise<any> {
    if (!productModel) {
      return this.bad('You must provide a product');
    }

    const missingFields = PUT_MISSING_FIELDS.filter(
      (key) => !productModel[key] && productModel[key] !== 0,
    );
    if (missingFields.length) {
      return this.bad(`Missing fields: ${missingFields.join(', ')}`);
    }

    let product = await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`Product ${productIDOrSlug} doesn't exist`);
    }
    product = await this._productRepository.updateByID(product.id, {
      ...product,
      ...productModel,
    });

    return this.ok(this._formatProduct(product));
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/devices/count')
  async countDevices(productIDOrSlug: string): Promise<any> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);

    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const count = await this._productDeviceRepository.countByProductID(
      product.product_id,
    );

    return this.ok(count);
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/devices')
  async getDevices(productIDOrSlug: string): Promise<any> {
    const { skip, take } = this.request.query;
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const productDevices =
      await this._productDeviceRepository.getManyByProductID(
        product.product_id,
        { skip, take },
      );

    const deviceIDs = productDevices.map(
      (productDevice) => productDevice.deviceID,
    );

    const deviceAttributesList =
      await this._deviceAttributeRepository.getManyFromIDs(deviceIDs);

    const devices = productDevices.map(({ deviceID, ...other }) => {
      const deviceAttributes = deviceAttributesList.find(
        (item) => deviceID === item.deviceID,
      );
      return {
        ...formatDeviceAttributesToApi(deviceAttributes),
        ...other,
        id: deviceID,
        product_id: product.product_id,
      };
    });

    return this.ok(devices);
  }

  _formatProduct(product: Product): Partial<Product> {
    const { product_id, ...output } = product;
    output.id = product_id;
    return output;
  }

  _findAndUnreleaseCurrentFirmware(
    productFirmwareList: Array<ProductFirmware>,
  ): Promise<any> {
    return Promise.all(
      productFirmwareList
        .filter(
          (firmware: ProductFirmware): boolean => firmware.current === true,
        )
        .map(
          (releasedFirmware: ProductFirmware): Promise<ProductFirmware> =>
            this._productFirmwareRepository.updateByID(releasedFirmware.id, {
              ...releasedFirmware,
              current: false,
            }),
        ),
    );
  }

  _stringToBoolean(input: string | boolean): boolean {
    if (input === true || input === false) {
      return input;
    }

    switch (input.toLowerCase().trim()) {
      case 'true':
      case 'yes':
      case '1':
        return true;
      case 'false':
      case 'no':
      case '0':
      case null:
        return false;
      default:
        return Boolean(input);
    }
  }
}

export default ProductsControllerV2;
/* eslint-enable */
