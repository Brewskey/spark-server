/* eslint-disable no-unused-vars */

import type { IProductFirmwareRepository, ProductFirmware } from '../types';

// getByID, deleteByID and update uses model.deviceID as ID for querying
class MockProductFirmwareRepository implements IProductFirmwareRepository {
  countByProductID(
    productID: number,
    query?: Record<string, unknown> | undefined,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }

  getManyByProductID(
    productID: number,
    query?: Record<string, unknown> | undefined,
  ): Promise<ProductFirmware[]> {
    throw new Error('Method not implemented.');
  }

  deleteByProductID(_productID: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  count(..._filters: unknown[]): Promise<number> {
    throw new Error('Method not implemented.');
  }

  create(_model: Partial<ProductFirmware>): Promise<ProductFirmware> {
    throw new Error('The method is not implemented');
  }

  async deleteByID(_productFirmwareID: string) {
    throw new Error('The method is not implemented');
  }

  // eslint-disable-next-line
  getAll(): Promise<Array<ProductFirmware>> {
    throw new Error('The method is not implemented');
  }

  getAllByProductID(_productID: number): Promise<Array<ProductFirmware>> {
    throw new Error('The method is not implemented');
  }

  getByVersionForProduct(
    _productID: number,
    _version: number,
  ): Promise<ProductFirmware | null | undefined> {
    throw new Error('The method is not implemented');
  }

  getCurrentForProduct(
    _productID: number,
  ): Promise<ProductFirmware | null | undefined> {
    throw new Error('The method is not implemented');
  }

  getByID(
    _productFirmwareID: string,
  ): Promise<ProductFirmware | null | undefined> {
    throw new Error('The method is not implemented');
  }

  updateByID(
    _productFirmwareID: string,
    _props: Partial<ProductFirmware>,
  ): Promise<ProductFirmware> {
    throw new Error('The method is not implemented');
  }
}

export default MockProductFirmwareRepository;
