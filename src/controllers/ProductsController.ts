/* eslint-disable */

import type DeviceManager from '../managers/DeviceManager';
import type {
  IOrganizationRepository,
  IProductConfigRepository,
  IProductRepository,
  Product,
} from '../types';

import Controller from './Controller';
import allowUpload from '../decorators/allowUpload';
import csv from 'csv';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import HttpError from '../lib/HttpError';
import formatDeviceAttributesToApi from '../lib/deviceToAPI';
import { HttpResult } from './types';
import {
  IDeviceAttributeRepository,
  IProductDeviceRepository,
  IProductFirmwareRepository,
} from 'spark-protocol';

const POST_MISSING_FIELDS = [
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

type UpdateProductsDevice = {
  id: string;
  updated_at: Date;
  desired_firmware_version?: number | undefined;
  notes?: string;
  denied?: boolean;
  development?: boolean;
  quarantined?: boolean;
};

class ProductsController extends Controller {
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
  @route('/v1/products')
  async getProducts(): Promise<any> {
    const products = await this._productRepository.getAll();
    return this.ok({
      products: products.map((product) => this._formatProduct(product)),
    });
  }

  @httpVerb('post')
  @route('/v1/products')
  async createProduct(model: { product: Partial<Product> }): Promise<any> {
    if (!model.product) {
      return this.bad('You must provide a product');
    }

    const missingFields = POST_MISSING_FIELDS.filter(
      (key) => !model.product[key] && model.product[key] !== 0,
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
    model.product.organization = organizationID;
    const product = await this._productRepository.create(model.product);
    const config = await this._productConfigRepository.create({
      org_id: organizationID,
      product_id: product.id,
    });
    product.config_id = config.id;
    await this._productRepository.updateByID(product.id, product);
    // For some reason the spark API returns it in an array.
    return this.ok({ product: [this._formatProduct(product)] });
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug')
  async getProduct(productIDOrSlug: string): Promise<any> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad('Product does not exist', 404);
    }

    return this.ok({ product: [this._formatProduct(product)] });
  }

  @httpVerb('put')
  @route('/v1/products/:productIDOrSlug')
  async updateProduct(
    productIDOrSlug: string,
    model: {
      product: Product;
    },
  ): Promise<any> {
    if (!model.product) {
      return this.bad('You must provide a product');
    }

    const missingFields = PUT_MISSING_FIELDS.filter(
      (key) => !model.product[key] && model.product[key] !== 0,
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
      ...model.product,
    });

    // For some reason the spark API returns it in an array.
    return this.ok({ product: [this._formatProduct(product)] });
  }

  @httpVerb('delete')
  @route('/v1/products/:productIDOrSlug')
  async deleteProduct(productIDOrSlug: string): Promise<any> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad('Product does not exist', 404);
    }

    await this._productRepository.deleteByID(product.id);
    await this._productFirmwareRepository.deleteByProductID(product.id);
    await this._productDeviceRepository.deleteByProductID(product.id);

    return this.ok();
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug/config')
  async getConfig(productIDOrSlug: string): Promise<any> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad('Product does not exist', 404);
    }

    const config = await this._productConfigRepository.getByProductID(
      product.product_id,
    );

    return this.ok({ product_configuration: config });
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug/devices')
  async getDevices(productIDOrSlug: string): Promise<any> {
    const { page, page_size = '25' } = this.request.query;
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const totalDevices = await this._productDeviceRepository.count({
      productID: product.product_id,
    });
    const productDevices =
      await this._productDeviceRepository.getManyByProductID(
        product.product_id,
        {
          skip: Math.max(1, page as any) - 1,
          take: parseInt(page_size.toString(), 10),
        },
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

    return this.ok({
      accounts: [],
      devices,
      meta: {
        total_pages: Math.ceil(
          totalDevices / parseInt(page_size.toString(), 10),
        ),
      },
    });
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug/devices/:deviceIDorName')
  async getSingleDevice(
    productIDOrSlug: string,
    deviceIDorName: string,
  ): Promise<any> {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const deviceAttributes =
      await this._deviceAttributeRepository.getByID(deviceID);

    if (!deviceAttributes) {
      return this.bad(`Device ${deviceID} doesn't exist.`);
    }

    const productDevice =
      await this._productDeviceRepository.getFromDeviceID(deviceID);

    if (!productDevice) {
      return this.bad(`Device ${deviceID} hasn't been assigned to a product`);
    }

    return this.ok({
      ...formatDeviceAttributesToApi(deviceAttributes),
      ...productDevice,
      product_id: product.product_id,
    });
  }

  @httpVerb('post')
  @route('/v1/products/:productIDOrSlug/devices')
  @allowUpload('file', 1)
  async addDevice(
    productIDOrSlug: string,
    body: {
      file?: Express.Multer.File;
      id?: string;
      import_method: 'many' | 'one';
    },
  ): Promise<any> {
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    let ids: Array<string> = [];
    if (body.import_method === 'many') {
      const file = body.file;
      if (!file) {
        return this.bad('No file uploaded');
      }

      const originalname = file.originalname;
      if (!originalname.endsWith('.txt') && !originalname.endsWith('.csv')) {
        return this.bad('File must be csv or txt file.');
      }

      const records = await new Promise(
        (resolve: (data: string[]) => void, reject: (error: Error) => void) =>
          csv.parse(
            file.buffer.toString('utf8'),
            (error: Error | null | undefined, data: string[]) => {
              if (error) {
                reject(error);
              }
              resolve(data);
            },
          ),
      );

      if (!records.length) {
        return this.bad(`File didn't have any ids`);
      }

      if (records.some((record) => record.length !== 1)) {
        return this.bad('File should only have a single column of device ids');
      }

      ids = [...records];
    } else {
      if (!body.id) {
        return this.bad('You must pass an id for a device');
      }

      ids = [body.id];
    }

    ids = ids.map((id) => id.toLowerCase());

    const deviceAttributes =
      await this._deviceAttributeRepository.getManyFromIDs(ids);

    const incorrectPlatformDeviceIDs = deviceAttributes
      .filter(
        (deviceAttribute) =>
          deviceAttribute.platformId !== undefined &&
          deviceAttribute.platformId !== product.platform_id,
      )
      .map((deviceAttribute) => deviceAttribute.deviceID);

    const existingProductDeviceIDs = (
      await this._productDeviceRepository.getManyFromDeviceIDs(ids)
    ).map((productDevice) => productDevice.deviceID);

    const invalidDeviceIds = [
      ...incorrectPlatformDeviceIDs,
      ...existingProductDeviceIDs,
    ];

    const deviceAttributeIDs = deviceAttributes.map(
      (deviceAttribute) => deviceAttribute.deviceID,
    );

    const nonmemberDeviceIds = ids.filter(
      (id) => !deviceAttributeIDs.includes(id),
    );

    if (invalidDeviceIds.length) {
      return {
        data: {
          updated: 0,
          nonmemberDeviceIds,
          invalidDeviceIds,
        },
        status: 400,
      };
    }

    const idsToCreate = ids.filter(
      (id) =>
        !invalidDeviceIds.includes(id) &&
        !existingProductDeviceIDs.includes(id),
    );

    const createdProductDevices = await Promise.all(
      idsToCreate.map((id) =>
        this._productDeviceRepository.create({
          denied: false,
          development: false,
          deviceID: id,
          lockedFirmwareVersion: null,
          productFirmwareVersion: 65535,
          productID: product.product_id,
          quarantined: nonmemberDeviceIds.includes(id),
        }),
      ),
    );

    // flash devices
    createdProductDevices.forEach((productDevice) => {
      this._deviceManager.flashProductFirmware(
        productDevice.productID,
        productDevice.deviceID,
      );
    });

    return this.ok({
      updated: idsToCreate.length,
      nonmemberDeviceIds,
      invalidDeviceIds,
    });
  }

  @httpVerb('put')
  @route('/v1/products/:productIDOrSlug/devices/:deviceIDorName')
  async updateProductDevice(
    productIDOrSlug: string,
    deviceIDorName: string,
    {
      denied,
      desired_firmware_version,
      development,
      notes,
      quarantined,
    }: {
      denied?: boolean;
      desired_firmware_version?: number | null | undefined;
      development?: boolean;
      notes?: string;
      quarantined?: boolean;
    },
  ): Promise<HttpResult<UpdateProductsDevice>> {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const productDevice =
      await this._productDeviceRepository.getFromDeviceID(deviceID);

    if (!productDevice) {
      return this.bad(`Device ${deviceID} is not associated with a product`);
    }

    let shouldFlash = false;
    let output: UpdateProductsDevice = {
      id: productDevice.id,
      updated_at: new Date(),
    };
    if (desired_firmware_version !== undefined) {
      const deviceFirmwares =
        await this._productFirmwareRepository.getManyByProductID(
          product.product_id,
        );

      const parsedFirmware =
        desired_firmware_version !== null
          ? parseInt(desired_firmware_version.toString(), 10)
          : null;
      if (
        parsedFirmware !== null &&
        !deviceFirmwares.find((firmware) => firmware.version === parsedFirmware)
      ) {
        return this.bad(`Firmware version ${parsedFirmware} does not exist`);
      }

      productDevice.lockedFirmwareVersion = parsedFirmware;
      output = {
        ...output,
        desired_firmware_version: desired_firmware_version
          ? parseInt(desired_firmware_version.toString(), 10)
          : undefined,
      };

      shouldFlash = true;
    }

    if (notes !== undefined) {
      productDevice.notes = notes;
      output = { ...output, notes };
    }

    if (development !== undefined) {
      productDevice.development = development;
      output = { ...output, development };
    }

    if (denied !== undefined) {
      productDevice.denied = denied;
      output = { ...output, denied };
    }

    if (quarantined !== undefined) {
      productDevice.quarantined = quarantined;
      output = { ...output, quarantined };
      shouldFlash = true;
    }

    const updatedProductDevice = await this._productDeviceRepository.updateByID(
      productDevice.id,
      productDevice,
    );

    if (shouldFlash) {
      this._deviceManager.flashProductFirmware(
        productDevice.productID,
        productDevice.deviceID,
      );
    }

    return this.ok(output);
  }

  @httpVerb('delete')
  @route('/v1/products/:productIDOrSlug/devices/:deviceIDorName')
  async removeDeviceFromProduct(
    productIDOrSlug: string,
    deviceIDorName: string,
  ): Promise<any> {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    const product =
      await this._productRepository.getByIDOrSlug(productIDOrSlug);
    if (!product) {
      return this.bad(`${productIDOrSlug} does not exist`);
    }

    const productDevice =
      await this._productDeviceRepository.getFromDeviceID(deviceID);

    if (!productDevice) {
      return this.bad(
        `Device ${deviceID} was not mapped to ${productIDOrSlug}`,
      );
    }

    await this._productDeviceRepository.deleteByID(productDevice.id);
    return this.ok();
  }

  @httpVerb('get')
  @route('/v1/products/:productIdOrSlug/events/:eventPrefix?*')
  async getEvents(productIdOrSlug: string, eventName: string): Promise<any> {
    throw new HttpError('Not implemented');
  }

  @httpVerb('delete')
  @route('/v1/products/:productIdOrSlug/team/:username')
  async removeTeamMember(
    productIdOrSlug: string,
    username: string,
  ): Promise<any> {
    throw new HttpError('not supported in the current server version');
  }

  _formatProduct(product: Product): Partial<Product> {
    const { product_id, ...output } = product;
    output.id = product_id;
    return output;
  }
}

export default ProductsController;
/* eslint-enable */
