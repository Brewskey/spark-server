import type DeviceManager from '../managers/DeviceManager';
import type { IProductRepository } from '../types';
import Controller from './Controller';
import { IProductDeviceRepository, IProductFirmwareRepository, ProductFirmware } from 'spark-protocol';
import { HttpResult } from './types';
type APIProductFirmware = Omit<ProductFirmware, 'data'> & {
    device_count: number;
};
declare class ProductFirmwaresControllerV2 extends Controller {
    _deviceManager: DeviceManager;
    _productDeviceRepository: IProductDeviceRepository;
    _productFirmwareRepository: IProductFirmwareRepository;
    _productRepository: IProductRepository;
    constructor(deviceManager: DeviceManager, productDeviceRepository: IProductDeviceRepository, productFirmwareRepository: IProductFirmwareRepository, productRepository: IProductRepository);
    countFirmwares(productIDOrSlug: string): Promise<HttpResult<number>>;
    getFirmwares(productIDOrSlug: string): Promise<HttpResult<APIProductFirmware[]>>;
    getFirmware(productIDOrSlug: string, firmwareID: string): Promise<HttpResult<APIProductFirmware>>;
}
export default ProductFirmwaresControllerV2;
