import { FileManager } from '@brewskey/spark-protocol';

class DeviceFirmwareFileRepository {
  _fileManager: FileManager;

  constructor(path: string) {
    this._fileManager = new FileManager(path, false);
  }

  getByName(appName: string): Buffer | null | undefined {
    return this._fileManager.getFileBuffer(`${appName}.bin`);
  }
}

export default DeviceFirmwareFileRepository;
