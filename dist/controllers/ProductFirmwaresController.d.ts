/// <reference types="multer" />
import type DeviceManager from '../managers/DeviceManager';
import type { IProductRepository } from '../types';
import Controller from './Controller';
import { HttpResult } from './types';
import { ProductFirmware, IProductDeviceRepository, IProductFirmwareRepository } from 'spark-protocol';
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
declare class ProductFirmwaresController extends Controller {
    _deviceManager: DeviceManager;
    _productDeviceRepository: IProductDeviceRepository;
    _productFirmwareRepository: IProductFirmwareRepository;
    _productRepository: IProductRepository;
    constructor(deviceManager: DeviceManager, productDeviceRepository: IProductDeviceRepository, productFirmwareRepository: IProductFirmwareRepository, productRepository: IProductRepository);
    getFirmwares(productIDOrSlug: string): Promise<HttpResult<ProductFirmwareAPIResult[]>>;
    getSingleFirmware(productIDOrSlug: string, version: string): Promise<HttpResult<ProductFirmwareAPIResult>>;
    addFirmware(productIDOrSlug: string, body: ProductFirmwareUpload): Promise<HttpResult<ProductFirmwareAPIResult>>;
    updateFirmware(productIDOrSlug: string, version: string, body: Partial<ProductFirmware>): Promise<HttpResult<ProductFirmwareAPIResult>>;
    deleteFirmware(productIDOrSlug: string, version: string): Promise<HttpResult<Record<never, never>>>;
    _findAndUnreleaseCurrentFirmware(productFirmwareList: Array<ProductFirmware>): Promise<ProductFirmware[]>;
    _stringToBoolean(input: string | boolean): boolean;
}
export default ProductFirmwaresController;
