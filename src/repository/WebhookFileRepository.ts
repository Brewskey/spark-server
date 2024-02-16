import * as uuid from 'uuid';
import { JSONFileManager } from '@brewskey/spark-protocol';
import HttpError from '../lib/HttpError';
import type { IWebhookRepository, Webhook } from '../types';

class WebhookFileRepository implements IWebhookRepository {
  _fileManager: JSONFileManager;

  constructor(path: string) {
    this._fileManager = new JSONFileManager(path);
  }

  count: () => Promise<number> = async (): Promise<number> =>
    this._fileManager.count();

  async create(model: Webhook): Promise<Webhook> {
    let id = uuid.v4();

    // eslint-disable-next-line no-await-in-loop
    while (await this._fileManager.hasFile(`${id}.json`)) {
      id = uuid.v4();
    }

    const modelToSave: Webhook = {
      ...model,
      created_at: new Date(),
      id,
    };

    this._fileManager.createFile(`${modelToSave.id}.json`, modelToSave);
    return modelToSave;
  }

  async deleteByID(id: string) {
    this._fileManager.deleteFile(`${id}.json`);
  }

  getAll: (userID?: string | null | undefined) => Promise<Array<Webhook>> =
    async (userID: string | null = null): Promise<Array<Webhook>> => {
      const allData = await this._getAll();

      if (userID) {
        return allData.filter(
          (webhook: Webhook): boolean => webhook.ownerID === userID,
        );
      }
      return allData;
    };

  async getByID(id: string): Promise<Webhook | null | undefined> {
    return this._fileManager.getFile(`${id}.json`);
  }

  // eslint-disable-next-line no-unused-vars
  updateByID: () => Promise<Webhook> = async (): Promise<Webhook> => {
    throw new HttpError('Not implemented');
  };

  async _getAll(): Promise<Array<Webhook>> {
    return this._fileManager.getAllData();
  }
}

export default WebhookFileRepository;
