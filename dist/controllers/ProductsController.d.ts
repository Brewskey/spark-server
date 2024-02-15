/// <reference types="multer" />
import type DeviceManager from '../managers/DeviceManager';
import type { IOrganizationRepository, IProductConfigRepository, IProductRepository, Product } from '../types';
import Controller from './Controller';
import { HttpResult } from './types';
import { IDeviceAttributeRepository, IProductDeviceRepository, IProductFirmwareRepository } from 'spark-protocol';
type UpdateProductsDevice = {
    id: string;
    updated_at: Date;
    desired_firmware_version?: number | undefined;
    notes?: string;
    denied?: boolean;
    development?: boolean;
    quarantined?: boolean;
};
declare class ProductsController extends Controller {
    _deviceAttributeRepository: IDeviceAttributeRepository;
    _deviceManager: DeviceManager;
    _organizationRepository: IOrganizationRepository;
    _productConfigRepository: IProductConfigRepository;
    _productDeviceRepository: IProductDeviceRepository;
    _productFirmwareRepository: IProductFirmwareRepository;
    _productRepository: IProductRepository;
    constructor(deviceManager: DeviceManager, deviceAttributeRepository: IDeviceAttributeRepository, organizationRepository: IOrganizationRepository, productRepository: IProductRepository, productConfigRepository: IProductConfigRepository, productDeviceRepository: IProductDeviceRepository, productFirmwareRepository: IProductFirmwareRepository);
    getProducts(): Promise<any>;
    createProduct(model: {
        product: Partial<Product>;
    }): Promise<any>;
    getProduct(productIDOrSlug: string): Promise<any>;
    updateProduct(productIDOrSlug: string, model: {
        product: Product;
    }): Promise<any>;
    deleteProduct(productIDOrSlug: string): Promise<any>;
    getConfig(productIDOrSlug: string): Promise<any>;
    getDevices(productIDOrSlug: string): Promise<any>;
    getSingleDevice(productIDOrSlug: string, deviceIDorName: string): Promise<any>;
    addDevice(productIDOrSlug: string, body: {
        file?: Express.Multer.File;
        id?: string;
        import_method: 'many' | 'one';
    }): Promise<any>;
    updateProductDevice(productIDOrSlug: string, deviceIDorName: string, { denied, desired_firmware_version, development, notes, quarantined, }: {
        denied?: boolean;
        desired_firmware_version?: number | null | undefined;
        development?: boolean;
        notes?: string;
        quarantined?: boolean;
    }): Promise<HttpResult<UpdateProductsDevice>>;
    removeDeviceFromProduct(productIDOrSlug: string, deviceIDorName: string): Promise<any>;
    getEvents(productIdOrSlug: string, eventName: string): Promise<any>;
    removeTeamMember(productIdOrSlug: string, username: string): Promise<any>;
    _formatProduct(product: Product): Partial<Product>;
}
export default ProductsController;
