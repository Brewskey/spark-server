import { HalModuleParser } from 'binary-version-reader';
import type DeviceManager from '../managers/DeviceManager';
import type { IProductRepository } from '../types';
import Controller from './Controller';
import httpVerb from '../decorators/httpVerb';
import allowUpload from '../decorators/allowUpload';
import route from '../decorators/route';
import { HttpResult } from './types';
import nullthrows from 'nullthrows';
import {
  ProductFirmware,
  IProductDeviceRepository,
  IProductFirmwareRepository,
} from '@brewskey/spark-protocol';

type ProductFirmwareUpload = {
  current: boolean;
  description: string;
  binary: Express.Multer.File;
  title: string;
  version: number;
};

type ProductFirmwareAPIResult = Omit<ProductFirmware, 'data'> & {
  device_count: number;
};

const MISSING_FIELDS = ['binary', 'description', 'title', 'version'] as const;

class ProductFirmwaresController extends Controller {
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
  @route('/v1/products/:productIDOrSlug/firmware')
  async getFirmwares(
    productIDOrSlug: string,
  ): Promise<HttpResult<ProductFirmwareAPIResult[]>> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad('Product does not exist', 404);
    }

    const firmwares = await this._productFirmwareRepository.getManyByProductID(
      product.product_id,
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
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }
    const firmwareList =
      await this._productFirmwareRepository.getManyByProductID(
        product.product_id,
      );

    const existingFirmware = firmwareList.find(
      (firmware: ProductFirmware): boolean =>
        firmware.version === parseInt(version, 10),
    );
    if (!existingFirmware) {
      return this.bad(`Firmware version ${version} does not exist`);
    }

    const deviceCount = await this._productDeviceRepository.countByProductID(
      product.product_id,
      {
        productFirmwareVersion: existingFirmware.version,
      },
    );

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
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const parser = new HalModuleParser();
    const moduleInfo = await parser.parseBuffer({
      fileBuffer: body.binary.buffer,
    });

    if (!moduleInfo.crc.ok) {
      return this.bad('Invalid CRC. Try recompiling the firmware');
    }

    const firmwarePlatformID = moduleInfo.prefixInfo.platformID;
    if (firmwarePlatformID !== product.platform_id) {
      return this.bad(
        `Firmware had incorrect platform ID ${firmwarePlatformID}. Expected ${product.platform_id} `,
      );
    }

    const { productId, productVersion } = moduleInfo.suffixInfo;
    if (productId !== parseInt(product.product_id.toString(), 10)) {
      return this.bad(
        `Firmware had incorrect product ID ${productId}. Expected  ${product.product_id}`,
      );
    }

    const version = parseInt(body.version.toString(), 10);
    if (productVersion !== version) {
      return this.bad(
        `Firmware had incorrect product version ${productVersion}. Expected ${product.product_id}`,
      );
    }

    const firmwareList =
      await this._productFirmwareRepository.getManyByProductID(
        product.product_id,
      );
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

    const firmware = await this._productFirmwareRepository.create({
      current: body.current,
      data: body.binary.buffer,
      description: body.description,
      device_count: 0,
      name: body.binary.originalname,
      product_id: product.product_id,
      size: body.binary.size,
      title: body.title,
      version,
    });

    if (body.current) {
      this._deviceManager.flashProductFirmware(product.product_id);
    }

    const { data: _, ...output } = firmware;
    return this.ok(output);
  }

  @httpVerb('put')
  @route('/v1/products/:productIDOrSlug/firmware/:version')
  async updateFirmware(
    productIDOrSlug: string,
    version: string,
    body: Partial<ProductFirmware>,
  ): Promise<HttpResult<ProductFirmwareAPIResult>> {
    const { current, description, title } = body;
    // eslint-disable-next-line no-param-reassign
    body = {
      current: this._stringToBoolean(nullthrows(current)),
      description,
      title,
    };
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }
    const firmwareList =
      await this._productFirmwareRepository.getManyByProductID(
        product.product_id,
      );

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

    const firmware = await this._productFirmwareRepository.updateByID(
      existingFirmware.id,
      {
        ...existingFirmware,
        ...body,
      },
    );

    const { data: _, ...output } = firmware;

    if (current) {
      this._deviceManager.flashProductFirmware(product.product_id);
    }
    return this.ok(output);
  }

  @httpVerb('delete')
  @route('/v1/products/:productIDOrSlug/firmware/:version')
  async deleteFirmware(
    productIDOrSlug: string,
    version: string,
  ): Promise<HttpResult<Record<never, never>>> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }
    const firmwareList =
      await this._productFirmwareRepository.getManyByProductID(
        product.product_id,
      );

    const existingFirmware = firmwareList.find(
      (firmware: ProductFirmware): boolean =>
        firmware.version === parseInt(version, 10),
    );
    if (!existingFirmware) {
      return this.bad(`Firmware version ${version} does not exist`);
    }

    await this._productFirmwareRepository.deleteByID(existingFirmware.id);

    return this.ok();
  }

  _findAndUnreleaseCurrentFirmware(
    productFirmwareList: Array<ProductFirmware>,
  ): Promise<ProductFirmware[]> {
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

export default ProductFirmwaresController;
