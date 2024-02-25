import {
  DeviceAttributeRepository,
  objectAssign,
  Platform,
  Product,
  ProductConfig,
  ProductDeviceRepository,
  ProductFirmwareRepository,
  ProductType,
} from '@brewskey/spark-protocol';
import csv from 'csv';
import { In } from 'typeorm';

import allowUpload from '../decorators/allowUpload';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import formatDeviceAttributesToApi, { DeviceAPIType } from '../lib/deviceToAPI';
import HttpError from '../lib/HttpError';
import type DeviceManager from '../managers/DeviceManager';
import OrganizationRepository from '../repository/OrganizationRepository';
import ProductConfigRepository from '../repository/ProductConfigRepository';
import { ProductRepository } from '../repository/ProductRepository';
import Controller from './Controller';
import { HttpResult } from './types';

const POST_MISSING_FIELDS = [
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
  id?: number;
  description: string;
  hardware_version: string;
  name: string;
  platform_id: Platform;
  type: ProductType;
  org: number | null;
  config_id?: number | null;
};

type UpdateProductsDevice = {
  id: number;
  updated_at: Date;
  desired_firmware_version?: number | undefined;
  notes?: string;
  denied?: boolean;
  development?: boolean;
  quarantined?: boolean;
};

class ProductsController extends Controller {
  constructor(
    private readonly deviceManager: DeviceManager,
    private readonly deviceAttributeRepository: DeviceAttributeRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly productRepository: ProductRepository,
    private readonly productConfigRepository: ProductConfigRepository,
    private readonly productDeviceRepository: ProductDeviceRepository,
    private readonly productFirmwareRepository: ProductFirmwareRepository,
  ) {
    super();
  }

  @httpVerb('get')
  @route('/v1/products')
  async getProducts(): Promise<HttpResult<{ products: Product[] }>> {
    const products = await this.productRepository.find();
    return this.ok({
      products,
    });
  }

  @httpVerb('post')
  @route('/v1/products')
  async createProduct(model: {
    product: MutateProductDTO;
  }): Promise<HttpResult<{ product: Product[] }>> {
    if (!model.product) {
      return this.bad('You must provide a product');
    }

    const missingFields = POST_MISSING_FIELDS.filter(
      (key) => !model.product[key] && model.product[key] !== 0,
    );
    if (missingFields.length) {
      return this.bad(`Missing fields: ${missingFields.join(', ')}`);
    }

    const organizations = await this.organizationRepository.getByUserID(
      this.user.id,
    );
    if (!organizations.length) {
      return this.bad("You don't have access to any organizations");
    }

    const product = await this.productRepository.create({
      ...model.product,
      productConfig: objectAssign(new ProductConfig(), {
        organizationID: model.product.org ?? null,
      }),
      ownerID: this.user.id,
      organizationID: model.product.org ?? null,
      platformID: model.product.platform_id,
    });

    // For some reason the spark API returns it in an array.
    return this.ok({ product: [product] });
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug')
  async getProduct(
    productIDOrSlug: string,
  ): Promise<HttpResult<{ product: Product[] }>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);

