import {
  ProductDeviceRepository,
  ProductFirmware,
  ProductFirmwareRepository,
} from '@brewskey/spark-protocol';

import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import type DeviceManager from '../managers/DeviceManager';
import { ProductRepository } from '../repository/ProductRepository';
import Controller from './Controller';
import { HttpResult } from './types';

type APIProductFirmware = Omit<ProductFirmware, 'data'> & {
  device_count: number;
};

class ProductFirmwaresControllerV2 extends Controller {
  constructor(
    private readonly deviceManager: DeviceManager,
    private readonly productDeviceRepository: ProductDeviceRepository,
    private readonly productFirmwareRepository: ProductFirmwareRepository,
    private readonly productRepository: ProductRepository,
  ) {
    super();
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/firmwares/count')
  async countFirmwares(productIDOrSlug: string): Promise<HttpResult<number>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);

    const count = await this.productFirmwareRepository.count({
      where: { productID: product.id },
    });

    return this.ok(count);
  }

  @httpVerb('get')
  @route('/v2/products/:productIDOrSlug/firmwares')
  async getFirmwares(
    productIDOrSlug: string,
  ): Promise<HttpResult<APIProductFirmware[]>> {
    const { skip, take } = this.request.query;
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const firmwares = await this.productFirmwareRepository.find({
      where: { productID: product.id },
      skip: Number.isFinite(skip) ? Number(skip) : undefined,
      take: Number.isFinite(take) ? Number(take) : undefined,
    });

    const mappedFirmware = await Promise.all(
      firmwares.map(async ({ data: _, ...firmware }) => {
        const deviceCount = await this.productDeviceRepository.count({
          where: {
            productID: product.id,
            productFirmwareVersion: firmware.version,
          },
        });
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
    firmwareID: number,
  ): Promise<HttpResult<APIProductFirmware>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);

    const firmware =
      await this.productFirmwareRepository.findOneByIDOrFail(firmwareID);

    const deviceCount = await this.productDeviceRepository.count({
      where: {
        productID: product.id,
        productFirmwareVersion: firmware.version,
      },
    });

    const { data: _, ...restFirmware } = firmware;
    return this.ok({
      ...restFirmware,
      device_count: deviceCount,
    });
  }
}

export default ProductFirmwaresControllerV2;
