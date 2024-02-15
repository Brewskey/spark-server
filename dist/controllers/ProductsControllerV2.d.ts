import type DeviceManager from '../managers/DeviceManager';
import type { IOrganizationRepository, IProductConfigRepository, IProductRepository, Product } from '../types';
import Controller from './Controller';
import { IDeviceAttributeRepository, IProductDeviceRepository, IProductFirmwareRepository, ProductFirmware } from 'spark-protocol';
declare class ProductsControllerV2 extends Controller {
    _deviceAttributeRepository: IDeviceAttributeRepository;
    _deviceManager: DeviceManager;
    _organizationRepository: IOrganizationRepository;
    _productConfigRepository: IProductConfigRepository;
    _productDeviceRepository: IProductDeviceRepository;
    _productFirmwareRepository: IProductFirmwareRepository;
    _productRepository: IProductRepository;
    constructor(deviceManager: DeviceManager, deviceAttributeRepository: IDeviceAttributeRepository, organizationRepository: IOrganizationRepository, productRepository: IProductRepository, productConfigRepository: IProductConfigRepository, productDeviceRepository: IProductDeviceRepository, productFirmwareRepository: IProductFirmwareRepository);
    countProducts(): Promise<any>;
    getProducts(): Promise<any>;
    createProduct(productModel: Partial<Product>): Promise<any>;
    getProduct(productIDOrSlug: string): Promise<any>;
    updateProduct(productIDOrSlug: string, productModel: Partial<Product>): Promise<any>;
    countDevices(productIDOrSlug: string): Promise<any>;
    getDevices(productIDOrSlug: string): Promise<any>;
    _formatProduct(product: Product): Partial<Product>;
    _findAndUnreleaseCurrentFirmware(productFirmwareList: Array<ProductFirmware>): Promise<any>;
    _stringToBoolean(input: string | boolean): boolean;
}
export default ProductsControllerV2;
