import { Repository } from 'typeorm';

import { DeviceKeyObject } from '../entity/DeviceKeyObject.entity';
import { RepositoryBase } from './RepositoryBase';

type MutateDeviceKeyObjectDTO = Omit<
  DeviceKeyObject,
  'createdAt' | 'updatedAt'
>;

export class DeviceKeyObjectRepository extends RepositoryBase<
  DeviceKeyObject,
  MutateDeviceKeyObjectDTO,
  string
> {
  constructor(repository: Repository<DeviceKeyObject>) {
    super(DeviceKeyObject, repository);
  }

  findOneByDeviceID(deviceID: string): Promise<DeviceKeyObject | null> {
    return this.repository.findOneBy({ deviceID });
  }
}
