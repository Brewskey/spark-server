const SPARK_SERVER_EVENTS = {
  CALL_DEVICE_FUNCTION: 'spark-server/call_device_function',
  FLASH_DEVICE: 'spark-server/flash_device',
  FLASH_PRODUCT_FIRMWARE: 'spark-server/flash_product_firmware',
  GET_DEVICE_ATTRIBUTES: 'spark-server/get_attributes',
  GET_DEVICE_VARIABLE_VALUE: 'spark-server/get_device_variable_value',
  FORCE_UPDATES_FOR_DEVICE: 'spark-server/force_updates_for_device',
  PING_DEVICE: 'spark-server/ping_device',
  RAISE_YOUR_HAND: 'spark-server/raise_your_hand',
  UPDATE_DEVICE_ATTRIBUTES: 'spark-server/update_device_attributes',
} as const;

export default SPARK_SERVER_EVENTS;
