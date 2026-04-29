import type { IProductDeviceRepository, ProductDevice } from '../types';

// getByID, deleteByID and update uses model.deviceID as ID for querying
class MockProductDeviceRepository implements IProductDeviceRepository {
  countByProductID(
    _productID: number,
    _query?: Record<string, unknown> | undefined,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }

  getManyByProductID(
    _productID: number,
    _query?: Record<string, unknown> | undefined,
  ): Promise<ProductDevice[]> {
    throw new Error('Method not implemented.');
  }

  getManyFromDeviceIDs(_deviceIDs: string[]): Promise<ProductDevice[]> {
    throw new Error('Method not implemented.');
  }

  deleteByProductID(_productID: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  count(..._filters: unknown[]): Promise<number> {
    throw new Error('Method not implemented.');
  }

  create(_model: Partial<ProductDevice>): Promise<ProductDevice> {
    throw new Error('The method is not implemented');
  }

  async deleteByID(_productDeviceID: string) {
    throw new Error('The method is not implemented');
  }

  getAll(): Promise<Array<ProductDevice>> {
    throw new Error('The method is not implemented');
  }

  getByID(_productDeviceID: string): Promise<ProductDevice | null | undefined> {
    throw new Error('The method is not implemented');
  }

  getAllByProductID(
    _productID: number,
    _page: number,
    _perPage: number,
  ): Promise<Array<ProductDevice>> {
    throw new Error('The method is not implemented');
  }

  // This is here just to make things work when used without spark-server
  async getFromDeviceID(
    _deviceID: string,
  ): Promise<ProductDevice | null | undefined> {
    return null;
  }

  updateByID(
    _productDeviceID: string,
    _props: Partial<ProductDevice>,
  ): Promise<ProductDevice> {
    throw new Error('The method is not implemented');
  }
}

export default MockProductDeviceRepository;
