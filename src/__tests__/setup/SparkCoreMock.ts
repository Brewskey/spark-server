class SparkCoreMock {
  onApiMessage: () => boolean = (): boolean => true;

  getVariableValue = (): unknown => 0;

  getDescription = () => ({
    firmware_version: '0.6.0',
    product_id: '6',
    state: {
      f: null,
      v: null,
    },
  });

  ping = () => ({
    connected: false,
    lastPing: new Date(),
  });
}

export default SparkCoreMock;
