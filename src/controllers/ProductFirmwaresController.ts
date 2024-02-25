import {
  ProductDeviceRepository,
  ProductFirmware,
  ProductFirmwareRepository,
} from '@brewskey/spark-protocol';
import { HalModuleParser } from 'binary-version-reader';
import nullthrows from 'nullthrows';

import allowUpload from '../decorators/allowUpload';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import type DeviceManager from '../managers/DeviceManager';
import { ProductRepository } from '../repository/ProductRepository';
import Controller from './Controller';
import { HttpResult } from './types';

type ProductFirmwareUpload = {
  current: boolean;
  description: string;
  binary: Express.Multer.File;
  title: string;
  version: number;
};

type ProductFirmwareAPIResult = Omit<
  ProductFirmware,
  'data' | 'deviceCount'
> & {
  device_count: number;
};

const MISSING_FIELDS = ['binary', 'description', 'title', 'version'] as const;

class ProductFirmwaresController extends Controller {
  constructor(
    private readonly deviceManager: DeviceManager,
    private readonly productDeviceRepository: ProductDeviceRepository,
    private readonly productFirmwareRepository: ProductFirmwareRepository,
    private readonly productRepository: ProductRepository,
  ) {
    super();
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug/firmware')
  async getFirmwares(
    productIDOrSlug: string,
  ): Promise<HttpResult<ProductFirmwareAPIResult[]>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const firmwares = await this.productFirmwareRepository.find({
      where: { productID: product.id },
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

    // eslint-disable-next-line no-unused-vars
    return this.ok(mappedFirmware);
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug/firmware/:version')
  async getSingleFirmware(
    productIDOrSlug: string,
    version: string,
  ): Promise<HttpResult<ProductFirmwareAPIResult>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const firmwareList = await this.productFirmwareRepository.find({
      where: { productID: product.id },
    });

    const existingFirmware = firmwareList.find(
      (firmware: ProductFirmware): boolean =>
        firmware.version === parseInt(version, 10),
    );
    if (!existingFirmware) {
      return this.bad(`Firmware version ${version} does not exist`);
    }

    const deviceCount = await this.productDeviceRepository.count({
      where: {
        productID: product.id,
        productFirmwareVersion: existingFirmware.version,
      },
    });

    const { data: _, ...output } = existingFirmware;
    return this.ok({
      ...output,
      device_count: deviceCount,
    });
  }

  @httpVerb('post')
  @route('/v1/products/:productIDOrSlug/firmware')
  @allowUpload('binary', 1)
  async addFirmware(
    productIDOrSlug: string,
    body: ProductFirmwareUpload,
  ): Promise<HttpResult<ProductFirmwareAPIResult>> {
    const missingFields = MISSING_FIELDS.filter((key): boolean => !body[key]);
    if (missingFields.length) {
      return this.bad(`Missing fields: ${missingFields.join(', ')}`);
    }

    // eslint-disable-next-line no-param-reassign
    body.current = this._stringToBoolean(body.current);

    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);

    const parser = new HalModuleParser();
    const moduleInfo = await parser.parseBuffer({
      fileBuffer: body.binary.buffer,
    });

    if (!moduleInfo.crc.ok) {
      return this.bad('Invalid CRC. Try recompiling the firmware');
    }

    const firmwarePlatformID = moduleInfo.prefixInfo.platformID;
    if (firmwarePlatformID !== product.platformID) {
      return this.bad(
        `Firmware had incorrect platform ID ${firmwarePlatformID}. Expected ${product.platformID} `,
      );
    }

    const { productId, productVersion } = moduleInfo.suffixInfo;
    if (productId !== product.id) {
      return this.bad(
        `Firmware had incorrect product ID ${productId}. Expected  ${product.id}`,
      );
    }

    const version = parseInt(body.version.toString(), 10);
    if (productVersion !== version) {
      return this.bad(
        `Firmware had incorrect product version ${productVersion}. Expected ${product.id}`,
      );
    }

    const firmwareList = await this.productFirmwareRepository.find({
      where: { productID: product.id },
    });
    const maxExistingFirmwareVersion = Math.max(
      ...firmwareList.map((firmware: ProductFirmware): number =>
        parseInt(firmware.version.toString(), 10),
      ),
    );

    if (version <= maxExistingFirmwareVersion) {
      return this.bad(
        `version must be greater than ${maxExistingFirmwareVersion}`,
      );
    }

    if (body.current) {
      await this._findAndUnreleaseCurrentFirmware(firmwareList);
    }

    const firmware = await this.productFirmwareRepository.create({
      isCurrent: body.current,
      data: body.binary.buffer,
      description: body.description,
      deviceCount: 0,
      name: body.binary.originalname,
      productID: product.id,
      size: body.binary.size,
      title: body.title,
    });

    if (body.current) {
      this.deviceManager.flashProductFirmware(product.id);
    }

    const { data: _, deviceCount, ...output } = firmware;
    return this.ok({
      ...output,
      device_count: deviceCount,
    });
  }

  @httpVerb('put')
  @route('/v1/products/:productIDOrSlug/firmware/:version')
  async updateFirmware(
    productIDOrSlug: string,
    version: string,
    body: Partial<Omit<ProductFirmware, 'isCurrent'> & { current?: boolean }>,
  ): Promise<HttpResult<ProductFirmwareAPIResult>> {
    const { current, description, title } = body;
    // eslint-disable-next-line no-param-reassign
    body = {
      current: this._stringToBoolean(nullthrows(current)),
      description,
      title,
    };
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const firmwareList = await this.productFirmwareRepository.find({
      where: { productID: product.id },
    });

    const existingFirmware = firmwareList.find(
      (firmware: ProductFirmware): boolean =>
        firmware.version === parseInt(version, 10),
    );
    if (!existingFirmware) {
      return this.bad(`Firmware version ${version} does not exist`);
    }

    if (body.current) {
      await this._findAndUnreleaseCurrentFirmware(firmwareList);
    }

    const firmware = await this.productFirmwareRepository.updateByID(
      existingFirmware.id,
      {
        ...existingFirmware,
        ...body,
      },
    );

    const { data: _, deviceCount, ...output } = firmware;

    if (current) {
      this.deviceManager.flashProductFirmware(product.id);
    }
    return this.ok({ ...output, device_count: deviceCount });
  }

  @httpVerb('delete')
  @route('/v1/products/:productIDOrSlug/firmware/:version')
  async deleteFirmware(
    productIDOrSlug: string,
    version: string,
  ): Promise<HttpResult<Record<never, never>>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const firmwareList = await this.productFirmwareRepository.find({
      where: { productID: product.id },
    });

    const existingFirmware = firmwareList.find(
      (firmware: ProductFirmware): boolean =>
        firmware.version === parseInt(version, 10),
    );
    if (!existingFirmware) {
      return this.bad(`Firmware version ${version} does not exist`);
    }

    await this.productFirmwareRepository.deleteByID(existingFirmware.id);

    return this.ok();
  }

  _findAndUnreleaseCurrentFirmware(
    productFirmwareList: Array<ProductFirmware>,
  ): Promise<ProductFirmware[]> {
    return Promise.all(
      productFirmwareList
        .filter(
          (firmware: ProductFirmware): boolean => firmware.isCurrent === true,
        )
        .map(
          (releasedFirmware: ProductFirmware): Promise<ProductFirmware> =>
            this.productFirmwareRepository.updateByID(releasedFirmware.id, {
              ...releasedFirmware,
              isCurrent: false,
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

export default ProductFirmwaresController;
