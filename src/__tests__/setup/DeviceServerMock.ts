import SparkCoreMock from './SparkCoreMock';

class DeviceServerMock {
  getDevice: () => SparkCoreMock = (): SparkCoreMock => new SparkCoreMock();
}

export default DeviceServerMock;
