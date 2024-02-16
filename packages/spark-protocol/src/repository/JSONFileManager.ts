import FileManager from './FileManager';

class JSONFileManager extends FileManager {
  createFile<TModel>(fileName: string, model: TModel) {
    super.writeFile(fileName, JSON.stringify(model, null, 2));
  }

  getAllData<TModel>(): Array<TModel> {
    return super.getAllData().map((data: string): TModel => JSON.parse(data));
  }

  getFile<TModel>(fileName: string): TModel | null | undefined {
    const data = super.getFile(fileName);
    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  writeFile<TModel>(fileName: string, model: TModel): void {
    return super.writeFile(fileName, JSON.stringify(model, null, 2));
  }
}

export default JSONFileManager;
