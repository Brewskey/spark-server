import type DeviceManager from '../managers/DeviceManager';
import type { IProductRepository } from '../types';
import Controller from './Controller';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import {
  IProductDeviceRepository,
  IProductFirmwareRepository,
  ProductFirmware,
} from 'spark-protocol';
import { HttpResult } from './types';

type APIProductFirmware = Omit<ProductFirmware, 'data'> & {
  device_count: number;
};

class ProductFirmwaresControllerV2 extends Controller {
  _deviceManager: DeviceManager;

  _productDeviceRepository: IProductDeviceRepository;

  _productFirmwareRepository: IProductFirmwareRepository;

  _productRepository: IProductRepository;

  constructor(
    deviceManager: DeviceManager,
    productDeviceRepository: IProductDeviceRepository,
    productFirmwareRepository: IProductFirmwareRepository,
    productRepository: IProductRepository,
  ) {
    super();

    this._deviceManager = deviceManager;
    this._productDeviceRepository = productDeviceRepository;
    this._productFirmwareRepository = productFirmwareRepository;
    this._productRepository = productRepository;
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/firmwares/count')
  async countFirmwares(productIDOrSlug: string): Promise<HttpResult<number>> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);

    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const count = await this._productFirmwareRepository.countByProductID(
      product.product_id,
    );

    return this.ok(count);
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/firmwares')
  async getFirmwares(
    productIDOrSlug: string,
  ): Promise<HttpResult<APIProductFirmware[]>> {
    const { skip, take } = this.request.query;
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad('Product does not exist', 404);
    }

    const firmwares = await this._productFirmwareRepository.getManyByProductID(
      product.product_id,
      { skip, take },
    );

    const mappedFirmware = await Promise.all(
      firmwares.map(async ({ data: _, ...firmware }) => {
        const deviceCount =
          await this._productDeviceRepository.countByProductID(
            product.product_id,
            {
              productFirmwareVersion: firmware.version,
            },
          );
        return {
          ...firmware,
          device_count: deviceCount,
        };
      }),
    );

    return this.ok(mappedFirmware);
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/firmwares/:firmwareID')
  async getFirmware(
    productIDOrSlug: string,
    firmwareID: string,
  ): Promise<HttpResult<APIProductFirmware>> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const firmware = await this._productFirmwareRepository.getByID(firmwareID);

    if (!firmware) {
      return this.bad(`Firmware ${firmwareID} doesn't exist.`);
    }

    const deviceCount = await this._productDeviceRepository.countByProductID(
      product.product_id,
      {
        productFirmwareVersion: firmware.version,
      },
    );

    const { data: _, ...restFirmware } = firmware;
    return this.ok({
      ...restFirmware,
      device_count: deviceCount,
    });
  }
}

export default ProductFirmwaresControllerV2;
