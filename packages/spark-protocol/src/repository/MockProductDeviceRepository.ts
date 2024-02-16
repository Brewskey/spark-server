/* eslint-disable no-unused-vars */

import type { IProductDeviceRepository, ProductDevice } from '../types';

// getByID, deleteByID and update uses model.deviceID as ID for querying
class MockProductDeviceRepository implements IProductDeviceRepository {
  countByProductID(
    productID: number,
    query?: Record<string, unknown> | undefined,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }

  getManyByProductID(
    productID: number,
    query?: Record<string, unknown> | undefined,
  ): Promise<ProductDevice[]> {
    throw new Error('Method not implemented.');
  }

  getManyFromDeviceIDs(deviceIDs: string[]): Promise<ProductDevice[]> {
    throw new Error('Method not implemented.');
  }

  deleteByProductID(productID: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  count(...filters: unknown[]): Promise<number> {
    throw new Error('Method not implemented.');
  }

  create(model: Partial<ProductDevice>): Promise<ProductDevice> {
    throw new Error('The method is not implemented');
  }

  async deleteByID(productDeviceID: string) {
    throw new Error('The method is not implemented');
  }

  // eslint-disable-next-line
  getAll(): Promise<Array<ProductDevice>> {
    throw new Error('The method is not implemented');
  }

  getByID(productDeviceID: string): Promise<ProductDevice | null | undefined> {
    throw new Error('The method is not implemented');
  }

  getAllByProductID(
    productID: number,
    page: number,
    perPage: number,
  ): Promise<Array<ProductDevice>> {
    throw new Error('The method is not implemented');
  }

  // This is here just to make things work when used without spark-server
  async getFromDeviceID(
    deviceID: string,
  ): Promise<ProductDevice | null | undefined> {
    return null;
  }

  updateByID(
    productDeviceID: string,
    props: Partial<ProductDevice>,
  ): Promise<ProductDevice> {
    throw new Error('The method is not implemented');
  }
}

/* eslint-enable no-unused-vars */

export default MockProductDeviceRepository;
