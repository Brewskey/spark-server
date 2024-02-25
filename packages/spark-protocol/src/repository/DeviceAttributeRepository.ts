import { Repository } from 'typeorm';

import { MutateDeviceAttributesDTO } from '../dto/MutateDeviceAttributesDTO.dto';
import { DeviceAttributes } from '../entity/DeviceAttributes.entity';
import { RepositoryBase } from './RepositoryBase';

export class DeviceAttributeRepository extends RepositoryBase<
  DeviceAttributes,
  MutateDeviceAttributesDTO,
  string
> {
  constructor(repository: Repository<DeviceAttributes>) {
    super(DeviceAttributes, repository);
  }

  async getByName(deviceName: string): Promise<DeviceAttributes> {
    return this.repository.findOneByOrFail({ name: deviceName });
  }
}