    return this.ok({ product: [product] });
  }

  @httpVerb('put')
  @route('/v1/products/:productIDOrSlug')
  async updateProduct(
    productIDOrSlug: string,
    model: {
      product: MutateProductDTO;
    },
  ): Promise<HttpResult<{ product: Product[] }>> {
    if (!model.product) {
      return this.bad('You must provide a product');
    }

    const missingFields = PUT_MISSING_FIELDS.filter(
      (key) => !model.product[key] && model.product[key] !== 0,
    );
    if (missingFields.length) {
      return this.bad(`Missing fields: ${missingFields.join(', ')}`);
    }

    let product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    product = await this.productRepository.updateByID(product.id, {
      ...product,
      ...model.product,
    });

    // For some reason the spark API returns it in an array.
    return this.ok({ product: [product] });
  }

  @httpVerb('delete')
  @route('/v1/products/:productIDOrSlug')
  async deleteProduct(
    productIDOrSlug: string,
  ): Promise<HttpResult<Record<never, never>>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);

    await this.productRepository.deleteByID(product.id);
    await this.productFirmwareRepository.deleteByProductID(product.id);
    await this.productDeviceRepository.deleteByProductID(product.id);

    return this.ok();
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug/config')
  async getConfig(
    productIDOrSlug: string,
  ): Promise<HttpResult<{ product_configuration: ProductConfig }>> {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const config = await this.productConfigRepository.findByProductIDOrFail(
      product.id,
    );

    return this.ok({ product_configuration: config });
  }

  @httpVerb('get')
  @route('/v1/products/:productIDOrSlug/devices')
  async getDevices(productIDOrSlug: string): Promise<
    HttpResult<{
      accounts: unknown[];
      devices: DeviceAPIType[];
      meta: {
        total_pages: number;
      };
    }>
  > {
    const { page, page_size = '25' } = this.request.query;
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const totalDevices = await this.productDeviceRepository.count({
      where: { productID: product.id },
    });
    const productDevices = await this.productDeviceRepository.find({
      where: { productID: product.id },
      skip: Number.isFinite(page) ? Math.max(1, Number(page)) - 1 : 0,
      take: parseInt(page_size.toString(), 10),
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
  ): Promise<HttpResult<DeviceAPIType>> {
    const deviceID = await this.deviceManager.getDeviceID(deviceIDorName);
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const deviceAttributes =
      await this.deviceAttributeRepository.findOneByIDOrFail(deviceID);
    const { id: _, ...productDevice } =
      await this.productDeviceRepository.getFromDeviceID(deviceID);

    return this.ok({
      ...formatDeviceAttributesToApi(deviceAttributes),
      ...productDevice,
      product_id: product.id,
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
  ): Promise<
    HttpResult<{
      updated: number;
      nonmemberDeviceIds: string[];
      invalidDeviceIds: string[];
    }>
  > {
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
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
        return this.bad("File didn't have any ids");
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

    const deviceAttributes = await this.deviceAttributeRepository.find({
      where: { deviceID: In(ids) },
    });

    const incorrectPlatformDeviceIDs = deviceAttributes
      .filter(
        (deviceAttribute) =>
          deviceAttribute.platformId !== undefined &&
          deviceAttribute.platformId !== product.platformID,
      )
      .map((deviceAttribute) => deviceAttribute.deviceID);

    const existingProductDeviceIDs = (
      await this.productDeviceRepository.find({
        select: { deviceID: true },
        where: { deviceID: In(ids) },
      })
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
        this.productDeviceRepository.create({
          isDenied: false,
          isDevelopment: false,
          deviceID: id,
          lockedFirmwareVersion: null,
          productFirmwareVersion: 65535,
          productID: product.id,
          isQuarantined: nonmemberDeviceIds.includes(id),
          notes: '',
        }),
      ),
    );

    // flash devices
    createdProductDevices.forEach((productDevice) => {
      this.deviceManager.flashProductFirmware(
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
    const deviceID = await this.deviceManager.getDeviceID(deviceIDorName);
    const product =
      await this.productRepository.findByIDOrSlugOrFail(productIDOrSlug);
    const productDevice =
      await this.productDeviceRepository.getFromDeviceID(deviceID);

    if (!productDevice) {
      return this.bad(`Device ${deviceID} is not associated with a product`);
    }

    let shouldFlash = false;
    let output: UpdateProductsDevice = {
      id: productDevice.id,
      updated_at: new Date(),
    };
    if (desired_firmware_version !== undefined) {
      const deviceFirmwares = await this.productFirmwareRepository.find({
        where: { productID: product.id },
      });

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
      productDevice.isDevelopment = development;
      output = { ...output, development };
    }

    if (denied !== undefined) {
      productDevice.isDenied = denied;
      output = { ...output, denied };
    }

    if (quarantined !== undefined) {
      productDevice.isQuarantined = quarantined;
      output = { ...output, quarantined };
      shouldFlash = true;
    }

    await this.productDeviceRepository.updateByID(
      productDevice.id,
      productDevice,
    );

    if (shouldFlash) {
      this.deviceManager.flashProductFirmware(
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
  ): Promise<HttpResult<Record<never, never>>> {
    const deviceID = await this.deviceManager.getDeviceID(deviceIDorName);
    const productDevice =
      await this.productDeviceRepository.getFromDeviceID(deviceID);

    if (!productDevice) {
      return this.bad(
        `Device ${deviceID} was not mapped to ${productIDOrSlug}`,
      );
    }

    await this.productDeviceRepository.deleteByID(productDevice.id);
    return this.ok();
  }

  @httpVerb('get')
  @route('/v1/products/:productIdOrSlug/events/:eventPrefix?*')
  async getEvents(
    _productIdOrSlug: string,
    _eventName: string,
  ): Promise<HttpResult<Record<never, never>>> {
    throw new HttpError('Not implemented');
  }

  @httpVerb('delete')
  @route('/v1/products/:productIdOrSlug/team/:username')
  async removeTeamMember(
    _productIdOrSlug: string,
    _username: string,
  ): Promise<HttpResult<Record<never, never>>> {
    throw new HttpError('not supported in the current server version');
  }
}

export default ProductsController;
