import fs from 'fs';
import { mkdirp } from 'mkdirp';
import path from 'path';

class FileManager {
  _directoryPath: string;

  _isJSON: boolean;

  constructor(directoryPath: string, isJSON: boolean = true) {
    this._directoryPath = directoryPath;
    this._isJSON = isJSON;
    if (!fs.existsSync(directoryPath)) {
      mkdirp.sync(directoryPath);
    }
  }

  count(): number {
    return fs.readdirSync(this._directoryPath).length;
  }

  createFile(fileName: string, data: string | Buffer) {
    if (fs.existsSync(path.join(this._directoryPath, fileName))) {
      return;
    }

    this.writeFile(fileName, data);
  }

  deleteFile(fileName: string) {
    const filePath = path.join(this._directoryPath, fileName);
    if (!fs.existsSync(filePath)) {
      return;
    }

    fs.unlinkSync(filePath);
  }

  getAllData(): Array<string> {
    return fs
      .readdirSync(this._directoryPath)
      .filter((fileName: string): boolean => fileName.endsWith('.json'))
      .map((fileName: string): string =>
        fs.readFileSync(path.join(this._directoryPath, fileName), 'utf8'),
      );
  }

  getFile(fileName: string): string | null | undefined {
    const filePath = path.join(this._directoryPath, fileName);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.readFileSync(filePath, 'utf8');
  }

  getFileBuffer(fileName: string): Buffer | null | undefined {
    const filePath = path.join(this._directoryPath, fileName);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.readFileSync(filePath);
  }

  hasFile(fileName: string): boolean {
    const filePath = path.join(this._directoryPath, fileName);
    return fs.existsSync(filePath);
  }

  writeFile(fileName: string, data: string | Buffer) {
    fs.writeFileSync(path.join(this._directoryPath, fileName), data);
  }
}

export default FileManager;
